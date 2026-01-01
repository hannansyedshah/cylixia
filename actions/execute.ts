'use server'

interface ExecuteRequest {
  code: string
  csvFiles?: Array<{ fileName: string; csvData: string }>
}

interface ExecuteResponse {
  stdout?: string
  stderr?: string
  plot_base64?: Array<{ filename: string; data: string }>
}

const R_EXECUTION_URL = process.env.R_EXECUTION_URL || 'https://ShayanShah1124-cReate.hf.space/run'

export async function executeCode(request: ExecuteRequest): Promise<ExecuteResponse> {
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
