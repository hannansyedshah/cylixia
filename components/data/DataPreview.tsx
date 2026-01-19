'use client'

import { useState } from 'react'
import { Eye, EyeOff, Download, Copy, Check, Maximize2, Minimize2, Table } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { randomizeCSVData } from '@/utils/dataRandomizer'

interface DataPreviewProps {
  originalData: string
  fileName: string
  privacyMode: boolean
  controlledViewMode?: 'original' | 'randomized'
  onViewModeChange?: (mode: 'original' | 'randomized') => void
  isModal?: boolean
}

export function DataPreview({ originalData, fileName, privacyMode, controlledViewMode, onViewModeChange, isModal = false }: DataPreviewProps) {
  const [showPreview, setShowPreview] = useState(true)
  const [internalViewMode, setInternalViewMode] = useState<'original' | 'randomized'>(privacyMode ? 'randomized' : 'original')
  const [copied, setCopied] = useState(false)
  const [expanded, setExpanded] = useState(true)

  const viewMode = controlledViewMode !== undefined ? controlledViewMode : internalViewMode
  const setViewMode = (mode: 'original' | 'randomized') => {
    if (onViewModeChange) {
      onViewModeChange(mode)
    } else {
      setInternalViewMode(mode)
    }
  }

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
  const maxRows = isModal ? rows.length : (expanded ? rows.length : 5)
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
    <div className={`border rounded-lg bg-zinc-900 border-zinc-700 ${expanded && !isModal ? 'fixed inset-4 z-50' : ''} ${isModal ? 'border-0' : ''}`}>
      {/* Header - only show if not in modal */}
      {!isModal && (
        <div className="p-3 border-b border-zinc-700 bg-zinc-800/50 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Table className="h-4 w-4 text-zinc-400" />
            <span className="text-sm font-medium text-zinc-300">
              {fileName}
            </span>
            <div className={`px-2 py-1 rounded-full text-xs font-medium ${
              viewMode === 'original'
                ? 'bg-blue-500/20 text-blue-400'
                : 'bg-emerald-500/20 text-emerald-400'
            }`}>
              {viewMode === 'original' ? 'Original Data' : 'Randomized Data'}
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setExpanded(!expanded)}
              className="h-8 w-8 p-0 text-zinc-400 hover:text-white hover:bg-zinc-700"
            >
              {expanded ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowPreview(false)}
              className="h-8 w-8 p-0 text-zinc-400 hover:text-white hover:bg-zinc-700"
            >
              <EyeOff className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* View Mode Toggle - only show if not in modal */}
      {!isModal && (
        <div className="p-3 border-b border-zinc-700 bg-zinc-800/30">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className={`w-2 h-2 rounded-full ${
                viewMode === 'original' ? 'bg-blue-500' : 'bg-emerald-500'
              }`}></div>
              <span className="text-sm font-medium text-zinc-300">
                {viewMode === 'original' ? 'Showing Original Data' : 'Showing Randomized Data'}
              </span>
            </div>
            <div className="flex space-x-2">
              <Button
                variant={viewMode === 'original' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('original')}
                className={`text-sm h-8 px-3 ${viewMode === 'original' ? 'bg-blue-600 hover:bg-blue-700' : 'bg-zinc-800 border-zinc-700 text-zinc-300 hover:bg-zinc-700'}`}
              >
                Original
              </Button>
              <Button
                variant={viewMode === 'randomized' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('randomized')}
                className={`text-sm h-8 px-3 ${viewMode === 'randomized' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-zinc-800 border-zinc-700 text-zinc-300 hover:bg-zinc-700'}`}
              >
                Randomized
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Data Table */}
      <div className={`overflow-auto ${isModal ? 'h-full' : expanded ? 'h-[calc(100vh-200px)]' : 'max-h-64'}`}>
        {headers.length > 0 ? (
          <div className="w-full min-w-max">
            {/* Table Header */}
            <div className="sticky top-0 bg-zinc-800 border-b border-zinc-700 z-10">
              <div className="flex w-full min-w-max">
                {headers.map((header, index) => (
                  <div
                    key={index}
                    className="flex-1 p-3 text-sm font-semibold text-zinc-300 border-r border-zinc-700 min-w-[120px] whitespace-nowrap"
                  >
                    {header}
                  </div>
                ))}
              </div>
            </div>

            {/* Table Rows */}
            <div className="w-full min-w-max">
              {displayRows.map((row, rowIndex) => (
                <div key={rowIndex} className="flex w-full min-w-max border-b border-zinc-800 hover:bg-zinc-800/50">
                  {row.map((cell, cellIndex) => (
                    <div
                      key={cellIndex}
                      className="flex-1 p-3 text-sm text-zinc-400 border-r border-zinc-800 min-w-[120px] overflow-hidden"
                      title={cell}
                    >
                      <span className="block truncate whitespace-nowrap">{cell}</span>
                    </div>
                  ))}
                </div>
              ))}
            </div>

            {/* Show more indicator - only show if not in modal and not all rows are shown */}
            {!isModal && rows.length > maxRows && (
              <div className="p-3 text-center text-sm text-zinc-500 bg-zinc-800/50">
                Showing {maxRows} of {rows.length} rows
                {!expanded && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setExpanded(true)}
                    className="ml-2 text-zinc-400 hover:text-white"
                  >
                    Show All
                  </Button>
                )}
              </div>
            )}
          </div>
        ) : (
          <div className="p-8 text-center text-zinc-500">
            <Table className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No data to display</p>
          </div>
        )}
      </div>

      {/* Action Buttons - only show if not in modal */}
      {!isModal && (
        <div className="p-3 border-t border-zinc-700 bg-zinc-800/50 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <span className="text-sm text-zinc-500">
              {rows.length} rows × {headers.length} columns
            </span>
            <span className="text-sm text-zinc-500">
              {viewMode === 'original' ? '🔓 Original' : '🔒 Privacy Protected'}
            </span>
          </div>
          <div className="flex space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleCopy}
              className="text-sm h-8 px-3 bg-zinc-800 border-zinc-700 text-zinc-300 hover:bg-zinc-700 hover:text-white"
            >
              {copied ? <Check className="h-4 w-4 mr-1" /> : <Copy className="h-4 w-4 mr-1" />}
              {copied ? 'Copied!' : 'Copy'}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleDownload}
              className="text-sm h-8 px-3 bg-zinc-800 border-zinc-700 text-zinc-300 hover:bg-zinc-700 hover:text-white"
            >
              <Download className="h-4 w-4 mr-1" />
              Download
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
