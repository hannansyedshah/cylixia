'use client'

import { useState, useCallback } from 'react'

interface UseChatPanelOptions {
  loading: boolean
  onSendMessage: (prompt: string) => void
}

export function useChatPanel({ loading, onSendMessage }: UseChatPanelOptions) {
  const [prompt, setPrompt] = useState('')
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set())

  const toggleExpand = useCallback((id: string) => {
    setExpandedIds(prev => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }, [])

  const handleSend = useCallback(() => {
    if (!prompt.trim() || loading) return
    onSendMessage(prompt)
    setPrompt('')
  }, [prompt, loading, onSendMessage])

  const handleCopy = useCallback(async (code: string, id: string) => {
    await navigator.clipboard.writeText(code)
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 2000)
  }, [])

  const isExpanded = useCallback((id: string) => expandedIds.has(id), [expandedIds])

  return {
    prompt,
    setPrompt,
    copiedId,
    isExpanded,
    toggleExpand,
    handleSend,
    handleCopy
  }
}
