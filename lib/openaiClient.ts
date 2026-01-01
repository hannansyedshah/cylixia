/**
 * OpenAI Client for R Code Generation
 * Replaces Airia client with GPT-4o
 */

import OpenAI from 'openai'
import type { OpenAIRequest, OpenAIResponse, OpenAIContextRequest } from '@/types'

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

function getSystemPrompt(mode: 'generate' | 'ask', isNistProject: boolean): string {
  const basePrompt = `You are an expert R programmer and statistical analyst specializing in data visualization and analysis.
You generate clean, well-documented, publication-ready R code following best practices.

IMPORTANT GUIDELINES:
- Always use individual tidyverse packages (ggplot2, dplyr, readr, tidyr, stringr, purrr, tibble, forcats) - NEVER use library(tidyverse)
- Include all necessary library() calls at the top of your code
- Generate complete, executable R code
- Add helpful comments explaining key steps
- Use modern R idioms and syntax
- Handle edge cases gracefully`

  const nistAddendum = isNistProject
    ? `

NIST COMPLIANCE:
- All data values are de-identified tokens - treat them as such
- Do not attempt to infer actual patient/subject information
- Focus on structural analysis patterns, not specific values
- Reference the provided research context for parameters`
    : ''

  if (mode === 'generate') {
    return `${basePrompt}${nistAddendum}

OUTPUT FORMAT (JSON):
Return a valid JSON object with this structure:
{
  "r_code": "# Complete R code here...",
  "explanation": "Brief explanation of what the code does",
  "plot_description": "If visualization is generated, describe what it shows",
  "next_suggestions": ["Suggestion 1", "Suggestion 2", "Suggestion 3"]
}

The r_code field must contain complete, executable R code.
Provide 2-4 actionable next suggestions.`
  }

  // ask mode
  return `${basePrompt}${nistAddendum}

MODE: Question Answering
The user is asking a question about their data or code, not requesting new code generation.

OUTPUT FORMAT (JSON):
{
  "explanation": "Detailed answer to the user's question",
  "r_code": "Optional: R code snippet if helpful (can be empty string)",
  "plot_description": "If discussing visualizations, describe relevant aspects",
  "next_suggestions": ["Follow-up question 1", "Related topic 2"]
}

Focus on clear, educational explanations.
Include code snippets only when they illustrate your answer.`
}

function buildUserMessage(request: OpenAIRequest): string {
  let message = `USER REQUEST: ${request.prompt}\n\n`

  if (request.existingCode) {
    message += `CURRENT R CODE:\n\`\`\`r\n${request.existingCode}\n\`\`\`\n\n`
  }

  if (request.csvFiles && request.csvFiles.length > 0) {
    const privacyNote = request.privacyMode
      ? '⚠️ NOTE: This CSV data has been RANDOMIZED for privacy protection. Use for structural analysis only.'
      : '✓ NOTE: This is ORIGINAL data with real values.'

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
  // Try to parse as JSON
  try {
    let jsonText = text

    // Extract from markdown code block if present
    const jsonBlockMatch = text.match(/```json\s*\n?([\s\S]*?)```/)
    if (jsonBlockMatch) {
      jsonText = jsonBlockMatch[1].trim()
    }

    // Clean up artifacts
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
    // Fallback: extract code from markdown block
    const codeBlockMatch = text.match(/```r?\n?([\s\S]*?)```/)
    if (codeBlockMatch) {
      return {
        code: codeBlockMatch[1].trim(),
        message: 'Here\'s the R code:'
      }
    }

    // If looks like R code, treat as code
    if (text.includes('library(') || text.includes('ggplot(') || text.includes('<-')) {
      return {
        code: text.trim(),
        message: 'Here\'s the R code for your request:'
      }
    }

    // Otherwise treat as plain message
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

    // User-friendly error messages
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

    const systemPrompt = `You are a research data analyst specializing in NIST-compliant data analysis.
Analyze the provided CSV data and generate a research context template.

OUTPUT FORMAT (plain text, no markdown):
Study Type: [Infer study type - Clinical trial, Observational, Cross-sectional, Longitudinal]

Objective: [Infer main research objective based on data structure]

Dataset Key Fields: [List important column names, comma-separated]

Preferred Analysis Types: [3-5 appropriate analyses - Linear regression, Logistic regression, etc.]

Additional Notes: [Important observations about dataset structure or quality]

Return ONLY the template above with values filled in. No code blocks, no extra formatting.`

    let userMessage = `Project: ${request.projectName}\n\nCSV Files:\n`
    request.csvFiles.forEach((file, index) => {
      userMessage += `\nFile ${index + 1}: ${file.fileName}\n`
      userMessage += `Data preview:\n${file.csvData.substring(0, 1000)}\n`
    })

    console.log(`🔍 Generating context for project: ${request.projectName}`)

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userMessage }
      ],
      temperature: 0.3,
      max_tokens: 1024
    })

    const context = completion.choices[0]?.message?.content || ''
    console.log(`✅ Context generated (${context.length} chars)`)

    return context || generateDefaultContext(request)
  } catch (error: any) {
    console.error('Context generation error:', error)
    return generateDefaultContext(request)
  }
}

function generateDefaultContext(request: OpenAIContextRequest): string {
  const fileNames = request.csvFiles.map(f => f.fileName).join(', ')

  let keyFields = 'Not specified'
  if (request.csvFiles.length > 0) {
    const headers = request.csvFiles[0].csvData.split('\n')[0] || ''
    keyFields = headers
  }

  return `Study Type: [To be specified]

Objective: [To be specified]

Dataset Key Fields: ${keyFields}

Dataset Files: ${fileNames || 'No files uploaded'}

Preferred Analysis Types: [To be specified]

Additional Notes: NIST-compliant mode. All PHI fields treated as de-identified tokens.`
}
