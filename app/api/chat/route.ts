import { NextRequest, NextResponse } from 'next/server'
import { routeIntent, getSystemPrompt } from '@/lib/routerLogic'
import { callAiriaAgent, extractRCode } from '@/lib/airiaClient'

export async function POST(request: NextRequest) {
  try {
    const { prompt, existingCode, userId } = await request.json()

    // Use router logic to determine intent
    const routeResult = routeIntent(prompt)
    const systemPrompt = getSystemPrompt(routeResult.route, existingCode)

    console.log(`🧠 Route Decision: ${routeResult.route} (${routeResult.confidence} confidence)`)
    console.log(`📝 User prompt: ${prompt.substring(0, 100)}...`)

    // Build enhanced prompt for Airia
    let enhancedPrompt = ''
    
    if (routeResult.route === 'Route 1' && existingCode) {
      // Fix existing code route
      enhancedPrompt = `${systemPrompt}

User Request: ${prompt}

Current R Code:
\`\`\`r
${existingCode}
\`\`\`

Please analyze and improve this code based on the user's request. Return ONLY the complete R code, no explanations.`
    } else {
      // Generate new code route
      enhancedPrompt = `${systemPrompt}

User Request: ${prompt}

Generate complete, executable R code for this request. Return ONLY the R code, no explanations.`
    }

    // Call Airia agent
    const airiaResponse = await callAiriaAgent(enhancedPrompt, userId || 'anonymous')
    const rCode = extractRCode(airiaResponse)

    const message = routeResult.route === 'Route 1' 
      ? `I've analyzed and improved your R code based on your request:`
      : `Here's the R code for your request:`

    return NextResponse.json({
      message,
      code: rCode,
      route: routeResult.route,
      confidence: routeResult.confidence,
      rawResponse: airiaResponse, // For debugging
    })
  } catch (error: any) {
    console.error('Chat API error:', error)
    return NextResponse.json(
      { 
        error: error.message || 'Failed to process request',
        details: 'Check that AIRIA_API_KEY is set in environment variables'
      },
      { status: 500 }
    )
  }
}


