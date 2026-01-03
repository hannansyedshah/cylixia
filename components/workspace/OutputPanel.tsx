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
            onClick={() => setShowTerminal(false)}
            className={`px-3 py-1.5 rounded-l-lg border transition-all ${
              !showTerminal
                ? 'bg-zinc-700 border-zinc-600 text-white font-medium'
                : 'bg-zinc-800/50 border-zinc-700 text-zinc-400 hover:text-white hover:bg-zinc-700'
            }`}
          >
            Plot Only
          </button>
          <button
            onClick={() => setShowTerminal(true)}
            className={`px-3 py-1.5 rounded-r-lg border-t border-r border-b transition-all ${
              showTerminal
                ? 'bg-zinc-700 border-zinc-600 text-white font-medium'
                : 'bg-zinc-800/50 border-zinc-700 text-zinc-400 hover:text-white hover:bg-zinc-700'
            }`}
          >
            + Terminal
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 flex min-h-0">
        {showTerminal && (
          <div className="w-1/2 border-r border-zinc-700">
            <TerminalView stdout={stdout} stderr={stderr} projectId={projectId} />
          </div>
        )}
        <div className={showTerminal ? 'w-1/2' : 'w-full'}>
          <PlotViewer
            plotUrl={plotUrl}
            plotUrls={galleryPlots}
          />
        </div>
      </div>
    </div>
  )
}
