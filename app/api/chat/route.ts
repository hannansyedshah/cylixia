import { NextRequest, NextResponse } from 'next/server'
import { callAiriaAgent, parseAiriaResponse } from '@/lib/airiaClient'
import { randomizeCSVData } from '@/lib/dataRandomizer'

export async function POST(request: NextRequest) {
  try {
    const { prompt, existingCode, userId, csvData, fileName, privacyMode = true, mode = 'legacy', conversationHistory, preferences, csvFilesForChat } = await request.json()

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

    // Prepare one or many CSVs for AI (randomized if privacy on)
    let csvFilesPayload: Array<{ fileName: string, csvData: string }> | undefined
    if (Array.isArray(csvFilesForChat) && csvFilesForChat.length > 0) {
      csvFilesPayload = csvFilesForChat
        .filter((f: any) => f.csvData && f.fileName) // Only include files with valid data
        .map((f: any) => ({
          fileName: f.fileName,
          csvData: privacyMode ? randomizeCSVData(f.csvData) : f.csvData,
        }))
      console.log(`📦 Preparing ${csvFilesPayload.length} CSV(s) for AI (${privacyMode ? 'randomized' : 'original'})`)
      csvFilesPayload.forEach((f, i) => {
        console.log(`  CSV ${i + 1}: ${f.fileName} (${f.csvData.length} chars)`)
      })
    } else if (csvData && fileName) {
      const single = privacyMode ? randomizeCSVData(csvData) : csvData
      csvFilesPayload = [{ fileName, csvData: single }]
      console.log(`📦 Preparing single CSV: ${fileName} (${single.length} chars)`)
    }
    
    if (!csvFilesPayload || csvFilesPayload.length === 0) {
      console.warn('⚠️ No CSV files to send to AI model')
    }
    
    const airiaResponse = await callAiriaAgent(
      enhancedPrompt, 
      userId || 'anonymous',
      csvFilesPayload?.[0]?.csvData, // maintain backward compatibility for current client
      csvFilesPayload?.[0]?.fileName,
      mode,
      existingCode,
      conversationHistory,
      preferences,
      csvFilesPayload, // Pass all CSV files
      privacyMode // Pass privacy mode so models know if data is randomized
    )
    
    const parsed = parseAiriaResponse(airiaResponse)

    // For ask mode, if response is plain text (no code), use the entire response as message
    if (mode === 'ask' && (!parsed.code || parsed.code === parsed.message || !parsed.code.includes('library(') && !parsed.code.includes('<-'))) {
      // Use the raw response as message if it's plain text
      const responseText = airiaResponse.output || airiaResponse.result || parsed.message || parsed.code || ''
      return NextResponse.json({
        message: responseText.trim() || parsed.message || 'Here\'s the answer to your question:',
        code: undefined, // Don't return code for ask mode text responses
        rawResponse: airiaResponse, // For debugging
      })
    }

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


