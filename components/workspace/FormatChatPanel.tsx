'use client'

import { useState } from 'react'
import { Editor } from '@monaco-editor/react'
import { Send, Play, Save, Loader2, Code, MessageSquare } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { FormatMessage } from '@/types/format'

interface FormatChatPanelProps {
  messages: FormatMessage[]
  generatedCode: string
  loading: boolean
  executing: boolean
  saving: boolean
  hasPreview: boolean
  onSendPrompt: (prompt: string) => void
  onRunScript: () => void
  onSaveResult: () => void
  onCodeChange: (code: string) => void
}

export function FormatChatPanel({
  messages,
  generatedCode,
  loading,
  executing,
  saving,
  hasPreview,
  onSendPrompt,
  onRunScript,
  onSaveResult,
  onCodeChange
}: FormatChatPanelProps) {
  const [prompt, setPrompt] = useState('')

  const handleSend = () => {
    if (!prompt.trim() || loading) return
    onSendPrompt(prompt.trim())
    setPrompt('')
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <div className="h-full flex flex-col bg-zinc-900">
      {/* Messages area */}
      <div className="flex-shrink-0 max-h-[30%] overflow-y-auto border-b border-zinc-700">
        {messages.length === 0 ? (
          <div className="p-4 text-center text-zinc-500">
            <MessageSquare className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">Describe how you want to transform your data</p>
            <p className="text-xs mt-1 text-zinc-600">
              e.g., &quot;Remove duplicate rows&quot; or &quot;Convert dates to YYYY-MM-DD&quot;
            </p>
          </div>
        ) : (
          <div className="p-3 space-y-3">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`p-2 rounded-lg text-sm ${
                  msg.role === 'user'
                    ? 'bg-blue-500/20 text-blue-200 ml-4'
                    : 'bg-zinc-800 text-zinc-300 mr-4'
                }`}
              >
                {msg.content}
              </div>
            ))}
            {loading && (
              <div className="flex items-center gap-2 text-zinc-400 text-sm">
                <Loader2 className="h-4 w-4 animate-spin" />
                Generating transformation code...
              </div>
            )}
          </div>
        )}
      </div>

      {/* Code editor */}
      <div className="flex-1 min-h-0 flex flex-col">
        <div className="px-3 py-2 bg-zinc-800/50 border-b border-zinc-700 flex items-center gap-2">
          <Code className="h-4 w-4 text-emerald-400" />
          <span className="text-xs font-medium text-zinc-300">Python Script</span>
        </div>
        <div className="flex-1 min-h-0">
          {generatedCode ? (
            <Editor
              height="100%"
              defaultLanguage="python"
              language="python"
              value={generatedCode}
              onChange={(value) => onCodeChange(value || '')}
              theme="vs-dark"
              options={{
                minimap: { enabled: false },
                fontSize: 12,
                lineNumbers: 'on',
                scrollBeyondLastLine: false,
                automaticLayout: true,
                padding: { top: 8, bottom: 8 },
              }}
            />
          ) : (
            <div className="h-full flex items-center justify-center text-zinc-500 p-4">
              <div className="text-center">
                <Code className="h-10 w-10 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No code generated yet</p>
                <p className="text-xs mt-1 text-zinc-600">
                  Enter a transformation prompt above
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Input and actions */}
      <div className="flex-shrink-0 p-3 bg-zinc-800/50 border-t border-zinc-700 space-y-3">
        {/* Prompt input */}
        <div className="flex gap-2">
          <input
            type="text"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Describe transformation..."
            disabled={loading}
            className="flex-1 px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-sm text-white placeholder:text-zinc-500 focus:outline-none focus:border-blue-500"
          />
          <Button
            onClick={handleSend}
            disabled={!prompt.trim() || loading}
            size="sm"
            className="bg-blue-500 hover:bg-blue-400 text-white"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </div>

        {/* Action buttons */}
        <div className="flex gap-2">
          <Button
            onClick={onRunScript}
            disabled={!generatedCode || executing}
            className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white"
          >
            {executing ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Running...
              </>
            ) : (
              <>
                <Play className="h-4 w-4 mr-2" />
                Run
              </>
            )}
          </Button>
          <Button
            onClick={onSaveResult}
            disabled={!hasPreview || saving}
            className="flex-1 bg-teal-600 hover:bg-teal-500 text-white"
          >
            {saving ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Save
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  )
}
