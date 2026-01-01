/**
 * OpenAI Client for R Code Generation
 */

import OpenAI from 'openai'
import type { OpenAIRequest, OpenAIResponse, OpenAIContextRequest } from '@/types'
import {
  getSystemPrompt,
  PRIVACY_NOTE_RANDOMIZED,
  PRIVACY_NOTE_ORIGINAL,
  CONTEXT_SYSTEM_PROMPT,
  getDefaultContextTemplate
} from '@/templates/openai'

let client: OpenAI | null = null

function getClient(): OpenAI {
  if (!client) {
    const apiKey = process.env.OPENAI_API_KEY
    if (!apiKey) {
      throw new Error('OPENAI_API_KEY not configured in environment variables')
    }
    client = new OpenAI({ apiKey })
  }
  return client
}

function buildUserMessage(request: OpenAIRequest): string {
  let message = `USER REQUEST: ${request.prompt}\n\n`

  if (request.existingCode) {
    message += `CURRENT R CODE:\n\`\`\`r\n${request.existingCode}\n\`\`\`\n\n`
  }

  if (request.csvFiles && request.csvFiles.length > 0) {
    const privacyNote = request.privacyMode ? PRIVACY_NOTE_RANDOMIZED : PRIVACY_NOTE_ORIGINAL
    message += `${privacyNote}\n\nDATASETS:\n`

    request.csvFiles.forEach((file, index) => {
      const preview = file.csvData.substring(0, 500)
      message += `\n--- File ${index + 1}: ${file.fileName} (${file.csvData.length} chars) ---\n`
      message += `${preview}${file.csvData.length > 500 ? '\n...(truncated)' : ''}\n`
    })
  }

  if (request.contextWindow) {
    message += `\nRESEARCH CONTEXT:\n${request.contextWindow}\n`
  }

  return message
}

function parseResponse(text: string, mode: 'generate' | 'ask'): OpenAIResponse {
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

    const parsed = JSON.parse(jsonText)

    return {
      code: parsed.r_code || '',
      message: mode === 'ask' ? 'Here\'s the answer to your question:' : 'Here\'s the R code for your request:',
      explanation: parsed.explanation,
      plotDescription: parsed.plot_description,
      nextSuggestions: parsed.next_suggestions
    }
  } catch {
    const codeBlockMatch = text.match(/```r?\n?([\s\S]*?)```/)
    if (codeBlockMatch) {
      return {
        code: codeBlockMatch[1].trim(),
        message: 'Here\'s the R code:'
      }
    }

    if (text.includes('library(') || text.includes('ggplot(') || text.includes('<-')) {
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
}

export async function callOpenAI(request: OpenAIRequest): Promise<OpenAIResponse> {
  try {
    const openai = getClient()
    const systemPrompt = getSystemPrompt(request.mode, request.isNistProject)
    const userMessage = buildUserMessage(request)

    console.log(`🤖 OpenAI ${request.mode} mode: Sending request...`)
    if (request.csvFiles && request.csvFiles.length > 0) {
      console.log(`📊 CSV files: ${request.csvFiles.map(f => f.fileName).join(', ')}`)
    }

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userMessage }
      ],
      temperature: 0.3,
      max_tokens: 4096
    })

    const responseText = completion.choices[0]?.message?.content || ''
    console.log(`✅ OpenAI response received (${responseText.length} chars)`)

    return parseResponse(responseText, request.mode)
  } catch (error: any) {
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
}

export async function generateContext(request: OpenAIContextRequest): Promise<string> {
  try {
    const openai = getClient()

    let userMessage = `Project: ${request.projectName}\n\nCSV Files:\n`
    request.csvFiles.forEach((file, index) => {
      userMessage += `\nFile ${index + 1}: ${file.fileName}\n`
      userMessage += `Data preview:\n${file.csvData.substring(0, 1000)}\n`
    })

    console.log(`🔍 Generating context for project: ${request.projectName}`)

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: CONTEXT_SYSTEM_PROMPT },
        { role: 'user', content: userMessage }
      ],
      temperature: 0.3,
      max_tokens: 1024
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
  let keyFields = 'Not specified'

  if (request.csvFiles.length > 0) {
    keyFields = request.csvFiles[0].csvData.split('\n')[0] || 'Not specified'
  }

  return getDefaultContextTemplate(keyFields, fileNames)
}
