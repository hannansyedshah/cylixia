import { NextRequest, NextResponse } from 'next/server'
import { callAiriaAgent, parseAiriaResponse } from '@/lib/airiaClient'
import { randomizeCSVData } from '@/lib/dataRandomizer'

export async function POST(request: NextRequest) {
  try {
    const { prompt, existingCode, userId, csvData, fileName, privacyMode = true } = await request.json()

    console.log(`📝 User prompt: ${prompt.substring(0, 100)}...`)

    // Always include user request and existing code (if any)
    const enhancedPrompt = `User Request: ${prompt}

Current R Code:
\`\`\`r
${existingCode || ''}
\`\`\`

Please generate complete, executable R code that applies the user's requested changes to the existing code above. Return ONLY the full R code, with all necessary library() calls.`

    // Check if API key is configured
    if (!process.env.AIRIA_API_KEY) {
      console.warn('⚠️ AIRIA_API_KEY not configured, using mock response')
      
      // Return mock response for testing
      const mockCode = existingCode
        ? `# Updated R code based on user request\n${existingCode}\n\n# Apply changes here`
        : `# Generated R code for: ${prompt}\nlibrary(ggplot2)\n\n# Create your visualization\nggplot(data, aes(x, y)) + geom_point()`
      
      return NextResponse.json({
        message: 'Mock response (add AIRIA_API_KEY to use real AI)',
        code: mockCode,
      })
    }

    // Call Airia agent with CSV data (randomized or original based on privacy preference)
    let csvDataToSend = csvData
    if (csvData && fileName) {
      if (privacyMode) {
        // Privacy mode: Use randomized data for AI code generation
        csvDataToSend = randomizeCSVData(csvData)
        console.log(`🔒 Privacy Protection: Using randomized CSV data for AI code generation`)
        console.log(`   - Original data: ${csvData.length} characters`)
        console.log(`   - Randomized data: ${csvDataToSend.length} characters`)
        console.log(`   - File: ${fileName}`)
        console.log(`   - Note: Original data will be used for actual R code execution`)
      } else {
        // Non-privacy mode: Use original data (user choice)
        console.log(`⚠️ Privacy Warning: Using original CSV data for AI code generation`)
        console.log(`   - Data length: ${csvData.length} characters`)
        console.log(`   - File: ${fileName}`)
        console.log(`   - Warning: Original data is being sent to AI service`)
      }
    }
    
    const airiaResponse = await callAiriaAgent(
      enhancedPrompt, 
      userId || 'anonymous',
      csvDataToSend,
      fileName
    )
    
    const parsed = parseAiriaResponse(airiaResponse)

    return NextResponse.json({
      message: parsed.message,
      code: parsed.code,
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


