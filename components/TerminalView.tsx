'use client'

import React from 'react'
import { ActivityIndicator } from './ActivityIndicator'

interface TerminalViewProps {
  stdout?: string
  stderr?: string
  projectId?: string
  realtimeCollaborationEnabled?: boolean // Whether real-time collaboration is enabled
  isWorkspaceBeingViewed?: boolean // Whether someone is viewing this workspace
}

export function TerminalView({ stdout = '', stderr = '', projectId, realtimeCollaborationEnabled = false, isWorkspaceBeingViewed = false }: TerminalViewProps) {
  const hasAnyOutput = Boolean(stdout?.trim() || stderr?.trim())
  const isLinked = realtimeCollaborationEnabled || isWorkspaceBeingViewed

  return (
    <div className="h-full w-full flex flex-col gap-2">
      {projectId && (
        <div className="flex-shrink-0">
          <ActivityIndicator projectId={projectId} />
        </div>
      )}
      <div className="flex-1 min-h-0 bg-black/90 text-green-200 rounded-lg border border-gray-700 overflow-hidden">
        <div className="px-3 py-2 text-xs text-gray-300 bg-black/70 border-b border-gray-700 flex items-center justify-between">
          <span>Terminal (view-only)</span>
          <div className="flex items-center gap-2">
            <div className={`flex items-center gap-1.5 ${isLinked ? 'text-green-400' : 'text-gray-500'}`}>
              <div className={`w-2 h-2 rounded-full ${isLinked ? 'bg-green-400 animate-pulse' : 'bg-gray-500'}`}></div>
              <span className="text-xs">
                {isLinked ? 'Linked' : 'Not Linked'}
              </span>
            </div>
          </div>
        </div>
        <div className="p-3 h-[calc(100%-32px)] overflow-auto font-mono text-xs leading-relaxed">
          {hasAnyOutput ? (
            <>
              {stdout?.trim() && (
                <pre className="whitespace-pre-wrap break-words text-green-200">{stdout}</pre>
              )}
              {stderr?.trim() && (
                <pre className="whitespace-pre-wrap break-words text-red-300 mt-3">{stderr}</pre>
              )}
            </>
          ) : (
            <div className="text-gray-400">No output yet. Run your code to see logs.</div>
          )}
        </div>
      </div>
    </div>
  )
}


