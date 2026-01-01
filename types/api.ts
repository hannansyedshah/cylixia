// API request/response types

export type AiriaMode = 'legacy' | 'quick' | 'ask'

export interface AiriaRequest {
  userId: string
  userInput: string
  asyncOutput: boolean
  csvData?: string
  fileName?: string
  csvFiles?: Array<{ fileName: string; csvData: string }>
}

export interface AiriaResponse {
  output?: string | Record<string, unknown>
  result?: string | Record<string, unknown>
  error?: string
  rCode?: string
  message?: string
}

export interface ApiError {
  error: string
  details?: string
}
