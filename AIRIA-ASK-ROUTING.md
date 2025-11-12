# Airia Ask Data Mode - NIST Routing Implementation

## Overview
The "Ask Data" mode now supports conditional routing based on project type. When a user is working on a NIST-compliant project, the context window is automatically included, and the agent internally routes to its NIST-specific logic (Route 2). Regular projects use Route 1 without the context window.

## Implementation Details

### 1. Agent Configuration (`lib/airiaClient.ts`)
- Both regular and NIST projects use the **same agent**: `c91515d7-b957-4ada-b94d-5bf1470be7da`
- The agent has internal routing logic that detects the presence of `context_window`

### 2. Internal Agent Routing Logic
The agent routes based on the payload:
- **Route 1 (Regular Projects)**: No context window provided → Standard data question handling
- **Route 2 (NIST Projects)**: Context window provided → NIST-compliant, privacy-aware responses with research context

### 3. Context Window Integration
When a NIST project uses "Ask Data" mode:
- The research context window is automatically included in the request
- The context provides important study information to the AI agent
- This ensures more accurate and contextually relevant responses

### 4. Changes Made

#### `lib/airiaClient.ts`
- Added `AIRIA_API_URL_ASK_NIST` constant pointing to the same agent (line 27)
- Added `isNistProject: boolean = false` parameter to `callAiriaAgent()` function (line 41)
- Implemented conditional logging in ask mode (lines 127-129):
  ```typescript
  // Use same ask agent for both - it routes internally based on context_window
  targetUrl = AIRIA_API_URL_ASK
  console.log(`🔀 Ask mode: ${isNistProject ? 'Route 2 (NIST with context)' : 'Route 1 (Regular)'}`)
  ```

#### `app/api/chat/route.ts`
- Added `isNistProject = false` to request payload (line 7)
- Passed `isNistProject` flag to `callAiriaAgent()` (line 71)

#### `app/workspace/[projectId]/page.tsx`
- Added `isNistProject: !!project?.hipaa_compliant` to API request payload (line 1041)
- This automatically detects if the current project is NIST-compliant
- Context window is already being sent for NIST projects (line 1040)

### 5. Metadata Display (Already Implemented)
The following metadata from Airia responses is now displayed to users:
- **Explanation**: Detailed explanation of the analysis or code
- **Plot Description**: Description of what the plot shows
- **Next Suggestions**: Suggested follow-up analyses or questions

This is handled in `app/workspace/[projectId]/page.tsx` (lines 1131-1141).

## How the Routing Works
```
User opens NIST project → Project loads with hipaa_compliant flag
    ↓
User switches to "Ask Data" mode → Selects datasets
    ↓
User types question → Clicks send
    ↓
Frontend checks project.hipaa_compliant → Sets isNistProject flag
    ↓
Backend receives isNistProject + contextWindow (if NIST)
    ↓
Airia client sends to: AIRIA_API_URL_ASK (same agent for both)
    Payload includes:
    - Regular (Route 1): No context window
    - NIST (Route 2): With context window
    ↓
Agent internally routes based on context_window presence
    ↓
Response includes: r_code (empty for ask mode) + explanation + plotDescription + nextSuggestions
    ↓
Frontend parses JSON, cleans formatting, and displays metadata to user
```

## Testing
1. **Test Regular Project (Route 1):**
   - Create a non-NIST project
   - Upload datasets
   - Switch to "Ask Data" mode
   - Ask: "What is the average age?"
   - Console should show: `🔀 Ask mode: Route 1 (Regular)`

2. **Test NIST Project (Route 2):**
   - Create or open a NIST-compliant project
   - Upload datasets and generate a context window
   - Switch to "Ask Data" mode
   - Ask: "What patterns do you see in treatment outcomes?"
   - Console should show: `🔀 Ask mode: Route 2 (NIST with context)`

## Console Logging
The implementation includes helpful console logs:
- `🔀 Ask mode: Route 1 (Regular)` - No context window sent
- `🔀 Ask mode: Route 2 (NIST with context)` - Context window included
- `📊 Ask mode: Sending CSV data` - Shows CSV files being sent

## Expected Response Format

The Airia Ask agent should return responses in this JSON structure:

```json
{
  "r_code": "",
  "explanation": "Detailed explanation of the analysis or answer",
  "plot_description": "Description of potential visualizations (optional)",
  "next_suggestions": [
    "First suggested follow-up analysis",
    "Second suggested follow-up analysis",
    "Third suggested follow-up analysis"
  ]
}
```

### Field Guidelines:
- **`r_code`**: Should be empty string (`""`) for Ask mode (no code generation)
- **`explanation`**: Main answer to user's question - detailed analysis or insights
- **`plot_description`**: (Optional) Describe what visualizations would show
- **`next_suggestions`**: Array of 3-10 follow-up questions or analyses
  - Can include emojis (🔹) and suggested tests/graphs
  - Format: "Description 🔹 Suggested test: [test name] | Suggested graph: [graph type]"

### Response Formatting:
- **NO bullet points** (`•`) in JSON keys or values
- **NO markdown code blocks** wrapping the JSON (no ````json)
- Return **clean, valid JSON** only
- Frontend will automatically format and display the content

## Benefits
- **Single Agent Architecture**: Uses one agent with internal routing for simplicity
- **Privacy-Aware**: Agent routes to NIST logic when context window is present
- **Contextual**: NIST projects automatically include research context for better responses
- **Consistent**: Same routing approach as code generation mode
- **Transparent**: Console logs show which route (1 or 2) is being used
- **Smart Parsing**: Frontend cleans up formatting issues automatically

