'use client'

import { useState } from 'react'
import { Eye, EyeOff, Download, Copy, Check, Maximize2, Minimize2, Table } from 'lucide-react'
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
  const [expanded, setExpanded] = useState(false)

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

  const parseCSVData = (data: string) => {
    const lines = data.split('\n').filter(line => line.trim())
    if (lines.length === 0) return { headers: [], rows: [] }
    
    const headers = lines[0].split(',').map(h => h.trim())
    const rows = lines.slice(1).map(line => 
      line.split(',').map(cell => cell.trim())
    )
    
    return { headers, rows }
  }

  const { headers, rows } = parseCSVData(currentData)
  const maxRows = expanded ? rows.length : 5
  const displayRows = rows.slice(0, maxRows)

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
    <div className={`border rounded-lg bg-white dark:bg-gray-800 ${expanded ? 'fixed inset-4 z-50' : ''}`}>
      {/* Header */}
      <div className="p-3 border-b bg-gray-50 dark:bg-gray-700 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Table className="h-4 w-4 text-gray-600" />
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
            {fileName}
          </span>
          <div className={`px-2 py-1 rounded-full text-xs font-medium ${
            viewMode === 'original' 
              ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' 
              : 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
          }`}>
            {viewMode === 'original' ? 'Original Data' : 'Randomized Data'}
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setExpanded(!expanded)}
            className="h-8 w-8 p-0"
          >
            {expanded ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowPreview(false)}
            className="h-8 w-8 p-0"
          >
            <EyeOff className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* View Mode Toggle */}
      <div className="p-3 border-b bg-blue-50/50 dark:bg-blue-950/20">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className={`w-2 h-2 rounded-full ${
              viewMode === 'original' ? 'bg-blue-500' : 'bg-green-500'
            }`}></div>
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              {viewMode === 'original' ? 'Showing Original Data' : 'Showing Randomized Data'}
            </span>
          </div>
          <div className="flex space-x-2">
            <Button
              variant={viewMode === 'original' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('original')}
              className="text-sm h-8 px-3"
            >
              Original
            </Button>
            <Button
              variant={viewMode === 'randomized' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('randomized')}
              className="text-sm h-8 px-3"
            >
              Randomized
            </Button>
          </div>
        </div>
      </div>

      {/* Data Table */}
      <div className={`overflow-auto ${expanded ? 'h-[calc(100vh-200px)]' : 'max-h-64'}`}>
        {headers.length > 0 ? (
          <div className="min-w-full">
            {/* Table Header */}
            <div className="sticky top-0 bg-gray-100 dark:bg-gray-700 border-b">
              <div className="flex">
                {headers.map((header, index) => (
                  <div 
                    key={index} 
                    className="flex-1 p-3 text-sm font-semibold text-gray-700 dark:text-gray-300 border-r border-gray-200 dark:border-gray-600 min-w-[120px]"
                  >
                    {header}
                  </div>
                ))}
              </div>
            </div>
            
            {/* Table Rows */}
            <div>
              {displayRows.map((row, rowIndex) => (
                <div key={rowIndex} className="flex border-b border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700">
                  {row.map((cell, cellIndex) => (
                    <div 
                      key={cellIndex} 
                      className="flex-1 p-3 text-sm text-gray-800 dark:text-gray-200 border-r border-gray-200 dark:border-gray-600 min-w-[120px]"
                      title={cell}
                    >
                      <span className="block truncate">{cell}</span>
                    </div>
                  ))}
                </div>
              ))}
            </div>
            
            {/* Show more indicator */}
            {rows.length > maxRows && (
              <div className="p-3 text-center text-sm text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-800">
                Showing {maxRows} of {rows.length} rows
                {!expanded && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setExpanded(true)}
                    className="ml-2"
                  >
                    Show All
                  </Button>
                )}
              </div>
            )}
          </div>
        ) : (
          <div className="p-8 text-center text-gray-500 dark:text-gray-400">
            <Table className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No data to display</p>
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="p-3 border-t bg-gray-50 dark:bg-gray-700 flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <span className="text-sm text-gray-500 dark:text-gray-400">
            {rows.length} rows × {headers.length} columns
          </span>
          <span className="text-sm text-gray-500 dark:text-gray-400">
            {viewMode === 'original' ? '🔓 Original' : '🔒 Privacy Protected'}
          </span>
        </div>
        <div className="flex space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleCopy}
            className="text-sm h-8 px-3"
          >
            {copied ? <Check className="h-4 w-4 mr-1" /> : <Copy className="h-4 w-4 mr-1" />}
            {copied ? 'Copied!' : 'Copy'}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleDownload}
            className="text-sm h-8 px-3"
          >
            <Download className="h-4 w-4 mr-1" />
            Download
          </Button>
        </div>
      </div>
    </div>
  )
}
