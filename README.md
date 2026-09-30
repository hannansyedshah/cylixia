# Cylixia

**Natural-language → executable analysis for researchers who don't write code.**

Cylixia turns a research question typed in plain English into real R or Python that runs against the user's own dataset, returns plots and transformed data, and keeps a version history of every step. It was built because I kept watching researchers with good questions get stuck on the tooling — and because I'd been that person myself.

Built through the **NSF I-Corps Hub Northeast** program, informed by 20+ customer discovery interviews with researchers, biostatisticians, and information security leaders.

---

## The problem

A biologist has a CSV and a question: *"does treatment concentration predict growth rate, controlling for replicate?"*

Today that means either learning R, or waiting on the one person in the lab who knows it. Both are slow. General-purpose LLMs can write the code, but then the researcher has to install R, resolve package dependencies, debug the output, and — critically — **paste their data into someone else's model** to get useful help.

That last point came up in nearly every discovery interview, and it shaped the architecture more than anything else.

📄 **[ARCHITECTURE.md](./ARCHITECTURE.md)** — full request-path walkthrough: deployment topology, LLM routing, response parsing, container execution.

---

## Architecture

```
┌──────────────────────────────────────────────────────┐
│  Next.js 15 App Router (React 19, TypeScript)        │
│  Monaco editor · chat panel · plot viewer            │
└────────────────────┬─────────────────────────────────┘
                     │  Server Actions
┌────────────────────▼─────────────────────────────────┐
│  actions/  — server-side orchestration               │
│  chat · execute · askData · context                  │
│  ├─ permission check (canEditProject)                │
│  ├─ privacy mode → randomizeCSVData()                │
│  └─ prompt assembly (language + mode + NIST)         │
└──────┬───────────────────────────┬───────────────────┘
       │                           │
┌──────▼──────────┐      ┌─────────▼──────────────────┐
│  OpenAI API     │      │  Execution services         │
│  code generation│      │  (separate containers)      │
└─────────────────┘      │                             │
                         │  _r-executor/     rocker/   │
                         │    FastAPI + Rscript        │
                         │  _pythonscript-executor/    │
                         │    FastAPI + pandas/numpy   │
                         └─────────────┬───────────────┘
                                       │
┌──────────────────────────────────────▼───────────────┐
│  Supabase — Postgres, Auth, Storage, Realtime        │
│  projects · versions · messages · plots · csv_uploads│
└──────────────────────────────────────────────────────┘
```

**Why the executors are separate services.** LLM-generated code is untrusted input by definition. It doesn't belong in the web application's process, and it doesn't belong on the same host as the session cookies. Splitting execution into its own containerized service behind an HTTP boundary means the worst case for a bad generation is a dead container, not a compromised app. Each `/run` request gets a fresh `tempfile.mkdtemp()`, a hard 120-second `subprocess` timeout, and an unconditional `shutil.rmtree` in a `finally` block — the working directory does not survive the request.

---

## The design decisions worth explaining

### 1. Privacy mode: the model sees the schema, not the data

`utils/dataRandomizer.ts` is the piece I'd point at first.

When privacy mode is on, the CSV is **profiled** rather than sent. `analyzeCSVStructure()` walks each column and infers its type — numeric (capturing min/max), date, boolean, or text (capturing the distinct set when cardinality ≤ 20). It then generates a synthetic dataset with **identical headers, identical row count, identical column types, and values drawn from the same ranges** — and sends *that* to the model.

The generated code is written against the real schema, so it runs correctly against the real data locally. But the actual values never leave the user's environment.

```ts
csvData: request.privacyMode ? randomizeCSVData(f.csvData) : f.csvData
```

That single line in `lib/openai/ask.ts` and `actions/chat.ts` is the whole privacy boundary, which is deliberate — a security property that lives in one place is a security property you can actually audit.

The prompt layer stays honest about which mode it's in, so the model never misreports what it's looking at:

```ts
PRIVACY_NOTE_RANDOMIZED = '⚠️ NOTE: This CSV data has been RANDOMIZED for privacy protection. Use for structural analysis only.'
PRIVACY_NOTE_ORIGINAL   = '✓ NOTE: This is ORIGINAL data with real values.'
```

**The tradeoff, stated plainly:** the model can't reason about actual distributions, outliers, or data-quality problems it can't see. For exploratory work on sensitive data that's the right trade. For debugging a weird result it isn't, so it's per-project and explicit rather than a global default.

### 2. NIST-mode projects get an additional prompt constraint

Projects flagged as NIST-governed append `NIST_ADDENDUM` to the system prompt, instructing the model to treat all values as de-identified tokens and analyze structure rather than infer subject information. This is defense in depth, not the primary control — the randomizer is. A prompt instruction is a request; the randomizer is an actual boundary. Layering both was intentional after talking to infosec leads who (correctly) don't accept prompt instructions as a security control.

### 3. Language support is a config interface, not a branch

Adding Python alongside R meant defining one object, not threading conditionals through the codebase:

```ts
export interface LanguageConfig {
  name: string
  basePrompt: string
  generateFormat: string
  askFormat: string
  codeIndicators: string[]
  monacoLanguage: string
  executionUrlEnvVar: string
  // ...
}
```

`SUPPORTED_LANGUAGES` is the single source of truth; the prompt templates, the Monaco editor mode, the response parser, and the executor URL all resolve off the same config. Adding a third language is a new file in `templates/openai/languages/` plus a container.

### 4. Permissions are enforced server-side, at the action boundary

Every mutating server action checks authorization before doing work:

```ts
const canEdit = await canEditProject(request.projectId)
if (!canEdit) return { stderr: 'You do not have permission to execute code in this project' }
```

Collaboration is real (invitations, roles, Supabase Realtime message sync), which means the client cannot be trusted to know what a user may do. The check lives in `actions/`, not in the component.

---

## What's here

| Path | What it is |
|---|---|
| `app/` | Next.js App Router pages — dashboard, workspace, auth |
| `actions/` | Server actions: chat, execute, askData, context assembly |
| `components/workspace/` | Monaco editor, chat panel, plot viewer, version history, terminal |
| `templates/openai/` | Prompt construction — per-language configs, modes, NIST addendum |
| `utils/dataRandomizer.ts` | Schema-preserving synthetic data generation |
| `lib/db/` | Supabase data access — projects, versions, messages, plots, collaborators |
| `_r-executor/` | Containerized R execution service (FastAPI + `rocker/tidyverse`) |
| `_pythonscript-executor/` | Containerized Python execution service (FastAPI + pandas/numpy) |

**Stack:** Next.js 15 · React 19 · TypeScript · Tailwind · Monaco · Zustand · Supabase (Postgres/Auth/Storage/Realtime) · OpenAI · FastAPI · Docker

---

## Known limitations

Written out because an honest list is more useful than a clean one, and because these are the first things I'd fix.

**The executors are isolated but not hardened.** Current controls are process timeout, per-request temp directory, and teardown. Not yet in place:

- **No network egress restriction.** Generated code can currently make outbound requests. This is the most important gap; the fix is a container network policy denying egress by default.
- **No memory or CPU ceiling.** A generated infinite allocation can exhaust the container before the 120s timeout fires. `--memory` / `--cpus` limits, or a cgroup, would bound this.
- **Containers run as root.** Should be a non-root `USER` with a read-only root filesystem and a writable mount only for the scratch directory.
- **`CORSMiddleware` is `allow_origins=["*"]` and `/run` is unauthenticated.** Fine while the service is only reachable from the app's private network; not fine the moment it's publicly routable. Needs a shared secret or mTLS between app and executor.

**Analysis correctness is not verified.** The system checks that code *executes*, not that the statistics are *appropriate*. A model will happily run a t-test on data that violates its assumptions. Every discovery interview with a biostatistician raised this. The direction I'd take it is an assumption-checking layer that flags when the chosen method doesn't fit the data's shape — which is closer to the actual unsolved problem than the code generation is.

**The randomizer preserves marginal distributions, not joint ones.** Each column is sampled independently, so correlations between columns are destroyed. For schema-correct code generation that's sufficient. For anything where the model needs to reason about relationships in the data, it isn't.

**Thin test coverage.** Built on an I-Corps timeline against customer interviews. The executor services are the part that most needs a real test suite.

---

## Running it

```bash
pnpm install
pnpm dev
```

Environment: Supabase URL and anon key, OpenAI API key, and an execution service URL per language (`executionUrlEnvVar` in each language config). The executor services deploy independently:

```bash
docker build -t cylixia-r ./_r-executor
docker run -p 7860:7860 cylixia-r
```

---

*Built by [Shayan Shah](https://www.linkedin.com/in/shayan-shah). NSF I-Corps Hub Northeast, 2026.*
