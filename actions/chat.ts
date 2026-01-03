'use server'

import { callOpenAI } from '@/lib/openai/api'
import { randomizeCSVData } from '@/utils/dataRandomizer'
import type { OpenAIMode } from '@/types/openai'

interface ChatRequest {
  prompt: string
  mode: OpenAIMode
  existingCode?: string
  csvFiles?: Array<{ fileName: string; csvData: string }>
  privacyMode?: boolean
  contextWindow?: string
  isNistProject?: boolean
}

interface ChatResponse {
  message?: string
  code?: string
  explanation?: string
  plotDescription?: string
  summary?: string
  nextSuggestions?: string[]
}

export async function sendChat(request: ChatRequest): Promise<ChatResponse> {
  const {
    prompt,
    existingCode,
    privacyMode = true,
    mode = 'generate',
    csvFiles,
    contextWindow,
    isNistProject = false
  } = request

  // Check if API key is configured
  if (!process.env.OPENAI_API_KEY) {
    const mockCode = existingCode
      ? `# Updated R code based on user request\n${existingCode}\n\n# Apply changes here`
      : `# Generated R code for: ${prompt}\nlibrary(ggplot2)\n\n# Create your visualization\nggplot(data, aes(x, y)) + geom_point()`

    return {
      message: 'Mock response (add OPENAI_API_KEY to use real AI)',
      code: mockCode,
    }
  }

  // Prepare CSV files (randomize if privacy mode enabled)
  let csvFilesPayload: Array<{ fileName: string; csvData: string }> = []

  if (Array.isArray(csvFiles) && csvFiles.length > 0) {
    csvFilesPayload = csvFiles
      .filter((f) => f.csvData && f.fileName)
      .map((f) => ({
        fileName: f.fileName,
        csvData: privacyMode ? randomizeCSVData(f.csvData) : f.csvData,
      }))
  }

  const response = await callOpenAI({
    mode,
    prompt,
    existingCode,
    csvFiles: csvFilesPayload.length > 0 ? csvFilesPayload : undefined,
    privacyMode,
    contextWindow,
    isNistProject
  })

  // For ask mode without code, return explanation only
  if (mode === 'ask' && (!response.code || !response.code.includes('library('))) {
    return {
      message: response.explanation || response.message,
      code: undefined,
      explanation: response.explanation,
      plotDescription: response.plotDescription,
      summary: response.summary,
      nextSuggestions: response.nextSuggestions,
    }
  }

  return {
    message: response.message,
    code: response.code,
    explanation: response.explanation,
    plotDescription: response.plotDescription,
    summary: response.summary,
    nextSuggestions: response.nextSuggestions,
  }
}
