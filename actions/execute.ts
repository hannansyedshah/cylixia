'use server'

interface ExecuteRequest {
  code: string
  csv_files?: Array<{ filename: string; data_base64: string }>
}

interface ExecuteResponse {
  stdout?: string
  stderr?: string
  plot_base64?: Array<{ filename: string; data: string }>
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
      body: JSON.stringify(request),
    })

    const text = await response.text()
    let data: ExecuteResponse

    try {
      data = JSON.parse(text)
    } catch {
      data = { stderr: text || 'Execution failed' }
    }

    return data
  } catch (err: any) {
    return { stderr: err.message || 'Execution failed' }
  }
}
