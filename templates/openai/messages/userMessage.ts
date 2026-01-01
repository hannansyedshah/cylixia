/**
 * User Message Builder for Code Generation
 */

import type { OpenAIRequest } from '@/types/openai'
import { PRIVACY_NOTE_RANDOMIZED, PRIVACY_NOTE_ORIGINAL } from '../prompts/systemPrompt'

export function buildUserMessage(request: OpenAIRequest): string {
  const sections: string[] = []

  sections.push(`USER REQUEST: ${request.prompt}`)

  if (request.existingCode) {
    sections.push(`CURRENT R CODE:\n\`\`\`r\n${request.existingCode}\n\`\`\``)
  }

  if (request.csvFiles && request.csvFiles.length > 0) {
    const privacyNote = request.privacyMode ? PRIVACY_NOTE_RANDOMIZED : PRIVACY_NOTE_ORIGINAL
    const datasets = request.csvFiles.map((file, index) => {
      const preview = file.csvData.substring(0, 500)
      const truncated = file.csvData.length > 500 ? '\n...(truncated)' : ''
      return `--- File ${index + 1}: ${file.fileName} (${file.csvData.length} chars) ---\n${preview}${truncated}`
    })

    sections.push(`${privacyNote}\n\nDATASETS:\n\n${datasets.join('\n\n')}`)
  }

  if (request.contextWindow) {
    sections.push(`RESEARCH CONTEXT:\n${request.contextWindow}`)
  }

  return sections.join('\n\n')
}
