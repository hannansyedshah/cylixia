# 🤖 Airia Integration Setup

Your cReate app is now configured to use Airia AI for intelligent R code generation!

## 🔑 Step 1: Get Your Airia API Key

1. Go to your Airia dashboard
2. Navigate to your agent settings
3. Click **"View API Keys"**
4. Copy your API key

## 🔧 Step 2: Configure Environment Variables

### **For Local Development:**

Add to your `.env.local` file:

```env
# Main Airia API Key (for code generation)
AIRIA_API_KEY=your_airia_api_key_here

# Context Window API Key (for HIPAA context generation)
# Optional: If not set, will use AIRIA_API_KEY
AIRIA_CONTEXT_API_KEY=your_context_pipeline_api_key_here
```

### **For Vercel Deployment:**

1. Go to your Vercel project: https://vercel.com/shayan-shahs-projects/c-reate
2. Click **Settings** → **Environment Variables**
3. Add new variables:
   - **Key**: `AIRIA_API_KEY`
   - **Value**: Your Airia API key
   - **Environments**: Check all (Production, Preview, Development)
   
   - **Key**: `AIRIA_CONTEXT_API_KEY` (optional)
   - **Value**: Your context pipeline API key
   - **Environments**: Check all (Production, Preview, Development)
4. Click **"Save"**
5. **Redeploy** your app

## 📋 Airia Agent Pipeline GUIDs

Your app uses multiple Airia agents for different purposes:

### Code Generation Agents
- **Legacy Agent**: `3b015c24-44cf-400c-aac7-437fb5963f63`
- **Quick Mode (Regular)**: `3679b604-284a-40fc-9ebc-e77362d144f6`
- **Quick Mode (NIST)**: Set via routing when `isNistProject = true`

### Data Question Agents ("Ask Data" Mode)
- **Ask Mode (Both Routes)**: `c91515d7-b957-4ada-b94d-5bf1470be7da`
  - Route 1: Regular projects (no context)
  - Route 2: NIST projects (with context window)
  - Same agent with internal routing

### Context Generation Agent
- **Context Window**: `f6015c53-afc1-4dff-bcfd-f9facce101cd`

## 🧠 How the Integration Works

### Intelligent Routing:

When a user sends a message, the app:

1. **Analyzes the prompt** using router logic
   - Detects if user wants to **fix existing code** (Route 1)
   - Or **generate new code** (Route 2)

2. **Builds context-aware prompt** for Airia
   - Route 1: Includes existing code + system instructions for fixing
   - Route 2: Focuses on generating fresh code

3. **Calls Airia agent** with enhanced prompt

4. **Extracts R code** from Airia's response

5. **Returns to user** with proper formatting

### Code Generation Mode:

**User says:** *"Create a scatter plot of my data"*
- → Route 2 (Generate)
- → Airia receives: "Generate new R code for scatter plot"
- → Returns fresh ggplot2 code

**User says:** *"Fix the colors in this visualization"*
- → Route 1 (Fix)
- → Airia receives: Current code + "improve colors"
- → Returns modified code

**User says:** *"Make the legend better"*
- → Route 1 (Fix)
- → Airia receives: Current code + "improve legend"
- → Returns enhanced code

### Ask Data Mode (NIST-Aware Routing):

The "Ask Data" mode intelligently routes questions based on project type:

**Regular Project:**
- User switches to "Ask Data" mode
- Asks: *"What is the average age in this dataset?"*
- → Routes to: **Ask Mode (Regular)** agent
- → Returns text answer (no code)

**NIST Project:**
- User switches to "Ask Data" mode
- Context window is automatically included
- Asks: *"What patterns do you see in treatment outcomes?"*
- → Routes to: **Ask Mode (NIST)** agent
- → Agent understands de-identification requirements
- → Includes research context for better analysis
- → Returns contextually-aware answer

**Benefits of NIST Routing:**
- Privacy-aware responses
- Uses research context (study type, objectives, key fields)
- Understands de-identified data structure
- Provides more relevant statistical suggestions

## 📊 Complete Agent Configuration Reference

All agents are configured in `lib/airiaClient.ts`:

### Code Generation Agents:

- **Legacy Agent**: `3b015c24-44cf-400c-aac7-437fb5963f63`
  - Used for legacy mode
  - Basic code generation

- **Quick Agent (Regular)**: `3679b604-284a-40fc-9ebc-e77362d144f6`
  - Used for non-NIST projects
  - Fast code generation with structured prompts

- **Quick Agent (NIST)**: Set via conditional routing
  - Used for NIST-compliant projects
  - Includes context window automatically

### Ask Data Agents:

- **Ask Agent (Both Routes)**: `c91515d7-b957-4ada-b94d-5bf1470be7da`
  - **Route 1 (Regular)**: No context window → Standard data questions
  - **Route 2 (NIST)**: With context window → Privacy-aware responses with research context
  - Same agent, internal routing based on payload

### NIST Context Window Agent:

- **Context Agent**: `f6015c53-afc1-4dff-bcfd-f9facce101cd`
  - Generates research context from CSV data
  - Analyzes dataset structure and suggests study parameters
  - NIST-compliant projects only

### API Details:

- **Endpoint**: `https://api.airia.ai/v2/PipelineExecution/[agent-id]`
- **Method**: POST
- **Headers**: 
  - `X-API-KEY`: Your Airia API key
  - `Content-Type`: application/json

## 🔍 Response Format

The app automatically handles Airia's response format:

- Extracts R code from code blocks (```r ... ```)
- Detects inline R code patterns
- Returns clean, executable R code to the editor

## 🧪 Testing

### Local Testing:

1. Make sure `AIRIA_API_KEY` is in `.env.local`
2. Restart dev server: `npm run dev`
3. Login to your app
4. Create a project
5. Try prompts like:
   - "Create a bar chart"
   - "Make a regression plot"
   - "Fix the axis labels" (after generating code)

### Production Testing:

1. Add `AIRIA_API_KEY` to Vercel
2. Redeploy
3. Test on live site

## 🐛 Troubleshooting

### "Failed to get response from Airia"
- Check that `AIRIA_API_KEY` is set correctly
- Verify your Airia agent is published and active
- Check Airia dashboard for agent execution logs

### "No response from Airia"
- Agent might be returning empty response
- Check Airia agent configuration
- Verify the agent is set up to return R code

### Code not parsing correctly
- Check the `extractRCode` function in `lib/airiaClient.ts`
- Adjust parsing logic based on your agent's output format
- Look at the `rawResponse` in browser console for debugging

## 📝 Customization

### Adjust System Prompts

Edit `lib/routerLogic.ts` to customize the system prompts sent to Airia:

```typescript
export function getSystemPrompt(route: RouteType, existingCode?: string): string {
  if (route === 'Route 1') {
    return `Your custom prompt for fixing code...`
  } else {
    return `Your custom prompt for generating code...`
  }
}
```

### Adjust Router Keywords

Edit the keyword lists in `lib/routerLogic.ts` to fine-tune intent detection.

## ✅ You're All Set!

Your app now uses:
- ✅ Intelligent routing (fix vs generate)
- ✅ Airia AI agent for R code
- ✅ Context-aware prompts
- ✅ Clean code extraction

Just add your `AIRIA_API_KEY` and you're ready to go! 🚀

