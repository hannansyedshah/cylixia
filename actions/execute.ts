'use server'

import { savePlots } from '@/lib/db/plots'
import { canEditProject } from '@/lib/db/collaborators'
import type { ExecuteRequest, ExecuteResponse, RawExecuteResponse } from '@/types/execute'

const R_EXECUTION_URL = process.env.R_EXECUTION_URL
const PYTHON_EXECUTION_URL = process.env.PYTHON_EXECUTION_URL

export async function executeCode(request: ExecuteRequest): Promise<ExecuteResponse> {
  const executionUrl = request.language === 'python' ? PYTHON_EXECUTION_URL : R_EXECUTION_URL
  const languageLabel = request.language === 'python' ? 'Python' : 'R'

  if (!executionUrl) {
    return { stderr: `${languageLabel} execution service not configured` }
  }

  if (request.projectId) {
    const canEdit = await canEditProject(request.projectId)
    if (!canEdit) {
      return { stderr: 'You do not have permission to execute code in this project' }
    }
  }

  try {
    const response = await fetch(executionUrl, {
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

    const plotUrls = request.projectId && data.plot_base64?.length
      ? await savePlots(request.projectId, data.plot_base64.map(p => p.data))
      : []

    return {
      stdout: data.stdout,
      stderr: data.stderr,
      plot_urls: plotUrls.length > 0 ? plotUrls : undefined
    }
  } catch (err: any) {
    return { stderr: err.message || 'Execution failed' }
  }
}
