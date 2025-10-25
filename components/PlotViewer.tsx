'use client'

import { ImageIcon, Download } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface PlotViewerProps {
  plotUrl: string | null
  projectName?: string
}

export function PlotViewer({ plotUrl, projectName = 'plot' }: PlotViewerProps) {
  const handleDownload = () => {
    if (!plotUrl) return
    
    const link = document.createElement('a')
    link.href = plotUrl
    link.download = `plot-${projectName}-${new Date().toISOString().split('T')[0]}.png`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <div className="h-full flex items-center justify-center bg-gradient-to-br from-gray-50 via-blue-50/30 to-purple-50/30 dark:from-gray-900 dark:via-blue-950/30 dark:to-purple-950/30 relative overflow-hidden border-2 border-gray-200 dark:border-gray-700 rounded-lg m-1">
      {/* Animated background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none rounded-lg">
        <div className="absolute top-10 left-10 w-32 h-32 bg-rstudio/5 rounded-full blur-2xl animate-pulse"></div>
        <div className="absolute bottom-10 right-10 w-40 h-40 bg-purple-400/5 rounded-full blur-2xl animate-pulse delay-1000"></div>
      </div>

      {plotUrl ? (
        <div className="relative z-10 flex flex-col items-center justify-center h-full w-full p-2">
          {/* Download button overlay */}
          <div className="absolute top-2 right-2 z-20">
            <Button
              size="sm"
              variant="outline"
              onClick={handleDownload}
              className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm shadow-lg hover:bg-white dark:hover:bg-gray-800"
            >
              <Download className="h-4 w-4 mr-1" />
              Download
            </Button>
          </div>
          
          {/* Plot image with proper containment and no cutoff */}
          <div className="w-full h-full flex items-center justify-center overflow-hidden">
            <img
              src={plotUrl}
              alt="Generated plot"
              className="max-w-full max-h-full object-contain rounded-lg shadow-2xl animate-fade-in-up"
              style={{ 
                maxWidth: 'calc(100% - 1rem)', 
                maxHeight: 'calc(100% - 1rem)',
                objectFit: 'contain'
              }}
            />
          </div>
        </div>
      ) : (
        <div className="text-center text-muted-foreground animate-fade-in-up relative z-10 p-4">
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

