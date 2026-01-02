'use client'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Send, Sparkles, Copy, Check, Loader2, Maximize2, Minimize2 } from 'lucide-react'
import { useChatPanel } from '@/hooks/workspace/useChatPanel'
import type { Message } from '@/types/database'

interface ChatPanelProps {
  messages: Message[]
  loading: boolean
  elapsedSeconds: number
  estimatedSeconds: number
  isNist: boolean
  hasContext: boolean
  hasDatasets: boolean
  privacyMode: boolean
  onPrivacyModeChange: (enabled: boolean) => void
  onSendMessage: (prompt: string) => void
}

export function ChatPanel({
  messages,
  loading,
  elapsedSeconds,
  estimatedSeconds,
  isNist,
  hasContext,
  hasDatasets,
  privacyMode,
  onPrivacyModeChange,
  onSendMessage
}: ChatPanelProps) {
  const {
    prompt,
    setPrompt,
    copiedId,
    isExpanded,
    toggleExpand,
    handleSend,
    handleCopy
  } = useChatPanel({ loading, onSendMessage })

  return (
    <div className="flex flex-col h-full">
      {/* Loading indicator */}
      {loading && (
        <div className="p-4 border-b bg-blue-50">
          <div className="flex items-center gap-3">
            <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
            <div className="flex-1">
              <div className="text-sm font-medium">Processing...</div>
              <div className="h-2 bg-gray-200 rounded-full mt-1">
                <div
                  className="h-2 bg-blue-600 rounded-full transition-all"
                  style={{ width: `${Math.min((elapsedSeconds / estimatedSeconds) * 100, 95)}%` }}
                />
              </div>
            </div>
            <span className="text-xs text-gray-500">{elapsedSeconds}s / ~{estimatedSeconds}s</span>
          </div>
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="text-center text-gray-500 py-8">
            Start by asking a question about your data
          </div>
        ) : (
          messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[80%] rounded-lg p-3 ${
                  msg.role === 'user'
                    ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white'
                    : 'bg-gray-100'
                }`}
              >
                <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                {msg.code && (
                  <div className="mt-2 bg-blue-50 border border-blue-200 rounded-lg p-3 relative">
                    <div className="absolute top-2 right-2 flex gap-1">
                      <button
                        onClick={() => toggleExpand(msg.id)}
                        className="p-1.5 hover:bg-blue-100 rounded-md transition-colors"
                        title={isExpanded(msg.id) ? 'Collapse' : 'Expand'}
                      >
                        {isExpanded(msg.id) ? (
                          <Minimize2 className="h-3.5 w-3.5 text-blue-600" />
                        ) : (
                          <Maximize2 className="h-3.5 w-3.5 text-blue-600" />
                        )}
                      </button>
                      <button
                        onClick={() => handleCopy(msg.code!, msg.id)}
                        className="p-1.5 hover:bg-blue-100 rounded-md transition-colors"
                        title="Copy code"
                      >
                        {copiedId === msg.id ? (
                          <Check className="h-3.5 w-3.5 text-green-600" />
                        ) : (
                          <Copy className="h-3.5 w-3.5 text-blue-600" />
                        )}
                      </button>
                    </div>
                    <pre className={`text-xs text-gray-800 overflow-x-auto pr-16 ${isExpanded(msg.id) ? 'max-h-none' : 'max-h-32 overflow-y-hidden'}`}>
                      {isExpanded(msg.id)
                        ? msg.code
                        : (msg.code.length > 300 ? msg.code.slice(0, 300) + '...' : msg.code)
                      }
                    </pre>
                    {!isExpanded(msg.id) && msg.code.length > 300 && (
                      <button
                        onClick={() => toggleExpand(msg.id)}
                        className="mt-2 text-xs text-blue-600 hover:text-blue-800 font-medium"
                      >
                        Show full code
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Privacy toggle */}
      {hasDatasets && (
        <div className="px-4 py-2 border-t bg-gray-50 flex items-center justify-between">
          <span className="text-xs text-gray-500">
            {privacyMode ? 'Data randomized for privacy' : 'Using original data'}
          </span>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={privacyMode}
              onChange={(e) => onPrivacyModeChange(e.target.checked)}
              className="w-3 h-3"
            />
            <span className="text-xs">Randomize</span>
          </label>
        </div>
      )}

      {/* Input */}
      <div className="p-4 border-t bg-white">
        <div className="flex gap-2">
          <Input
            placeholder="Ask about your data..."
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSend()}
            disabled={loading}
            className="flex-1"
          />
          <Button onClick={handleSend} disabled={loading || !prompt.trim()}>
            {isNist ? (
              <>
                <Sparkles className="h-4 w-4 mr-1" />
                {hasContext ? 'Send' : 'Contextualize'}
              </>
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>
    </div>
  )
}
