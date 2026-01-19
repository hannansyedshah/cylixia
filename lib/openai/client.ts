/**
 * OpenAI Client - Singleton and Configuration
 */

import OpenAI from 'openai'

export const CONFIG = {
  model: 'o3',
  maxTokens: {
    codeGeneration: 4096,
    contextGeneration: 1024
  }
} as const

let client: OpenAI | null = null

export function getClient(): OpenAI {
  if (!client) {
    const apiKey = process.env.OPENAI_API_KEY
    if (!apiKey) {
      throw new Error('OPENAI_API_KEY not configured in environment variables')
    }
    client = new OpenAI({ apiKey })
  }
  return client
}

export function handleApiError(error: any): never {
  console.error('OpenAI API error:', error)

  if (error.status === 429) {
    throw new Error('Rate limit exceeded. Please try again in a moment.')
  }
  if (error.status === 401) {
    throw new Error('AI service authentication failed. Please contact support.')
  }
  if (error.message?.includes('maximum context length')) {
    throw new Error('Request too large. Please reduce the amount of data being sent.')
  }

  throw new Error(error.message || 'Failed to get response from AI service')
}
