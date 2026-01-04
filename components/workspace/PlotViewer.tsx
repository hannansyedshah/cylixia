'use client'

import { ImageIcon, X, ChevronLeft, ChevronRight } from 'lucide-react'
import { usePlotViewer } from './hooks/usePlotViewer'

interface PlotViewerProps {
  plotUrl?: string | null
  plotUrls?: string[]
  projectName?: string
  hasCsvData?: boolean
  onDeletePlot?: (index: number) => void
}

export function PlotViewer({ plotUrl, plotUrls, projectName, hasCsvData = false, onDeletePlot }: PlotViewerProps) {
  const {
    images,
    currentIndex,
    currentUrl,
    hasMultiple,
    isEmpty,
    canDelete,
    goToPrevious,
    goToNext,
    goToIndex,
    handleDownload,
    handleDelete
  } = usePlotViewer({ plotUrl, plotUrls, projectName, onDeletePlot })

  return (
    <div className="h-full flex flex-col bg-zinc-900 relative border border-zinc-800 rounded-lg m-2">
      {/* Animated background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none rounded-lg">
        <div className="absolute top-10 left-10 w-32 h-32 bg-emerald-500/5 rounded-full blur-2xl animate-pulse"></div>
        <div className="absolute bottom-10 right-10 w-40 h-40 bg-emerald-600/5 rounded-full blur-2xl animate-pulse delay-1000"></div>
      </div>

      {!isEmpty ? (
        <div className="relative z-10 flex flex-col h-full min-h-0">
          {/* Navigation header - only show if multiple plots */}
          {hasMultiple && (
            <div className="flex-shrink-0 flex items-center justify-between px-4 py-2 border-b border-zinc-800 bg-zinc-900/80">
              <button
                onClick={goToPrevious}
                className="p-2 rounded-lg bg-zinc-800 border border-zinc-700 text-zinc-300 hover:bg-zinc-700 hover:text-white transition-colors"
                aria-label="Previous plot"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>

              <div className="flex items-center space-x-3">
                <span className="text-sm text-zinc-400">
                  {currentIndex + 1} / {images.length}
                </span>
                <div className="flex space-x-1.5">
                  {images.map((_, index) => (
                    <button
                      key={index}
                      onClick={() => goToIndex(index)}
                      className={`w-2 h-2 rounded-full transition-colors ${
                        index === currentIndex
                          ? 'bg-emerald-500'
                          : 'bg-zinc-600 hover:bg-zinc-500'
                      }`}
                      aria-label={`Go to plot ${index + 1}`}
                    />
                  ))}
                </div>
              </div>

              <button
                onClick={goToNext}
                className="p-2 rounded-lg bg-zinc-800 border border-zinc-700 text-zinc-300 hover:bg-zinc-700 hover:text-white transition-colors"
                aria-label="Next plot"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            </div>
          )}

          {/* Plot display */}
          <div className="flex-1 flex items-center justify-center p-4 min-h-0 overflow-hidden">
            <div className="relative bg-zinc-800 rounded-lg shadow-lg border border-zinc-700 flex items-center justify-center max-h-full max-w-full">
              {/* Action buttons */}
              <div className="absolute top-2 right-2 z-10 flex space-x-1">
                <button
                  onClick={handleDownload}
                  className="text-xs px-2 py-1 rounded border bg-zinc-800 border-zinc-700 text-zinc-300 hover:bg-zinc-700 hover:text-white backdrop-blur-sm shadow"
                  aria-label={`Download plot ${currentIndex + 1}`}
                >
                  Download
                </button>
                {canDelete && (
                  <button
                    onClick={handleDelete}
                    className="text-xs px-2 py-1 rounded border bg-zinc-800 border-red-500/50 text-red-400 hover:bg-red-500/20 hover:text-red-300 backdrop-blur-sm shadow"
                    aria-label={`Delete plot ${currentIndex + 1}`}
                  >
                    <X className="h-3 w-3" />
                  </button>
                )}
              </div>
              <img
                key={currentIndex}
                src={currentUrl}
                alt={`Generated plot ${currentIndex + 1}`}
                className="max-h-full max-w-full object-contain rounded-lg"
              />
            </div>
          </div>
        </div>
      ) : (
        <div className="text-center text-zinc-500 relative z-10 p-4 flex-1 flex flex-col items-center justify-center">
          <div className="mb-4">
            <ImageIcon className="h-20 w-20 mx-auto opacity-20" />
          </div>
          <p className="text-lg font-medium text-zinc-400">Your generated plots will appear here</p>
          <p className="text-sm mt-2 text-zinc-500">Run your R code to see visualizations</p>
        </div>
      )}
    </div>
  )
}
