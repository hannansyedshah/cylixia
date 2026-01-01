'use client'

import { useState } from 'react'
import { PlotViewer } from './PlotViewer'
import { TerminalView } from './TerminalView'
import { BarChart3 } from 'lucide-react'

interface OutputPanelProps {
  plotUrl: string | null
  galleryPlots: string[]
  stdout: string
  stderr: string
  projectId: string
}

export function OutputPanel({ plotUrl, galleryPlots, stdout, stderr, projectId }: OutputPanelProps) {
  const [showTerminal, setShowTerminal] = useState(false)
  const [viewMode, setViewMode] = useState<'plot' | 'graph'>('plot')

  return (
    <div className="h-full flex flex-col bg-white dark:bg-gray-900">
      {/* Header */}
      <div className="p-2 bg-gray-50 dark:bg-gray-800 border-b flex items-center justify-between">
        <span className="text-sm font-semibold flex items-center">
          <BarChart3 className="h-4 w-4 mr-2 text-blue-600" />
          Output
        </span>
        <div className="flex gap-2">
          <div className="flex text-xs">
            <button
              onClick={() => setViewMode('plot')}
              className={`px-2 py-1 rounded-l border ${viewMode === 'plot' ? 'bg-white font-medium' : 'bg-gray-100'}`}
            >
              Plot
            </button>
            <button
              onClick={() => setViewMode('graph')}
              className={`px-2 py-1 rounded-r border-t border-r border-b ${viewMode === 'graph' ? 'bg-white font-medium' : 'bg-gray-100'}`}
            >
              Graph
            </button>
          </div>
          <div className="flex text-xs">
            <button
              onClick={() => setShowTerminal(false)}
              className={`px-2 py-1 rounded-l border ${!showTerminal ? 'bg-white font-medium' : 'bg-gray-100'}`}
            >
              Plot Only
            </button>
            <button
              onClick={() => setShowTerminal(true)}
              className={`px-2 py-1 rounded-r border-t border-r border-b ${showTerminal ? 'bg-white font-medium' : 'bg-gray-100'}`}
            >
              + Terminal
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 flex min-h-0">
        {showTerminal && (
          <div className="w-1/2 border-r">
            <TerminalView stdout={stdout} stderr={stderr} projectId={projectId} />
          </div>
        )}
        <div className={showTerminal ? 'w-1/2' : 'w-full'}>
          <PlotViewer
            plotUrl={plotUrl}
            plotUrls={viewMode === 'graph' ? galleryPlots : undefined}
          />
        </div>
      </div>
    </div>
  )
}
