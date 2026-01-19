'use client'

import { useState } from 'react'
import { PlotViewer } from './PlotViewer'
import { TerminalView } from './TerminalView'
import { DataViewer } from './DataViewer'
import { CodeExecutionLoading } from './LoadingStates'
import { BarChart3 } from 'lucide-react'
import type { Language } from '@/templates/openai/languages'
import type { DatasetItem } from '@/types/dataset'
import type { ViewMode } from '@/types/workspace'

interface OutputPanelProps {
  plotUrl: string | null
  galleryPlots: string[]
  stdout: string
  stderr: string
  projectId: string
  projectName: string
  loading?: boolean
  language: Language
  lastRunDatasets: DatasetItem[]
  onDeletePlot?: (index: number) => void
}

export function OutputPanel({ plotUrl, galleryPlots, stdout, stderr, projectId, projectName, loading = false, language, lastRunDatasets, onDeletePlot }: OutputPanelProps) {
  const [viewMode, setViewMode] = useState<ViewMode>('plot')

  return (
    <div className="h-full flex flex-col bg-zinc-900">
      {/* Header */}
      <div className="p-2 bg-zinc-800/50 border-b border-zinc-700 flex items-center justify-between">
        <span className="text-sm font-semibold flex items-center text-white">
          <BarChart3 className="h-4 w-4 mr-2 text-emerald-500" />
          Output
        </span>
        <div className="flex text-xs">
          <button
            onClick={() => setViewMode('plot')}
            className={`px-3 py-1.5 rounded-l-lg border transition-all ${
              viewMode === 'plot'
                ? 'bg-zinc-700 border-zinc-600 text-white font-medium'
                : 'bg-zinc-800/50 border-zinc-700 text-zinc-400 hover:text-white hover:bg-zinc-700'
            }`}
          >
            Plot Only
          </button>
          <button
            onClick={() => setViewMode('plot-terminal')}
            className={`px-3 py-1.5 border-t border-r border-b transition-all ${
              viewMode === 'plot-terminal'
                ? 'bg-zinc-700 border-zinc-600 text-white font-medium'
                : 'bg-zinc-800/50 border-zinc-700 text-zinc-400 hover:text-white hover:bg-zinc-700'
            }`}
          >
            + Terminal
          </button>
          <button
            onClick={() => setViewMode('plot-data')}
            className={`px-3 py-1.5 rounded-r-lg border-t border-r border-b transition-all ${
              viewMode === 'plot-data'
                ? 'bg-zinc-700 border-zinc-600 text-white font-medium'
                : 'bg-zinc-800/50 border-zinc-700 text-zinc-400 hover:text-white hover:bg-zinc-700'
            }`}
          >
            + Data
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 flex min-h-0 relative">
        {/* Code Execution Loading Overlay */}
        {loading && (
          <div className="absolute inset-0 z-20 bg-zinc-900/95 backdrop-blur-sm flex items-center justify-center">
            <CodeExecutionLoading language={language} />
          </div>
        )}

        {viewMode === 'plot-terminal' && (
          <div className="w-1/2 border-r border-zinc-700">
            <TerminalView stdout={stdout} stderr={stderr} projectId={projectId} />
          </div>
        )}

        {viewMode === 'plot-data' && (
          <div className="w-1/2 border-r border-zinc-700">
            <DataViewer datasets={lastRunDatasets} projectId={projectId} />
          </div>
        )}

        <div className={viewMode === 'plot' ? 'w-full' : 'w-1/2'}>
          <PlotViewer
            plotUrl={plotUrl}
            plotUrls={galleryPlots}
            projectName={projectName}
            onDeletePlot={onDeletePlot}
          />
        </div>
      </div>
    </div>
  )
}
