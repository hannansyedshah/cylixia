'use client'

import { Button } from '@/components/ui/button'
import { CodeEditor } from './CodeEditor'
import { VersionHistory } from './VersionHistory'
import { Play, Maximize2, Minimize2, Code2 } from 'lucide-react'
import type { Language } from '@/templates/openai/languages'
import { getLanguageConfig } from '@/templates/openai/languages'

interface CodePanelProps {
  code: string
  projectId: string
  plotUrl: string | null
  loading: boolean
  focusMode: boolean
  readOnly?: boolean
  language: Language
  onFocusModeChange: (focusMode: boolean) => void
  onChange: (code: string) => void
  onRun: () => void
  onVersionRestore: (code: string, plotUrl?: string) => void
  onSaveVersion: (code: string, plotUrl?: string, description?: string) => void
}

export function CodePanel({
  code,
  projectId,
  plotUrl,
  loading,
  focusMode,
  readOnly = false,
  language,
  onFocusModeChange,
  onChange,
  onRun,
  onVersionRestore,
  onSaveVersion
}: CodePanelProps) {

  return (
    <div className={`${focusMode ? 'absolute inset-0 z-10' : 'h-1/3 border-t border-zinc-800'} flex flex-col bg-zinc-900 min-h-0 transition-all duration-200`}>
      {/* Header */}
      <div className="p-3 bg-zinc-800/50 border-b border-zinc-700 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <span className="text-sm font-semibold flex items-center text-white">
            <Code2 className="h-4 w-4 mr-2 text-emerald-500" />
            {getLanguageConfig(language).name} Code Editor
          </span>
          <VersionHistory
            projectId={projectId}
            currentCode={code}
            currentPlotUrl={plotUrl ?? undefined}
            readOnly={readOnly}
            onVersionRestore={onVersionRestore}
            onSaveVersion={onSaveVersion}
          />
        </div>
        <div className="flex items-center gap-2">
          <Button
            onClick={() => onFocusModeChange(!focusMode)}
            size="sm"
            variant="outline"
            className="bg-zinc-800 border-zinc-700 text-zinc-300 hover:bg-zinc-700 hover:text-white"
          >
            {focusMode ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
          </Button>
          <Button
            onClick={onRun}
            size="sm"
            disabled={loading || readOnly}
            className="bg-emerald-500 hover:bg-emerald-400 text-black font-medium disabled:opacity-50"
          >
            <Play className="h-4 w-4 mr-2" />
            {readOnly ? 'View Only' : 'Run'}
          </Button>
        </div>
      </div>

      {/* Editor */}
      <div className="flex-1 min-h-0">
        <CodeEditor value={code} onChange={onChange} readOnly={readOnly} language={language} />
      </div>
    </div>
  )
}
