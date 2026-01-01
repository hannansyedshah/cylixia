import { NextRequest, NextResponse } from 'next/server'
import { callOpenAI } from '@/lib/openai/api'
import { randomizeCSVData } from '@/utils/dataRandomizer'
import type { OpenAIMode } from '@/types/openai'

export async function POST(request: NextRequest) {
  try {
    const {
      prompt,
      existingCode,
      userId,
      csvData,
      fileName,
      privacyMode = true,
      mode = 'generate',
      csvFilesForChat,
      contextWindow,
      isNistProject = false
    } = await request.json()

    console.log(`📝 User prompt: ${prompt.substring(0, 100)}...`)

    // Check if API key is configured
    if (!process.env.OPENAI_API_KEY) {
      console.warn('⚠️ OPENAI_API_KEY not configured, using mock response')

      const mockCode = existingCode
        ? `# Updated R code based on user request\n${existingCode}\n\n# Apply changes here`
        : `# Generated R code for: ${prompt}\nlibrary(ggplot2)\n\n# Create your visualization\nggplot(data, aes(x, y)) + geom_point()`

      return NextResponse.json({
        message: 'Mock response (add OPENAI_API_KEY to use real AI)',
        code: mockCode,
      })
    }

    // Prepare CSV files (randomize if privacy mode enabled)
    let csvFilesPayload: Array<{ fileName: string; csvData: string }> = []

    if (Array.isArray(csvFilesForChat) && csvFilesForChat.length > 0) {
      csvFilesPayload = csvFilesForChat
        .filter((f: any) => f.csvData && f.fileName)
        .map((f: any) => ({
          fileName: f.fileName,
          csvData: privacyMode ? randomizeCSVData(f.csvData) : f.csvData,
        }))
      console.log(`📦 Preparing ${csvFilesPayload.length} CSV(s) (${privacyMode ? 'randomized' : 'original'})`)
    } else if (csvData && fileName) {
      const single = privacyMode ? randomizeCSVData(csvData) : csvData
      csvFilesPayload = [{ fileName, csvData: single }]
      console.log(`📦 Preparing single CSV: ${fileName}`)
    }

    const openaiMode: OpenAIMode = mode as OpenAIMode

    const response = await callOpenAI({
      mode: openaiMode,
      prompt,
      existingCode,
      csvFiles: csvFilesPayload.length > 0 ? csvFilesPayload : undefined,
      privacyMode,
      contextWindow,
      isNistProject
    })

    // For ask mode without code, return explanation only
    if (openaiMode === 'ask' && (!response.code || !response.code.includes('library('))) {
      return NextResponse.json({
        message: response.explanation || response.message,
        code: undefined,
        explanation: response.explanation,
        plotDescription: response.plotDescription,
        nextSuggestions: response.nextSuggestions,
      })
    }

    return NextResponse.json({
      message: response.message,
      code: response.code,
      explanation: response.explanation,
      plotDescription: response.plotDescription,
      nextSuggestions: response.nextSuggestions,
    })
  } catch (error: any) {
    console.error('Chat API error:', error)
    return NextResponse.json(
      {
        error: error.message || 'Failed to process request',
        details: 'Check that OPENAI_API_KEY is set in environment variables'
      },
      { status: 500 }
    )
  }
}
