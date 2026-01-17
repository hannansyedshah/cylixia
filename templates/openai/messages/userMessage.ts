/**
 * User Message Builder for Code Generation
 */

import type { OpenAIRequest, MessageContent, TextContent, ImageContent } from '@/types/openai'
import { getLanguageConfig } from '../languages'
import { PRIVACY_NOTE_RANDOMIZED, PRIVACY_NOTE_ORIGINAL } from '../prompts/systemPrompt'

export function buildUserMessage(request: OpenAIRequest): MessageContent {
  const sections: string[] = []
  const config = getLanguageConfig(request.language)

  sections.push(`USER REQUEST: ${request.prompt}`)

  if (request.existingCode) {
    sections.push(`CURRENT ${config.name.toUpperCase()} CODE:\n\`\`\`${config.codeBlockTag}\n${request.existingCode}\n\`\`\``)
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

  const textContent = sections.join('\n\n')

  if (request.images && request.images.length > 0) {
    const content: Array<TextContent | ImageContent> = [
      { type: 'text', text: textContent }
    ]

    for (const image of request.images) {
      content.push({
        type: 'image_url',
        image_url: { url: `data:${image.mimeType};base64,${image.base64Data}` }
      })
    }

    return content
  }

  return textContent
}
