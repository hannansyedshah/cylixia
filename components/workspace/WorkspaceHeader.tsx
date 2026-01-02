'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Shield, Edit3 } from 'lucide-react'
import type { OpenAIMode } from '@/types/openai'

interface WorkspaceHeaderProps {
  projectName: string
  isNist: boolean
  hasContext: boolean
  hasDatasets: boolean
  privacyMode: boolean
  mode: OpenAIMode
  showDatasetsPanel: boolean
  datasetsCount: number
  datasetsNeedReupload: number
  onModeChange: (mode: OpenAIMode) => void
  onToggleDatasetsPanel: () => void
  onEditContext: () => void
}

export function WorkspaceHeader({
  projectName,
  isNist,
  hasContext,
  hasDatasets,
  privacyMode,
  mode,
  showDatasetsPanel,
  datasetsCount,
  datasetsNeedReupload,
  onModeChange,
  onToggleDatasetsPanel,
  onEditContext
}: WorkspaceHeaderProps) {
  return (
    <div className="flex items-center justify-between px-4 py-2 border-b bg-white">
      <div className="flex items-center gap-4">
        <Link href="/dashboard">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
        </Link>
        <h1 className="text-lg font-semibold truncate max-w-[300px]">{projectName}</h1>
        {isNist && (
          <span className="px-2 py-0.5 text-xs font-medium bg-emerald-100 text-emerald-700 rounded-full flex items-center gap-1">
            <Shield className="h-3 w-3" /> NIST
          </span>
        )}
        {hasContext && (
          <span className="px-2 py-0.5 text-xs bg-blue-100 text-blue-700 rounded-full">Context Set</span>
        )}
        {hasDatasets && (
          <span className={`px-2 py-0.5 text-xs rounded-full ${privacyMode ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
            {privacyMode ? 'Privacy ON' : 'Privacy OFF'}
          </span>
        )}
      </div>

      <div className="flex items-center gap-2">
        {isNist && (
          <Button size="sm" variant="outline" onClick={onEditContext} className="h-8">
            <Edit3 className="w-3.5 h-3.5 mr-1" />
            {hasContext ? 'Edit Context' : 'Set Context'}
          </Button>
        )}

        <Button
          size="sm"
          variant="outline"
          onClick={onToggleDatasetsPanel}
          className={`h-8 ${datasetsNeedReupload > 0 ? 'border-yellow-400 bg-yellow-50' : ''}`}
        >
          Datasets ({datasetsCount})
          {datasetsNeedReupload > 0 && (
            <span className="ml-2 px-1.5 py-0.5 rounded-full text-xs font-semibold bg-yellow-500 text-yellow-900">
              {datasetsNeedReupload}
            </span>
          )}
        </Button>

        <div className="flex gap-1 text-xs">
          {(['generate', 'ask'] as const).map((m) => (
            <button
              key={m}
              onClick={() => onModeChange(m)}
              className={`px-2 py-1 rounded border ${
                m === mode
                  ? 'bg-white border-gray-300 font-medium'
                  : 'bg-transparent border-transparent opacity-70'
              }`}
            >
              {m === 'generate' ? 'Generate' : 'Ask Data'}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
