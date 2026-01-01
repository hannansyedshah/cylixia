'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Shield, Edit3 } from 'lucide-react'
import type { AiriaMode } from '@/types'

interface WorkspaceHeaderProps {
  projectName: string
  isNist: boolean
  hasContext: boolean
  hasDatasets: boolean
  privacyMode: boolean
  airiaMode: AiriaMode
  showDatasetsPanel: boolean
  datasetsCount: number
  datasetsNeedReupload: number
  onAiriaModeChange: (mode: AiriaMode) => void
  onToggleDatasetsPanel: () => void
  onEditContext: () => void
}

export function WorkspaceHeader({
  projectName,
  isNist,
  hasContext,
  hasDatasets,
  privacyMode,
  airiaMode,
  showDatasetsPanel,
  datasetsCount,
  datasetsNeedReupload,
  onAiriaModeChange,
  onToggleDatasetsPanel,
  onEditContext
}: WorkspaceHeaderProps) {
  return (
    <div className="flex items-center justify-between px-4 py-2 border-b bg-white dark:bg-gray-800">
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
          {(['legacy', 'quick', 'ask'] as const).map((mode) => (
            <button
              key={mode}
              onClick={() => onAiriaModeChange(mode)}
              className={`px-2 py-1 rounded border ${
                airiaMode === mode
                  ? 'bg-white dark:bg-gray-800 border-gray-300 font-medium'
                  : 'bg-transparent border-transparent opacity-70'
              }`}
            >
              {mode === 'ask' ? 'Ask Data' : mode.charAt(0).toUpperCase() + mode.slice(1)}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
