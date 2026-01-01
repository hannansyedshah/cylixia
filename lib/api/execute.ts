interface ExecuteRequest {
  code: string
  csvFiles?: Array<{ fileName: string; csvData: string }>
}

interface ExecuteResponse {
  stdout?: string
  stderr?: string
  plot_base64?: Array<{ filename: string; data: string }>
}

export async function executeCode(request: ExecuteRequest): Promise<ExecuteResponse> {
  const res = await fetch('/api/execute', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request)
  })

  return res.json()
}
