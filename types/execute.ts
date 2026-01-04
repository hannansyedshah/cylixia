export interface ExecuteRequest {
  code: string
  csv_files?: Array<{ filename: string; data_base64: string }>
  projectId?: string
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
