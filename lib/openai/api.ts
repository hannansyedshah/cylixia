/**
 * OpenAI API - Code Generation & Context
 */

import type { OpenAIRequest, OpenAIResponse, OpenAIContextRequest } from '@/types/openai'
import { getClient, handleApiError, CONFIG } from './client'
import { parseResponse } from '@/utils/openaiParser'
import { getSystemPrompt } from '@/templates/openai/prompts/systemPrompt'
import { buildUserMessage } from '@/templates/openai/messages/userMessage'
import { buildContextMessage } from '@/templates/openai/messages/contextMessage'
import { CONTEXT_SYSTEM_PROMPT, getDefaultContext } from '@/templates/openai/contextPrompts'

export async function callOpenAI(request: OpenAIRequest): Promise<OpenAIResponse> {
  try {
    const client = getClient()

    const completion = await client.chat.completions.create({
      model: CONFIG.model,
      messages: [
        { role: 'system', content: getSystemPrompt(request.mode, request.isNistProject, request.language) },
        { role: 'user', content: buildUserMessage(request) }
      ],
      temperature: CONFIG.temperature,
      max_tokens: CONFIG.maxTokens.codeGeneration
    })

    const responseText = completion.choices[0]?.message?.content || ''
    return parseResponse(responseText, request.mode, request.language)
  } catch (error) {
    handleApiError(error)
  }
}

export async function generateContext(request: OpenAIContextRequest): Promise<string> {
  try {
    const client = getClient()

    const completion = await client.chat.completions.create({
      model: CONFIG.model,
      messages: [
        { role: 'system', content: CONTEXT_SYSTEM_PROMPT },
        { role: 'user', content: buildContextMessage(request) }
      ],
      temperature: CONFIG.temperature,
      max_tokens: CONFIG.maxTokens.contextGeneration
    })

    const context = completion.choices[0]?.message?.content || ''
    return context || getDefaultContext(request.csvFiles)
  } catch (error) {
    console.error('Context generation error, using fallback:', error)
    return getDefaultContext(request.csvFiles)
  }
}
