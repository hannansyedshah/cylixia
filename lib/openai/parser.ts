/**
 * OpenAI Response Parser
 */

import type { OpenAIResponse, OpenAIMode } from '@/types'

export function parseResponse(text: string, mode: OpenAIMode): OpenAIResponse {
  const jsonResponse = tryParseJson(text)
  if (jsonResponse) {
    return {
      code: jsonResponse.r_code || '',
      message: mode === 'ask' ? 'Here\'s the answer to your question:' : 'Here\'s the R code for your request:',
      explanation: jsonResponse.explanation,
      plotDescription: jsonResponse.plot_description,
      nextSuggestions: jsonResponse.next_suggestions
    }
  }

  const codeBlock = extractCodeBlock(text)
  if (codeBlock) {
    return {
      code: codeBlock,
      message: 'Here\'s the R code:'
    }
  }

  if (looksLikeRCode(text)) {
    return {
      code: text.trim(),
      message: 'Here\'s the R code for your request:'
    }
  }

  return {
    code: '',
    message: text.trim()
  }
}

function tryParseJson(text: string): Record<string, any> | null {
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

function extractCodeBlock(text: string): string | null {
  const match = text.match(/```r?\n?([\s\S]*?)```/)
  return match ? match[1].trim() : null
}

function looksLikeRCode(text: string): boolean {
  return text.includes('library(') || text.includes('ggplot(') || text.includes('<-')
}
