'use client'

import { useState, useRef, useCallback } from 'react'
import { ImageIcon, Download, ChevronLeft, ChevronRight } from 'lucide-react'

interface PlotViewerProps {
  plotUrl?: string | null
  plotUrls?: string[]
  projectName?: string
  hasCsvData?: boolean
}

export function PlotViewer({ plotUrl = null, plotUrls, projectName = 'plot', hasCsvData = false }: PlotViewerProps) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const containerRef = useRef<HTMLDivElement>(null)

  const images: string[] = Array.isArray(plotUrls) && plotUrls.length > 0
    ? plotUrls
    : (plotUrl ? [plotUrl] : [])

  const handleDownloadUrl = (url: string, index?: number) => {
    const link = document.createElement('a')
    link.href = url
    const suffix = typeof index === 'number' ? `-${index + 1}` : ''
    link.download = `plot-${projectName}${suffix}-${new Date().toISOString().split('T')[0]}.png`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const goToPrevious = useCallback(() => {
    setCurrentIndex((prev) => (prev > 0 ? prev - 1 : images.length - 1))
  }, [images.length])

  const goToNext = useCallback(() => {
    setCurrentIndex((prev) => (prev < images.length - 1 ? prev + 1 : 0))
  }, [images.length])

  const handleWheel = useCallback((e: React.WheelEvent) => {
    if (images.length <= 1) return
    e.preventDefault()
    if (e.deltaY > 0) {
      goToNext()
    } else {
      goToPrevious()
    }
  }, [images.length, goToNext, goToPrevious])

  return (
    <div className="min-h-[400px] flex flex-col bg-zinc-900 relative overflow-hidden border border-zinc-800 rounded-lg m-2">
      {/* Animated background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none rounded-lg">
        <div className="absolute top-10 left-10 w-32 h-32 bg-emerald-500/5 rounded-full blur-2xl animate-pulse"></div>
        <div className="absolute bottom-10 right-10 w-40 h-40 bg-emerald-600/5 rounded-full blur-2xl animate-pulse delay-1000"></div>
      </div>

      {images.length > 0 ? (
        <div
          ref={containerRef}
          className="relative z-10 flex flex-col h-full w-full"
          onWheel={handleWheel}
        >
          {/* Image counter and navigation */}
          {images.length > 1 && (
            <div className="absolute top-2 left-2 z-20 flex items-center gap-2">
              <button
                onClick={goToPrevious}
                className="p-1.5 rounded-lg bg-zinc-800 border border-zinc-700 text-zinc-300 hover:bg-zinc-700 hover:text-white"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <span className="text-xs text-zinc-400 bg-zinc-800/80 px-2 py-1 rounded border border-zinc-700">
                {currentIndex + 1} / {images.length}
              </span>
              <button
                onClick={goToNext}
                className="p-1.5 rounded-lg bg-zinc-800 border border-zinc-700 text-zinc-300 hover:bg-zinc-700 hover:text-white"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          )}

          {/* Current image display */}
          <div className="flex-1 flex items-center justify-center p-4">
            <div className="relative bg-zinc-800 rounded-lg shadow-lg border border-zinc-700 flex items-center justify-center overflow-visible max-w-full">
              <button
                onClick={() => handleDownloadUrl(images[currentIndex], currentIndex)}
                className="absolute top-2 right-2 z-10 text-xs px-2 py-1 rounded border bg-zinc-800 border-zinc-700 text-zinc-300 hover:bg-zinc-700 hover:text-white backdrop-blur-sm shadow"
                aria-label={`Download plot ${currentIndex + 1}`}
              >
                <Download className="h-3.5 w-3.5 inline mr-1" />
                Download
              </button>
              <img
                src={images[currentIndex]}
                alt={`Generated plot ${currentIndex + 1}`}
                className="object-contain rounded-lg animate-fade-in-up"
                style={{
                  maxWidth: '100%',
                  maxHeight: 'calc(100vh - 300px)',
                  width: 'auto',
                  height: 'auto',
                  objectFit: 'contain'
                }}
              />
            </div>
          </div>

          {/* Thumbnail strip for multiple images */}
          {images.length > 1 && (
            <div className="flex justify-center gap-2 p-2 border-t border-zinc-800">
              {images.map((url, idx) => (
                <button
                  key={idx}
                  onClick={() => setCurrentIndex(idx)}
                  className={`w-12 h-12 rounded border overflow-hidden transition-all ${
                    idx === currentIndex
                      ? 'border-emerald-500 ring-2 ring-emerald-500/30'
                      : 'border-zinc-700 hover:border-zinc-500 opacity-60 hover:opacity-100'
                  }`}
                >
                  <img
                    src={url}
                    alt={`Thumbnail ${idx + 1}`}
                    className="w-full h-full object-cover"
                  />
                </button>
              ))}
            </div>
          )}
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
