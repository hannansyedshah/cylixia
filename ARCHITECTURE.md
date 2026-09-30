# How Cylixia works

A walkthrough of the actual request path, written so someone who has never seen the repo can follow what happens between "user types a question" and "a plot appears on screen."

---

## 1. Where the pieces run

Three deployment targets, three different reasons.

| Piece | Runs on | Why there |
|---|---|---|
| Next.js app (UI + server actions) | Vercel | Server actions need to sit next to the UI; Vercel's edge/serverless model fits a request-response workload with no long-running jobs |
| `_r-executor/`, `_pythonscript-executor/` | Railway (Docker) | These need a **real long-lived container** with R, system libraries, and a filesystem. Serverless is the wrong shape — cold-starting `rocker/tidyverse` per request would be brutal, and the R image is ~2GB |
| Postgres, Auth, Storage, Realtime | Supabase | One managed service covering four needs, with row-level security and a realtime subscription channel I'd otherwise have to build |

**On orchestration:** there is no Kubernetes here. Each executor is a single Docker image; Railway handles the build, the process supervision, and gives it an internal URL. The app finds it through an environment variable resolved per language:

```ts
executionUrlEnvVar: 'R_EXECUTION_URL'   // in templates/openai/languages/r.ts
```

That indirection is the part that matters architecturally — the app doesn't know *where* R runs, only that something at that URL speaks the `/run` contract. Moving an executor to K8s, a VM, or a customer's own network is a config change, not a code change.

---

## 2. End-to-end: one question, traced

A user opens a project with `growth_data.csv` uploaded and types *"plot growth rate by treatment concentration."*

### Step 1 — Client collects intent

`components/workspace/ChatPanel.tsx` → `hooks/workspace/useChatPanel.ts` assembles a `ChatRequest`:

```ts
{ prompt, mode: 'generate', existingCode, csvFiles, privacyMode: true,
  contextWindow, isNistProject, language: 'r' }
```

`mode` is the first routing decision and it's set by the UI, not inferred from the text. `'generate'` means *write me code*; `'ask'` means *answer a question about my data or code*. Same model, different contract.

### Step 2 — Server action takes over

`actions/chat.ts` runs `'use server'`, so everything below here is server-side. The API key never reaches the browser.

**Privacy substitution happens here, before anything else:**

```ts
csvData: privacyMode ? randomizeCSVData(f.csvData) : f.csvData
```

`utils/dataRandomizer.ts` profiles each column — numeric (with min/max), date, boolean, or text (capturing the distinct set when cardinality ≤ 20) — then emits a synthetic CSV with the **same headers, same row count, same types, same ranges**. The model sees the shape of the data, never the values.

### Step 3 — Prompt assembly (the routing layer)

`lib/openai/api.ts` builds a two-message request. The system prompt is composed from three independent inputs:

```ts
getSystemPrompt(mode, isNistProject, language)
  → config.basePrompt        // language-specific: R idioms, tidyverse rules
  + NIST_ADDENDUM            // only if the project is NIST-flagged
  + outputFormat             // generateFormat or askFormat
```

So the "routing" is a 2 × 2 × N matrix — mode × NIST flag × language — resolved by composition rather than by branching. Adding a language adds one config object; adding a mode adds one format string. Nothing else in the pipeline changes.

The user message (`templates/openai/messages/userMessage.ts`) carries the prompt, the (possibly synthetic) CSV, any existing code for iteration, the project's context window, and images if present — `gpt-4o`, so the vision path is the same call.

### Step 4 — The model call

```ts
model: 'gpt-4o', temperature: 0.3, max_tokens: 4096
```

Temperature 0.3 is deliberate: this is code generation, not prose. I want the same question to produce substantially the same script.

`lib/openai/client.ts` holds the client as a module-level singleton so serverless invocations that reuse a warm container don't re-instantiate it, and maps API failures to messages a researcher can act on:

```ts
if (error.status === 429) throw new Error('Rate limit exceeded. Please try again in a moment.')
if (error.message?.includes('maximum context length'))
  throw new Error('Request too large. Please reduce the amount of data being sent.')
```

### Step 5 — Parsing, with three fallbacks

`utils/openaiParser.ts` is where I stopped trusting the model to obey its own output contract. The prompt asks for JSON. The parser assumes it might not get it:

1. **Try JSON** — strip ` ```json ` fences, `JSON.parse`, pull `config.codeField` (`r_code` or `python_code`), plus `explanation`, `plot_description`, `next_suggestions`
2. **Try a fenced code block** — regex for ` ```r ` / ` ```python `
3. **Heuristic** — does the text contain `library(`, `ggplot(`, `<-` for R, or the Python equivalents? Then treat the whole thing as code
4. Otherwise return it as a chat message

Tier 3 is doing real work in production. Models drift out of JSON when the answer is long or when the question was conversational, and a rigid parser would have surfaced that to the user as an empty editor.

In `'ask'` mode there's an extra gate: if the response contains no code indicators, the code field is dropped entirely so a prose answer doesn't overwrite the user's working script.

```ts
const hasCodeIndicator = config.codeIndicators.some(i => response.code?.includes(i))
if (mode === 'ask' && (!response.code || !hasCodeIndicator)) { /* explanation only */ }
```

### Step 6 — Code lands in the editor

Monaco (`components/workspace/CodePanel.tsx`), with `config.monacoLanguage` picking the syntax mode. The user sees the code *before* it runs and can edit it. That was a deliberate product call from customer discovery — researchers wanted to inspect, not just trust.

### Step 7 — Execution

`actions/execute.ts`. **Authorization first**, because collaboration means the client can't be trusted:

```ts
const canEdit = await canEditProject(request.projectId)
if (!canEdit) return { stderr: 'You do not have permission to execute code in this project' }
```

Then resolve the executor URL by language and POST:

```json
{ "code": "...", "csv_files": [{ "filename": "growth_data.csv", "data_base64": "..." }] }
```

CSVs travel base64-encoded in the JSON body. Not the most efficient transport, but it keeps the executor a single stateless endpoint with no shared volume and no storage credentials — which is what lets it be moved or duplicated freely.

### Step 8 — Inside the container

`_r-executor/app.py`, ~80 lines:

1. `tempfile.mkdtemp()` — a fresh working directory per request
2. Decode and write the CSVs into it
3. Wrap the generated code so plots are captured to files rather than a display device:

```python
R_WRAPPER = """
png("plot_%03d.png", width=800, height=600, res=120)
{code}
while (dev.cur() > 1) dev.off()
"""
```

That `while (dev.cur() > 1) dev.off()` matters — R keeps graphics devices open, and without draining them the last plot never flushes to disk. The `%03d` lets one script emit multiple numbered plots.

4. `subprocess.run(["Rscript", "--vanilla", script], cwd=work_dir, timeout=120)`

`--vanilla` skips user profiles and saved workspaces, so every run starts from an identical interpreter state. No leakage between requests.

5. Collect any `plot_*.png`, base64-encode them
6. Return `{ success, stdout, stderr, plot_base64 }`
7. `finally: shutil.rmtree(work_dir)` — the directory does not survive the request, success or failure

The Python executor is the same shape with a different contract: instead of returning plots it reads the CSV back off disk and returns it, so a transformation script mutates the file in place and the app picks up the result.

### Step 9 — Results come back

`actions/execute.ts` persists plots to Supabase Storage via `savePlots()` and returns URLs rather than base64 to the client — the images are then served from storage instead of round-tripping through the app. `stdout` and `stderr` render in `TerminalView.tsx`; plots in `PlotViewer.tsx`; the run is written to version history.

**Errors are not swallowed.** `stderr` from R goes straight to the user, because an R error message is genuinely the most useful thing to show someone iterating on a script — and it's what they paste back into chat to get a fix.

---

## 3. Data model

Supabase Postgres, accessed through `lib/db/`:

| Table | Holds |
|---|---|
| `projects` | Project, owner, NIST flag, context window |
| `csv_uploads` | Dataset metadata; files themselves in Storage at `{user_id}/{project_id}/{id}.csv` |
| `messages` | Chat history, synced live via Supabase Realtime |
| `versions` | Code snapshots — every execution is recoverable |
| `plots` | Generated images |
| `collaborators` | Invitations and roles; the source of truth for `canAccessProject` / `canEditProject` |

Uploads are transactional by hand — if the DB insert fails after the storage upload succeeds, the orphaned object is removed:

```ts
if (dbError) {
  await supabase.storage.from('csvupload').remove([storagePath])
  throw new Error(dbError.message)
}
```

Auth runs through `middleware.ts`, which refreshes the Supabase session cookie on every request so server actions always see a valid user.

---

## 4. Languages, and why each one

| Language | Where | Why |
|---|---|---|
| **TypeScript** | App, server actions, prompt templates | Strict types across the LLM boundary. `OpenAIResponse`, `ExecuteResponse`, `LanguageConfig` are the contracts that keep parsing honest |
| **Python** | Both executor services (FastAPI) | Thin process supervisor. FastAPI for Pydantic request validation with almost no code |
| **R** | Generated and executed inside the R container | The target language for the users I interviewed — biologists and biostatisticians live in ggplot2 and tidyverse |
| **Python** | Also a generated target | Added second, via the language-config interface, for data transformation work with pandas |
| **Docker** | Executor images | `rocker/tidyverse:4.3.1` pins R and the tidyverse; CRAN packages install from a Posit binary mirror so builds are minutes, not an hour |
| **SQL** | Supabase schema | — |

One detail from the R image worth knowing, because it's the kind of thing that only shows up in production:

```dockerfile
RUN echo "options(device = function(...) grDevices::ragg_png(...))" >> Rprofile.site
```

Default R graphics devices need an X11 display. In a headless container that fails. `ragg` renders without one, and setting it as the default device in `Rprofile.site` means generated code doesn't have to know it's running headless.

---

## 5. What I'd fix first

Honest list, roughly in priority order.

1. **Network egress from the executors is unrestricted.** Generated code can currently make outbound requests. A deny-by-default egress policy on the container is the single highest-value fix.
2. **No memory or CPU ceiling.** A generated infinite allocation can exhaust the container before the 120s timeout fires. `--memory` / `--cpus`.
3. **Containers run as root.** Should be a non-root `USER`, read-only root filesystem, writable mount only for the scratch dir.
4. **`/run` is unauthenticated with `allow_origins=["*"]`.** Fine while only reachable from the app's private network; needs a shared secret or mTLS before it's publicly routable.
5. **Base64 CSV transport caps practical file size.** Fine for research-scale CSVs, wrong for anything large. Presigned storage URLs would be the fix.
6. **The randomizer preserves marginal distributions, not joint ones.** Columns are sampled independently, so correlations are destroyed. Sufficient for schema-correct code generation; insufficient if the model needs to reason about relationships.
7. **No test suite on the executors.** That's the part that most needs one.
8. **Correctness of the *analysis* isn't checked** — only that code executes. A model will happily run a t-test on data that violates its assumptions. Every biostatistician I interviewed raised this. An assumption-checking layer is the interesting unsolved problem here, more than the generation is.
