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
AIRIA_API_KEY=your_airia_api_key_here
```

### **For Vercel Deployment:**

1. Go to your Vercel project: https://vercel.com/shayan-shahs-projects/c-reate
2. Click **Settings** → **Environment Variables**
3. Add new variable:
   - **Key**: `AIRIA_API_KEY`
   - **Value**: Your Airia API key
   - **Environments**: Check all (Production, Preview, Development)
4. Click **"Save"**
5. **Redeploy** your app

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

### Example Flows:

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

## 📊 Your Airia Agent Configuration

- **Agent ID**: `3b015c24-44cf-400c-aac7-437fb5963f63`
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

