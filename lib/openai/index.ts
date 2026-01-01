/**
 * OpenAI API - Code Generation & Context
 */

import type { OpenAIRequest, OpenAIResponse, OpenAIContextRequest } from '@/types'
import { getClient, handleApiError, CONFIG } from './client'
import { parseResponse } from './parser'
import {
  getSystemPrompt,
  buildUserMessage,
  buildContextMessage,
  CONTEXT_SYSTEM_PROMPT,
  getDefaultContextTemplate
} from '@/templates/openai'

export async function callOpenAI(request: OpenAIRequest): Promise<OpenAIResponse> {
  try {
    const client = getClient()

    console.log(`🤖 OpenAI ${request.mode} mode: Sending request...`)
    if (request.csvFiles?.length) {
      console.log(`📊 CSV files: ${request.csvFiles.map(f => f.fileName).join(', ')}`)
    }

    const completion = await client.chat.completions.create({
      model: CONFIG.model,
      messages: [
        { role: 'system', content: getSystemPrompt(request.mode, request.isNistProject) },
        { role: 'user', content: buildUserMessage(request) }
      ],
      temperature: CONFIG.temperature,
      max_tokens: CONFIG.maxTokens.codeGeneration
    })

    const responseText = completion.choices[0]?.message?.content || ''
    console.log(`✅ OpenAI response received (${responseText.length} chars)`)

    return parseResponse(responseText, request.mode)
  } catch (error) {
    handleApiError(error)
  }
}

export async function generateContext(request: OpenAIContextRequest): Promise<string> {
  try {
    const client = getClient()

    console.log(`🔍 Generating context for project: ${request.projectName}`)

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
    console.log(`✅ Context generated (${context.length} chars)`)

    return context || getDefaultContext(request)
  } catch (error: any) {
    console.error('Context generation error:', error)
    return getDefaultContext(request)
  }
}

function getDefaultContext(request: OpenAIContextRequest): string {
  const fileNames = request.csvFiles.map(f => f.fileName).join(', ')
  const keyFields = request.csvFiles[0]?.csvData.split('\n')[0] || 'Not specified'

  return getDefaultContextTemplate(keyFields, fileNames)
}
