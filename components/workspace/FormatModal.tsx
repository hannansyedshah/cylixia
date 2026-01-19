'use client'

import { useEffect } from 'react'
import { X, Wand2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { FormatChatPanel } from './FormatChatPanel'
import { FormatPreviewPanel } from './FormatPreviewPanel'
import { useFormatModal } from '@/hooks/workspace/useFormatModal'
import type { DatasetItem } from '@/types/dataset'

interface FormatModalProps {
  isOpen: boolean
  dataset: DatasetItem | null
  projectId: string
  onClose: () => void
  onSave?: () => void
}

export function FormatModal({ isOpen, dataset, projectId, onClose, onSave }: FormatModalProps) {
  const {
    messages,
    generatedCode,
    previewCsv,
    loading,
    executing,
    saving,
    error,
    sendPrompt,
    runScript,
    saveResult,
    updateCode,
    reset
  } = useFormatModal({
    dataset,
    projectId,
    onSaveComplete: () => {
      onSave?.()
      onClose()
    }
  })

  // Reset state when modal opens/closes
  useEffect(() => {
    if (!isOpen) {
      reset()
    }
  }, [isOpen, reset])

  if (!isOpen || !dataset) return null

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="relative w-full max-w-6xl h-[85vh] flex flex-col">
        {/* Gradient background */}
        <div className="absolute -inset-1 bg-gradient-to-r from-blue-500/20 to-emerald-600/20 rounded-2xl blur-xl" />

        <div className="relative bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden flex flex-col h-full">
          {/* Header */}
          <div className="px-6 py-4 bg-gradient-to-r from-blue-900/50 to-emerald-900/50 border-b border-zinc-800 flex items-center justify-between flex-shrink-0">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-blue-500/20 backdrop-blur-sm flex items-center justify-center border border-blue-500/30">
                <Wand2 className="w-5 h-5 text-blue-400" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-white">Format Data</h2>
                <p className="text-sm text-zinc-400">{dataset.fileName}</p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="rounded hover:bg-zinc-800 text-zinc-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </Button>
          </div>

          {/* Content - split view */}
          <div className="flex-1 flex min-h-0">
            {/* Left panel - Chat + Code Editor */}
            <div className="w-1/2 border-r border-zinc-700">
              <FormatChatPanel
                messages={messages}
                generatedCode={generatedCode}
                loading={loading}
                executing={executing}
                saving={saving}
                hasPreview={!!previewCsv}
                onSendPrompt={sendPrompt}
                onRunScript={runScript}
                onSaveResult={saveResult}
                onCodeChange={updateCode}
              />
            </div>

            {/* Right panel - Preview */}
            <div className="w-1/2">
              <FormatPreviewPanel
                originalCsv={dataset.csvText || ''}
                previewCsv={previewCsv}
                error={error}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
