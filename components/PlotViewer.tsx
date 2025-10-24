'use client'

import { ImageIcon } from 'lucide-react'

interface PlotViewerProps {
  plotUrl: string | null
}

export function PlotViewer({ plotUrl }: PlotViewerProps) {
  return (
    <div className="h-full flex items-center justify-center bg-gradient-to-br from-gray-50 via-blue-50/30 to-purple-50/30 dark:from-gray-900 dark:via-blue-950/30 dark:to-purple-950/30 relative overflow-hidden">
      {/* Animated background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-10 left-10 w-32 h-32 bg-rstudio/5 rounded-full blur-2xl animate-pulse"></div>
        <div className="absolute bottom-10 right-10 w-40 h-40 bg-purple-400/5 rounded-full blur-2xl animate-pulse delay-1000"></div>
      </div>

      {plotUrl ? (
        <img
          src={plotUrl}
          alt="Generated plot"
          className="max-w-full max-h-full object-contain rounded-lg shadow-2xl animate-fade-in-up relative z-10"
        />
      ) : (
        <div className="text-center text-muted-foreground animate-fade-in-up relative z-10">
          <div className="animate-float mb-4">
            <ImageIcon className="h-20 w-20 mx-auto opacity-20" />
          </div>
          <p className="text-lg font-medium">Your generated plots will appear here</p>
          <p className="text-sm mt-2 opacity-70">Run your R code to see visualizations</p>
        </div>
      )}
    </div>
  )
}

