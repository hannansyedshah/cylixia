// OpenAI API types for code generation
import type { Language } from '@/templates/openai/languages'

export type OpenAIMode = 'generate' | 'ask'

export type TextContent = { type: 'text'; text: string }
export type ImageContent = { type: 'image_url'; image_url: { url: string } }
export type MessageContent = string | Array<TextContent | ImageContent>

export interface OpenAIRequest {
  mode: OpenAIMode
  prompt: string
  existingCode?: string
  csvFiles?: Array<{ fileName: string; csvData: string }>
  images?: Array<{ fileName: string; base64Data: string; mimeType: string }>
  privacyMode: boolean
  contextWindow?: string
  isNistProject: boolean
  language: Language
}

export interface OpenAIResponse {
  code?: string
  message: string
  explanation?: string
  plotDescription?: string
  nextSuggestions?: string[]
}

export interface OpenAIContextRequest {
  projectName: string
  csvFiles: Array<{ fileName: string; csvData: string }>
}

// Format Script Types
export interface FormatScriptRequest {
  prompt: string
  csvSample: string
  fileName: string
}

export interface FormatScriptResponse {
  code: string
  explanation: string
}
