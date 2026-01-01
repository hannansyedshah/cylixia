import type { OpenAIMode } from '@/types/openai'

interface ChatRequest {
  prompt: string
  mode: OpenAIMode
  existingCode?: string
  csvFiles?: Array<{ fileName: string; csvData: string }>
  privacyMode?: boolean
  contextWindow?: string
  isNistProject?: boolean
}

interface ChatResponse {
  message?: string
  code?: string
  explanation?: string
  plotDescription?: string
  nextSuggestions?: string[]
}

export async function sendChat(request: ChatRequest): Promise<ChatResponse> {
  const res = await fetch('/api/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request)
  })

  if (!res.ok) throw new Error('AI request failed')
  return res.json()
}
