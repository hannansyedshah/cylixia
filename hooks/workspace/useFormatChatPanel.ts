import { useState, useCallback } from 'react'

interface UseFormatChatPanelProps {
  loading: boolean
  onSendPrompt: (prompt: string) => void
}

export function useFormatChatPanel({ loading, onSendPrompt }: UseFormatChatPanelProps) {
  const [prompt, setPrompt] = useState('')

  const handleSend = useCallback(() => {
    if (!prompt.trim() || loading) return
    onSendPrompt(prompt.trim())
    setPrompt('')
  }, [prompt, loading, onSendPrompt])

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }, [handleSend])

  return {
    prompt,
    setPrompt,
    handleSend,
    handleKeyDown
  }
}
