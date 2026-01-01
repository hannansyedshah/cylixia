'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { CodeEditor } from '@/components/CodeEditor'
import { VersionHistory } from '@/components/VersionHistory'
import { Play, Maximize2, Minimize2, Code2 } from 'lucide-react'

interface CodePanelProps {
  code: string
  projectId: string
  plotUrl: string | null
  loading: boolean
  onChange: (code: string) => void
  onRun: () => void
  onVersionRestore: (code: string, plotUrl?: string) => void
  onSaveVersion: (description: string) => void
}

export function CodePanel({
  code,
  projectId,
  plotUrl,
  loading,
  onChange,
  onRun,
  onVersionRestore,
  onSaveVersion
}: CodePanelProps) {
  const [focusMode, setFocusMode] = useState(false)

  return (
    <div className={`${focusMode ? 'flex-1' : 'h-1/3'} border-t flex flex-col bg-white dark:bg-gray-800 min-h-0`}>
      {/* Header */}
      <div className="p-3 bg-gray-50 dark:bg-gray-900 border-b flex items-center justify-between">
        <div className="flex items-center gap-4">
          <span className="text-sm font-semibold flex items-center">
            <Code2 className="h-4 w-4 mr-2 text-blue-600" />
            R Code Editor
          </span>
          <VersionHistory
            projectId={projectId}
            currentCode={code}
            currentPlotUrl={plotUrl ?? undefined}
            onVersionRestore={onVersionRestore}
            onSaveVersion={onSaveVersion}
          />
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={() => setFocusMode(!focusMode)} size="sm" variant="outline">
            {focusMode ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
          </Button>
          <Button onClick={onRun} size="sm" disabled={loading}>
            <Play className="h-4 w-4 mr-2" />
            Run
          </Button>
        </div>
      </div>

      {/* Editor */}
      <div className="flex-1 min-h-0">
        <CodeEditor value={code} onChange={onChange} />
      </div>
    </div>
  )
}
