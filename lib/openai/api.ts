/**
 * OpenAI API - Code Generation & Context
 */

import type { OpenAIRequest, OpenAIResponse, OpenAIContextRequest, FormatScriptRequest, FormatScriptResponse } from '@/types/openai'
import { getClient, handleApiError, CONFIG } from './client'
import { parseResponse } from '@/utils/openaiParser'
import { getSystemPrompt } from '@/templates/openai/prompts/systemPrompt'
import { buildUserMessage } from '@/templates/openai/messages/userMessage'
import { buildContextMessage } from '@/templates/openai/messages/contextMessage'
import { CONTEXT_SYSTEM_PROMPT, getDefaultContext } from '@/templates/openai/contextPrompts'
import { FORMAT_SYSTEM_PROMPT } from '@/templates/openai/prompts/formatPrompt'
import { buildFormatMessage } from '@/templates/openai/messages/formatMessage'

export async function callOpenAI(request: OpenAIRequest): Promise<OpenAIResponse> {
  try {
    const client = getClient()

    const completion = await client.chat.completions.create({
      model: CONFIG.model,
      messages: [
        { role: 'system', content: getSystemPrompt(request.mode, request.isNistProject, request.language) },
        { role: 'user', content: buildUserMessage(request) }
      ],
      max_completion_tokens: CONFIG.maxTokens.codeGeneration
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
      max_completion_tokens: CONFIG.maxTokens.contextGeneration
    })

    const context = completion.choices[0]?.message?.content || ''
    return context || getDefaultContext(request.csvFiles)
  } catch (error) {
    console.error('Context generation error, using fallback:', error)
    return getDefaultContext(request.csvFiles)
  }
}

export async function generateFormatScript(request: FormatScriptRequest): Promise<FormatScriptResponse> {
  const { prompt, csvSample, fileName } = request

  try {
    const client = getClient()

    const completion = await client.chat.completions.create({
      model: CONFIG.model,
      messages: [
        { role: 'system', content: FORMAT_SYSTEM_PROMPT },
        { role: 'user', content: buildFormatMessage(prompt, csvSample, fileName) }
      ],
      max_completion_tokens: CONFIG.maxTokens.codeGeneration,
      response_format: { type: 'json_object' }
    })

    const parsed = JSON.parse(completion.choices[0]?.message?.content || '{}')
    return {
      code: parsed.python_code || '',
      explanation: parsed.explanation || 'Transformation code generated'
    }
  } catch (error) {
    handleApiError(error)
  }
}
