// OpenAI API types for R code generation

export type OpenAIMode = 'generate' | 'ask'

export interface OpenAIRequest {
  mode: OpenAIMode
  prompt: string
  existingCode?: string
  csvFiles?: Array<{ fileName: string; csvData: string }>
  images?: Array<{ fileName: string; base64Data: string; mimeType: string }>
  privacyMode: boolean
  contextWindow?: string
  isNistProject: boolean
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
