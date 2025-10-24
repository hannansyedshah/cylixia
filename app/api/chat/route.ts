import { NextRequest, NextResponse } from 'next/server'
import { routeIntent, getSystemPrompt } from '@/lib/routerLogic'
import { callAiriaAgent, parseAiriaResponse } from '@/lib/airiaClient'

export async function POST(request: NextRequest) {
  try {
    const { prompt, existingCode, userId, csvData, fileName } = await request.json()

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

    // Check if API key is configured
    if (!process.env.AIRIA_API_KEY) {
      console.warn('⚠️ AIRIA_API_KEY not configured, using mock response')
      
      // Return mock response for testing
      const mockCode = routeResult.route === 'Route 1' && existingCode
        ? `# Improved R code\n${existingCode}\n\n# Applied improvements`
        : `# Generated R code for: ${prompt}\nlibrary(ggplot2)\n\n# Create your visualization\nggplot(data, aes(x, y)) + geom_point()`
      
      return NextResponse.json({
        message: 'Mock response (add AIRIA_API_KEY to use real AI)',
        code: mockCode,
        route: routeResult.route,
        confidence: routeResult.confidence,
      })
    }

    // Call Airia agent with CSV data if available
    const airiaResponse = await callAiriaAgent(
      enhancedPrompt, 
      userId || 'anonymous',
      csvData,
      fileName
    )
    
    const parsed = parseAiriaResponse(airiaResponse)

    return NextResponse.json({
      message: parsed.message,
      code: parsed.code,
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


