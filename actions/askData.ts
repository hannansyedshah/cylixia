'use server'

import { callOpenAIAsk } from '@/lib/openai/ask'
import type { SendAskDataInput, SendAskDataResponse } from '@/types/openai'

export async function sendAskData(request: SendAskDataInput): Promise<SendAskDataResponse> {
  if (!process.env.OPENAI_API_KEY) {
    return {
      message: 'Add OPENAI_API_KEY to get real answers about your data.'
    }
  }

  const response = await callOpenAIAsk({
    ...request,
    privacyMode: request.privacyMode ?? true,
    isNistProject: request.isNistProject ?? false
  })

  return {
    message: response.explanation,
    explanation: response.explanation,
    codeSnippet: response.codeSnippet,
    nextSuggestions: response.nextSuggestions
  }
}
