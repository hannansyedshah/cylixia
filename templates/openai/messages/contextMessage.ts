/**
 * User Message Builder for Context Generation
 */

import type { OpenAIContextRequest } from '@/types/openai'

export function buildContextMessage(request: OpenAIContextRequest): string {
  const sections: string[] = []

  sections.push(`Project: ${request.projectName}`)

  const files = request.csvFiles.map((file, index) => {
    const preview = file.csvData.substring(0, 1000)
    return `File ${index + 1}: ${file.fileName}\nData preview:\n${preview}`
  })

  sections.push(`CSV Files:\n\n${files.join('\n\n')}`)

  return sections.join('\n\n')
}
