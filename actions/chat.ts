'use server'

import { callOpenAI, generateFormatScript } from '@/lib/openai/api'
import { randomizeCSVData } from '@/utils/dataRandomizer'
import { getLanguageConfig } from '@/templates/openai/languages'
import type { Language } from '@/templates/openai/languages'
import type { OpenAIMode, FormatScriptRequest, FormatScriptResponse } from '@/types/openai'

interface ChatRequest {
  prompt: string
  mode: OpenAIMode
  existingCode?: string
  csvFiles?: Array<{ fileName: string; csvData: string }>
  images?: Array<{ fileName: string; base64Data: string; mimeType: string }>
  privacyMode?: boolean
  contextWindow?: string
  isNistProject?: boolean
  language: Language
}

interface ChatResponse {
  message?: string
  code?: string
  explanation?: string
  plotDescription?: string
  nextSuggestions?: string[]
}

function getMockCode(language: Language, prompt: string, existingCode?: string): string {
  const config = getLanguageConfig(language)
  if (existingCode) {
    return `# Updated ${config.name} code based on user request\n${existingCode}\n\n# Apply changes here`
  }
  return `# Generated ${config.name} code for: ${prompt}\n${config.mockCodeTemplate}`
}

export async function sendChat(request: ChatRequest): Promise<ChatResponse> {
  const {
    prompt,
    existingCode,
    privacyMode = true,
    mode = 'generate',
    csvFiles,
    images,
    contextWindow,
    isNistProject = false,
    language
  } = request

  const config = getLanguageConfig(language)

  // Check if API key is configured
  if (!process.env.OPENAI_API_KEY) {
    return {
      message: 'Mock response (add OPENAI_API_KEY to use real AI)',
      code: getMockCode(language, prompt, existingCode),
    }
  }

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
    images: images && images.length > 0 ? images : undefined,
    privacyMode,
    contextWindow,
    isNistProject,
    language
  })

  // For ask mode without code, return explanation only
  const hasCodeIndicator = config.codeIndicators.some(indicator => response.code?.includes(indicator))
  if (mode === 'ask' && (!response.code || !hasCodeIndicator)) {
    return {
      message: response.explanation || response.message,
      code: undefined,
      explanation: response.explanation,
      plotDescription: response.plotDescription,
      nextSuggestions: response.nextSuggestions,
    }
  }

  return {
    message: response.message,
    code: response.code,
    explanation: response.explanation,
    plotDescription: response.plotDescription,
    nextSuggestions: response.nextSuggestions,
  }
}

export async function formatData(request: FormatScriptRequest): Promise<FormatScriptResponse> {
  if (!process.env.OPENAI_API_KEY) {
    return { code: '', explanation: 'API key not configured' }
  }

  return generateFormatScript(request)
}
