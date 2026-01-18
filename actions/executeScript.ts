'use server'

import type { ScriptExecuteRequest, ScriptExecuteResponse } from '@/types/execute'

export async function executeScript(request: ScriptExecuteRequest): Promise<ScriptExecuteResponse> {
  const executionUrl = process.env.PYTHON_SCRIPT_EXECUTION_URL

  if (!executionUrl) {
    return {
      success: false,
      stdout: '',
      stderr: 'Python script execution service not configured',
      csv_output: null
    }
  }

  try {
    const response = await fetch(executionUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        code: request.code,
        csv_file: request.csv_file
      }),
    })

    const text = await response.text()

    try {
      return JSON.parse(text)
    } catch {
      return {
        success: false,
        stdout: '',
        stderr: text || 'Execution failed',
        csv_output: null
      }
    }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Execution failed'
    return {
      success: false,
      stdout: '',
      stderr: message,
      csv_output: null
    }
  }
}
