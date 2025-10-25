'use client'

import { useState } from 'react'
import { Eye, EyeOff, Download, Copy, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { randomizeCSVData } from '@/lib/dataRandomizer'

interface DataPreviewProps {
  originalData: string
  fileName: string
  privacyMode: boolean
}

export function DataPreview({ originalData, fileName, privacyMode }: DataPreviewProps) {
  const [showPreview, setShowPreview] = useState(true) // Show by default
  const [viewMode, setViewMode] = useState<'original' | 'randomized'>('original')
  const [copied, setCopied] = useState(false)

  const randomizedData = randomizeCSVData(originalData)
  const currentData = viewMode === 'original' ? originalData : randomizedData

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(currentData)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy data:', err)
    }
  }

  const handleDownload = () => {
    const blob = new Blob([currentData], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${fileName.replace('.csv', '')}_${viewMode}.csv`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const formatDataForDisplay = (data: string) => {
    const lines = data.split('\n').filter(line => line.trim())
    const maxLines = 8 // Show first 8 rows for compact display
    
    return lines.slice(0, maxLines).map((line, index) => {
      const cells = line.split(',')
      return (
        <div key={index} className="flex space-x-1 text-xs mb-1">
          {cells.map((cell, cellIndex) => (
            <div 
              key={cellIndex} 
              className="flex-1 p-1 bg-gray-100 dark:bg-gray-700 rounded text-gray-800 dark:text-gray-200 border border-gray-200 dark:border-gray-600"
              title={cell.trim()}
            >
              <span className="block truncate">{cell.trim()}</span>
            </div>
          ))}
        </div>
      )
    })
  }

  if (!showPreview) {
    return (
      <Button
        variant="outline"
        size="sm"
        onClick={() => setShowPreview(true)}
        className="w-full mt-2"
      >
        <Eye className="h-4 w-4 mr-2" />
        Preview Data
      </Button>
    )
  }

  return (
    <div className="border rounded-lg bg-white dark:bg-gray-800">
      {/* Compact Header */}
      <div className="p-2 border-b bg-gray-50 dark:bg-gray-700 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Eye className="h-3 w-3 text-gray-600" />
          <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
            {fileName}
          </span>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowPreview(false)}
          className="h-6 w-6 p-0"
        >
          <EyeOff className="h-3 w-3" />
        </Button>
      </div>

      {/* Compact View Mode Toggle */}
      <div className="p-2 border-b bg-blue-50/50 dark:bg-blue-950/20">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className={`w-2 h-2 rounded-full ${
              viewMode === 'original' ? 'bg-blue-500' : 'bg-green-500'
            }`}></div>
            <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
              {viewMode === 'original' ? 'Original' : 'Randomized'}
            </span>
          </div>
          <div className="flex space-x-1">
            <Button
              variant={viewMode === 'original' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('original')}
              className="text-xs h-6 px-2"
            >
              Original
            </Button>
            <Button
              variant={viewMode === 'randomized' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('randomized')}
              className="text-xs h-6 px-2"
            >
              Randomized
            </Button>
          </div>
        </div>
      </div>

      {/* Compact Data Display */}
      <div className="p-2 max-h-32 overflow-y-auto">
        <div>
          {formatDataForDisplay(currentData)}
          {originalData.split('\n').length > 8 && (
            <div className="text-xs text-gray-500 dark:text-gray-400 text-center py-1">
              ... and {originalData.split('\n').length - 8} more rows
            </div>
          )}
        </div>
      </div>

      {/* Compact Action Buttons */}
      <div className="p-2 border-t bg-gray-50 dark:bg-gray-700 flex items-center justify-between">
        <span className="text-xs text-gray-500 dark:text-gray-400">
          {currentData.split('\n').length} rows
        </span>
        <div className="flex space-x-1">
          <Button
            variant="outline"
            size="sm"
            onClick={handleCopy}
            className="text-xs h-6 px-2"
          >
            {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleDownload}
            className="text-xs h-6 px-2"
          >
            <Download className="h-3 w-3" />
          </Button>
        </div>
      </div>
    </div>
  )
}
