# 🔌 AI Backend Integration Guide

Your cReate frontend is now ready to integrate with AI! Here's how to connect it to OpenAI, Anthropic, or your custom backend.

## 🧠 Router Logic (Already Implemented!)

The app now includes intelligent routing that determines user intent:

- **Route 1 (Fix)**: User wants to fix/modify existing code
- **Route 2 (Generate)**: User wants to create new code

Keywords are automatically detected in user prompts!

## 🚀 Option 1: OpenAI Integration (Recommended)

### Step 1: Install OpenAI SDK

```bash
pnpm install openai
```

### Step 2: Add API Key to Environment

Add to `.env.local`:
```env
OPENAI_API_KEY=sk-proj-...your-key-here
```

Add to Vercel Environment Variables:
- Key: `OPENAI_API_KEY`
- Value: Your OpenAI API key
- Environments: All

### Step 3: Update `/app/api/chat/route.ts`

Uncomment and use the OpenAI client:

```typescript
import OpenAI from 'openai'
import { routeIntent, getSystemPrompt } from '@/lib/routerLogic'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

export async function POST(request: NextRequest) {
  const { prompt, existingCode } = await request.json()
  
  // Use router logic
  const routeResult = routeIntent(prompt)
  const systemPrompt = getSystemPrompt(routeResult.route, existingCode)
  
  // Call OpenAI
  const completion = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: prompt }
    ],
    temperature: 0.7,
  })
  
  const code = completion.choices[0].message.content || ''
  
  return NextResponse.json({
    message: 'Here\'s the R code:',
    code,
    route: routeResult.route,
    confidence: routeResult.confidence,
  })
}
```

## 🎯 Option 2: Anthropic Claude Integration

### Step 1: Install Anthropic SDK

```bash
pnpm install @anthropic-ai/sdk
```

### Step 2: Update Chat Route

```typescript
import Anthropic from '@anthropic-ai/sdk'
import { routeIntent, getSystemPrompt } from '@/lib/routerLogic'

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

export async function POST(request: NextRequest) {
  const { prompt, existingCode } = await request.json()
  
  const routeResult = routeIntent(prompt)
  const systemPrompt = getSystemPrompt(routeResult.route, existingCode)
  
  const message = await anthropic.messages.create({
    model: 'claude-3-5-sonnet-20241022',
    max_tokens: 2048,
    system: systemPrompt,
    messages: [
      { role: 'user', content: prompt }
    ],
  })
  
  const code = message.content[0].text
  
  return NextResponse.json({
    message: 'Here\'s the R code:',
    code,
    route: routeResult.route,
  })
}
```

## 🔧 Option 3: Custom Python Backend

If you want a separate Python backend with FastAPI:

### Backend (FastAPI)

```python
# backend/main.py
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from router_logic import route_intent
from openai import OpenAI

app = FastAPI()

# Enable CORS for Next.js frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3001", "https://c-reate.vercel.app"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

client = OpenAI()

@app.post("/api/chat")
async def chat(request: dict):
    user_prompt = request["prompt"]
    existing_code = request.get("existingCode", "")
    
    route = route_intent(user_prompt)[0]
    
    # Different system prompts based on route
    system_prompt = get_system_prompt(route, existing_code)
    
    completion = client.chat.completions.create(
        model="gpt-4o",
        messages=[
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt}
        ]
    )
    
    return {
        "message": "Here's the R code:",
        "code": completion.choices[0].message.content,
        "route": route
    }
```

### Frontend Update

Update `BACKEND_API_URL` in `.env.local`:
```env
BACKEND_API_URL=http://localhost:8000
```

Then in `/app/api/chat/route.ts`:

```typescript
export async function POST(request: NextRequest) {
  const { prompt, existingCode } = await request.json()
  
  // Forward to Python backend
  const response = await fetch(`${process.env.BACKEND_API_URL}/api/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ prompt, existingCode }),
  })
  
  return NextResponse.json(await response.json())
}
```

## 🎨 How It Works in Your App

### User Journey:

1. **User types**: "Create a scatter plot"
   - Router detects: **Route 2** (Generate)
   - System prompt: "Generate new R code..."
   - Result: Fresh code generated

2. **User types**: "Fix the legend in this plot"
   - Router detects: **Route 1** (Fix)
   - System prompt includes existing code
   - Result: Modified version of existing code

3. **User types**: "Make a histogram"
   - Router detects: **Route 2** (Generate)
   - Creates new visualization code

### Current Implementation:

✅ Router logic is already integrated in `/app/api/chat/route.ts`
✅ Existing code is passed automatically from workspace
✅ System prompts adapt based on intent
⏳ Just needs OpenAI/Anthropic API key to work with real AI

## 📊 Testing the Router

You can test the routing logic:

```typescript
import { routeIntent } from '@/lib/routerLogic'

// Test cases
console.log(routeIntent("Create a scatter plot"))
// → { route: 'Route 2', confidence: 'high' }

console.log(routeIntent("Fix the error in my code"))
// → { route: 'Route 1', confidence: 'high' }

console.log(routeIntent("Make the plot prettier"))
// → { route: 'Route 1', confidence: 'medium' }
```

## 🚀 Next Steps

1. **Choose your AI provider** (OpenAI, Anthropic, or custom)
2. **Get an API key**
3. **Add it to environment variables**
4. **Uncomment the integration code in `/app/api/chat/route.ts`**
5. **Test and deploy!**

The router logic will automatically make your AI smarter about user intent! 🧠✨

