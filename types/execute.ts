import type { Language } from '@/templates/openai/languages'

export interface ExecuteRequest {
  code: string
  csv_files?: Array<{ filename: string; data_base64: string }>
  projectId?: string
  language: Language
}

export interface RawExecuteResponse {
  stdout?: string
  stderr?: string
  plot_base64?: Array<{ filename: string; data: string }>
}

export interface ExecuteResponse {
  stdout?: string
  stderr?: string
  plot_urls?: string[]
}
