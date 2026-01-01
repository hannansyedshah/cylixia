'use server'

import { generateContext as generateContextOpenAI } from '@/lib/openai/api'

interface GenerateContextRequest {
  projectName: string
  csvFiles: Array<{ fileName: string; csvData: string }>
}

export async function generateContext(request: GenerateContextRequest): Promise<string> {
  const { projectName, csvFiles } = request

  if (!projectName || !csvFiles) {
    throw new Error('Missing required fields: projectName and csvFiles')
  }

  return generateContextOpenAI({ projectName, csvFiles })
}
