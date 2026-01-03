'use client'

import { ImageIcon, Download, X } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface PlotViewerProps {
  plotUrl?: string | null
  plotUrls?: string[]
  projectName?: string
  hasCsvData?: boolean
  onDeletePlot?: (index: number) => void
}

export function PlotViewer({ plotUrl = null, plotUrls, projectName = 'plot', hasCsvData = false, onDeletePlot }: PlotViewerProps) {
  const images: string[] = Array.isArray(plotUrls) && plotUrls.length > 0
    ? plotUrls
    : (plotUrl ? [plotUrl] : [])

  const handleDownload = () => {
    if (!images.length) return

    const link = document.createElement('a')
    link.href = images[0]
    link.download = `plot-${projectName}-${new Date().toISOString().split('T')[0]}.png`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const handleDownloadUrl = (url: string, index?: number) => {
    const link = document.createElement('a')
    link.href = url
    const suffix = typeof index === 'number' ? `-${index + 1}` : ''
    link.download = `plot-${projectName}${suffix}-${new Date().toISOString().split('T')[0]}.png`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <div className="min-h-[400px] flex flex-col bg-zinc-900 relative overflow-hidden border border-zinc-800 rounded-lg m-2">
      {/* Animated background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none rounded-lg">
        <div className="absolute top-10 left-10 w-32 h-32 bg-emerald-500/5 rounded-full blur-2xl animate-pulse"></div>
        <div className="absolute bottom-10 right-10 w-40 h-40 bg-emerald-600/5 rounded-full blur-2xl animate-pulse delay-1000"></div>
      </div>

      {images.length > 0 ? (
        <div className="relative z-10 flex flex-col h-full w-full">
          {/* Download button overlay */}
          <div className="absolute top-2 right-2 z-20">
            <Button
              size="sm"
              variant="outline"
              onClick={handleDownload}
              className="bg-zinc-800 border-zinc-700 text-zinc-300 hover:bg-zinc-700 hover:text-white backdrop-blur-sm shadow-lg"
            >
              <Download className="h-4 w-4 mr-1" />
              Download
            </Button>
          </div>

          {/* Dedicated Plot Container Box - Scrollable and flexible */}
          <div className="flex-1 flex items-start justify-center p-4 overflow-auto gap-4 flex-wrap">
            {images.map((url, idx) => (
              <div key={idx} className="relative bg-zinc-800 rounded-lg shadow-lg border border-zinc-700 flex items-center justify-center overflow-visible max-w-full">
                <div className="absolute top-2 right-2 z-10 flex space-x-1">
                  <button
                    onClick={() => handleDownloadUrl(url, idx)}
                    className="text-xs px-2 py-1 rounded border bg-zinc-800 border-zinc-700 text-zinc-300 hover:bg-zinc-700 hover:text-white backdrop-blur-sm shadow"
                    aria-label={`Download plot ${idx + 1}`}
                  >
                    Download
                  </button>
                  {onDeletePlot && (
                    <button
                      onClick={() => {
                        if (confirm('Delete this plot? This action cannot be undone.')) {
                          onDeletePlot(idx)
                        }
                      }}
                      className="text-xs px-2 py-1 rounded border bg-zinc-800 border-red-500/50 text-red-400 hover:bg-red-500/20 hover:text-red-300 backdrop-blur-sm shadow"
                      aria-label={`Delete plot ${idx + 1}`}
                    >
                      <X className="h-3 w-3" />
                    </button>
                  )}
                </div>
                <img
                  src={url}
                  alt={`Generated plot ${idx + 1}`}
                  className="object-contain rounded-lg animate-fade-in-up"
                  style={{
                    maxWidth: '100%',
                    width: 'auto',
                    height: 'auto',
                    objectFit: 'contain'
                  }}
                />
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="text-center text-zinc-500 animate-fade-in-up relative z-10 p-4 flex-1 flex flex-col items-center justify-center">
          <div className="animate-float mb-4">
            <ImageIcon className="h-20 w-20 mx-auto opacity-20" />
          </div>
          <p className="text-lg font-medium text-zinc-400">Your generated plots will appear here</p>
          <p className="text-sm mt-2 text-zinc-500">Run your R code to see visualizations</p>
        </div>
      )}
    </div>
  )
}
