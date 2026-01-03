'use server'

import { savePlots } from '@/lib/db/plots'

interface ExecuteRequest {
  code: string
  csv_files?: Array<{ filename: string; data_base64: string }>
  projectId?: string  // Optional: if provided, plots will be uploaded to storage
}

interface RawExecuteResponse {
  stdout?: string
  stderr?: string
  plot_base64?: Array<{ filename: string; data: string }>
}

interface ExecuteResponse {
  stdout?: string
  stderr?: string
  plot_base64?: Array<{ filename: string; data: string }>  // Kept for backwards compatibility
  plot_urls?: string[]  // Storage URLs for persisted plots
}

const R_EXECUTION_URL = process.env.R_EXECUTION_URL!

export async function executeCode(request: ExecuteRequest): Promise<ExecuteResponse> {
  if (!R_EXECUTION_URL) {
    return { stderr: 'R_EXECUTION_URL not configured' }
  }

  try {
    const response = await fetch(R_EXECUTION_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        code: request.code,
        csv_files: request.csv_files
      }),
    })

    const text = await response.text()
    let data: RawExecuteResponse

    try {
      data = JSON.parse(text)
    } catch {
      data = { stderr: text || 'Execution failed' }
    }

    // If projectId is provided and we have plots, upload them to storage
    if (request.projectId && data.plot_base64?.length) {
      const plotsBase64 = data.plot_base64.map(p => p.data)
      const plotUrls = await savePlots(request.projectId, plotsBase64)

      return {
        stdout: data.stdout,
        stderr: data.stderr,
        plot_base64: data.plot_base64,  // Keep for backwards compatibility
        plot_urls: plotUrls
      }
    }

    return data
  } catch (err: any) {
    return { stderr: err.message || 'Execution failed' }
  }
}
