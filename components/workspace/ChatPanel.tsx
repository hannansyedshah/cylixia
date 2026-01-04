'use client'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Send, Sparkles, Copy, Check, Maximize2, Minimize2 } from 'lucide-react'
import { useChatPanel } from '@/hooks/workspace/useChatPanel'
import { AILoading } from './LoadingStates'
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
    <div className="flex flex-col h-full bg-zinc-900">
      {/* Loading indicator */}
      {loading && (
        <AILoading elapsedSeconds={elapsedSeconds} estimatedSeconds={estimatedSeconds} />
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="text-center text-zinc-500 py-8">
            Start by asking a question about your data
          </div>
        ) : (
          messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[80%] rounded-xl p-3 ${
                  msg.role === 'user'
                    ? 'bg-emerald-500/20 border border-emerald-500/30 text-white'
                    : 'bg-zinc-800 border border-zinc-700 text-zinc-200'
                }`}
              >
                <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                {msg.code && (
                  <div className="mt-2 bg-zinc-900 border border-zinc-700 rounded-lg p-3 relative">
                    <div className="absolute top-2 right-2 flex gap-1">
                      <button
                        onClick={() => toggleExpand(msg.id)}
                        className="p-1.5 hover:bg-zinc-800 rounded-md transition-colors"
                        title={isExpanded(msg.id) ? 'Collapse' : 'Expand'}
                      >
                        {isExpanded(msg.id) ? (
                          <Minimize2 className="h-3.5 w-3.5 text-zinc-400" />
                        ) : (
                          <Maximize2 className="h-3.5 w-3.5 text-zinc-400" />
                        )}
                      </button>
                      <button
                        onClick={() => handleCopy(msg.code!, msg.id)}
                        className="p-1.5 hover:bg-zinc-800 rounded-md transition-colors"
                        title="Copy code"
                      >
                        {copiedId === msg.id ? (
                          <Check className="h-3.5 w-3.5 text-emerald-500" />
                        ) : (
                          <Copy className="h-3.5 w-3.5 text-zinc-400" />
                        )}
                      </button>
                    </div>
                    <pre className={`text-xs text-zinc-300 overflow-x-auto pr-16 font-mono ${isExpanded(msg.id) ? 'max-h-none' : 'max-h-32 overflow-y-hidden'}`}>
                      {isExpanded(msg.id)
                        ? msg.code
                        : (msg.code.length > 300 ? msg.code.slice(0, 300) + '...' : msg.code)
                      }
                    </pre>
                    {!isExpanded(msg.id) && msg.code.length > 300 && (
                      <button
                        onClick={() => toggleExpand(msg.id)}
                        className="mt-2 text-xs text-emerald-400 hover:text-emerald-300 font-medium"
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
        <div className="px-4 py-2 border-t border-zinc-800 bg-zinc-800/50 flex items-center justify-between">
          <span className="text-xs text-zinc-400">
            {privacyMode ? 'Data randomized for privacy' : 'Using original data'}
          </span>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={privacyMode}
              onChange={(e) => onPrivacyModeChange(e.target.checked)}
              className="w-3 h-3 rounded border-zinc-600 bg-zinc-700 text-emerald-500 focus:ring-emerald-500"
            />
            <span className="text-xs text-zinc-300">Randomize</span>
          </label>
        </div>
      )}

      {/* Input */}
      <div className="p-4 border-t border-zinc-800 bg-zinc-900">
        <div className="flex gap-2">
          <Input
            placeholder="Ask about your data..."
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSend()}
            disabled={loading}
            className="flex-1 h-11 bg-zinc-800/50 border-zinc-700 text-white placeholder:text-zinc-500 focus:border-emerald-500 focus:ring-emerald-500/20"
          />
          <Button
            onClick={handleSend}
            disabled={loading || !prompt.trim()}
            className="h-11 bg-emerald-500 hover:bg-emerald-400 text-black font-medium"
          >
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
