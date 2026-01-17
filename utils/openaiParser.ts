/**
 * OpenAI Response Parser
 */

import type { OpenAIResponse, OpenAIMode, Language } from '@/types/openai'
import { getResponseMessage } from '@/templates/openai/responseMessages'
import { getLanguageConfig } from '@/templates/openai/languages'

interface ParsedJson {
  r_code?: string
  python_code?: string
  explanation?: string
  plot_description?: string
  next_suggestions?: string[]
}

export function parseResponse(text: string, mode: OpenAIMode, language: Language = 'r'): OpenAIResponse {
  const config = getLanguageConfig(language)
  const jsonResponse = tryParseJson(text)

  if (jsonResponse) {
    const code = (jsonResponse as Record<string, unknown>)[config.codeField] as string | undefined
      || jsonResponse.r_code
      || jsonResponse.python_code
      || ''
    return {
      code,
      message: getResponseMessage(mode),
      explanation: jsonResponse.explanation,
      plotDescription: jsonResponse.plot_description,
      nextSuggestions: jsonResponse.next_suggestions
    }
  }

  const codeBlock = extractCodeBlock(text, config.codeBlockTag)
  if (codeBlock) {
    return {
      code: codeBlock,
      message: getResponseMessage('generate', 'codeBlock')
    }
  }

  if (looksLikeCode(text, config.codeIndicators)) {
    return {
      code: text.trim(),
      message: getResponseMessage('generate')
    }
  }

  return {
    code: '',
    message: text.trim()
  }
}

function tryParseJson(text: string): ParsedJson | null {
  try {
    let jsonText = text

    const jsonBlockMatch = text.match(/```json\s*\n?([\s\S]*?)```/)
    if (jsonBlockMatch) {
      jsonText = jsonBlockMatch[1].trim()
    }

    jsonText = jsonText
      .replace(/^```json\s*/g, '')
      .replace(/```\s*$/g, '')
      .trim()

    return JSON.parse(jsonText)
  } catch {
    return null
  }
}

function extractCodeBlock(text: string, codeBlockTag: string): string | null {
  const pattern = new RegExp(`\`\`\`(?:${codeBlockTag})?\\n?([\\s\\S]*?)\`\`\``)
  const match = text.match(pattern)
  return match ? match[1].trim() : null
}

function looksLikeCode(text: string, codeIndicators: string[]): boolean {
  return codeIndicators.some(indicator => text.includes(indicator))
}
