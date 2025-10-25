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
    const maxLines = 15 // Show first 15 rows
    
    return lines.slice(0, maxLines).map((line, index) => {
      const cells = line.split(',')
      return (
        <div key={index} className="flex space-x-1 text-xs">
          {cells.map((cell, cellIndex) => (
            <div 
              key={cellIndex} 
              className="flex-1 p-1 bg-gray-50 dark:bg-gray-800 rounded truncate min-w-0"
              title={cell.trim()}
            >
              {cell.trim()}
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
    <div className="mt-2 border rounded-lg bg-white dark:bg-gray-800">
      {/* Preview Header */}
      <div className="p-3 border-b bg-gray-50 dark:bg-gray-700 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Eye className="h-4 w-4 text-gray-600" />
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Data Preview: {fileName}
          </span>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowPreview(false)}
        >
          <EyeOff className="h-4 w-4" />
        </Button>
      </div>

      {/* View Mode Toggle */}
      <div className="p-3 border-b bg-blue-50/50 dark:bg-blue-950/20">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className={`w-2 h-2 rounded-full ${
              viewMode === 'original' ? 'bg-blue-500' : 'bg-green-500'
            }`}></div>
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              {viewMode === 'original' ? '📊 Original Data' : '🔒 Randomized Data'}
            </span>
          </div>
          <div className="flex space-x-1">
            <Button
              variant={viewMode === 'original' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('original')}
              className="text-xs"
            >
              Original
            </Button>
            <Button
              variant={viewMode === 'randomized' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('randomized')}
              className="text-xs"
            >
              Randomized
            </Button>
          </div>
        </div>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
          {viewMode === 'original' 
            ? 'This is your actual data. AI will see this when privacy mode is OFF.'
            : 'This is what AI sees when privacy mode is ON. Values are randomized but structure is preserved.'
          }
        </p>
      </div>

      {/* Data Display */}
      <div className="p-3 max-h-64 overflow-y-auto">
        <div className="space-y-1">
          {formatDataForDisplay(currentData)}
          {originalData.split('\n').length > 15 && (
            <div className="text-xs text-gray-500 dark:text-gray-400 text-center py-2">
              ... and {originalData.split('\n').length - 15} more rows
            </div>
          )}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="p-3 border-t bg-gray-50 dark:bg-gray-700 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <span className="text-xs text-gray-500 dark:text-gray-400">
            {currentData.length} characters, {currentData.split('\n').length} rows
          </span>
        </div>
        <div className="flex space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleCopy}
            className="text-xs"
          >
            {copied ? <Check className="h-3 w-3 mr-1" /> : <Copy className="h-3 w-3 mr-1" />}
            {copied ? 'Copied!' : 'Copy'}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleDownload}
            className="text-xs"
          >
            <Download className="h-3 w-3 mr-1" />
            Download
          </Button>
        </div>
      </div>
    </div>
  )
}
