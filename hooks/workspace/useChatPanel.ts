'use client'

import { useState, useCallback, useRef } from 'react'
import type { AttachedImage } from '@/types/image'
import { processImageFile, MAX_IMAGE_COUNT } from '@/utils/imageUtils'

interface UseChatPanelOptions {
  loading: boolean
  onSendMessage: (prompt: string, images?: AttachedImage[]) => void
}

export function useChatPanel({ loading, onSendMessage }: UseChatPanelOptions) {
  const [prompt, setPrompt] = useState('')
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set())
  const [attachedImages, setAttachedImages] = useState<AttachedImage[]>([])
  const [imageError, setImageError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

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
    onSendMessage(prompt, attachedImages.length > 0 ? attachedImages : undefined)
    setPrompt('')
    setAttachedImages([])
    setImageError(null)
  }, [prompt, loading, onSendMessage, attachedImages])

  const handleCopy = useCallback(async (code: string, id: string) => {
    await navigator.clipboard.writeText(code)
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 2000)
  }, [])

  const isExpanded = useCallback((id: string) => expandedIds.has(id), [expandedIds])

  const handleAttachImage = useCallback(async (files: FileList | null) => {
    if (!files?.length) return
    setImageError(null)

    const remainingSlots = MAX_IMAGE_COUNT - attachedImages.length
    if (remainingSlots <= 0) {
      setImageError(`Maximum ${MAX_IMAGE_COUNT} images allowed`)
      return
    }

    const results = await Promise.all(
      Array.from(files).slice(0, remainingSlots).map(processImageFile)
    )

    const error = results.find(r => 'error' in r)
    if (error && 'error' in error) {
      setImageError(error.error)
      return
    }

    setAttachedImages(prev => [...prev, ...(results as AttachedImage[])])
  }, [attachedImages.length])

  const handleRemoveImage = (index: number) => {
    setAttachedImages(prev => prev.filter((_, i) => i !== index))
    setImageError(null)
  }

  const triggerFileInput = () => fileInputRef.current?.click()

  return {
    prompt,
    setPrompt,
    copiedId,
    isExpanded,
    toggleExpand,
    handleSend,
    handleCopy,
    attachedImages,
    imageError,
    fileInputRef,
    handleAttachImage,
    handleRemoveImage,
    triggerFileInput
  }
}
