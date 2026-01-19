import type { AskDataRequest, AskDataResponse } from '@/types/openai'
import { getClient, handleApiError, CONFIG } from './client'
import { getAskSystemPrompt } from '@/templates/openai/prompts/askPrompt'
import { buildUserMessage } from '@/templates/openai/messages/userMessage'
import { parseResponse } from '@/utils/openaiParser'
import { randomizeCSVData } from '@/utils/dataRandomizer'

const ASK_CONFIG = {
  temperature: 0.7,
  maxTokens: 2048
} as const

export async function callOpenAIAsk(request: AskDataRequest): Promise<AskDataResponse> {
  try {
    const client = getClient()

    const csvFiles = request.csvFiles
      ?.filter((f) => f.csvData && f.fileName)
      .map((f) => ({
        fileName: f.fileName,
        csvData: request.privacyMode ? randomizeCSVData(f.csvData) : f.csvData,
      }))

    const completion = await client.chat.completions.create({
      model: CONFIG.model,
      messages: [
        { role: 'system', content: getAskSystemPrompt(request.isNistProject, request.language) },
        { role: 'user', content: buildUserMessage({ ...request, csvFiles, mode: 'ask' }) }
      ],
      temperature: ASK_CONFIG.temperature,
      max_tokens: ASK_CONFIG.maxTokens
    })

    const responseText = completion.choices[0]?.message?.content || ''
    const parsed = parseResponse(responseText, 'ask', request.language)

    return {
      explanation: parsed.explanation || parsed.message,
      codeSnippet: parsed.code || undefined,
      nextSuggestions: parsed.nextSuggestions
    }
  } catch (error) {
    handleApiError(error)
  }
}
