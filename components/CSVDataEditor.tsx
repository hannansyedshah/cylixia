'use client'

import { useState, useMemo } from 'react'
import { X, Trash2, Check, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface CSVDataEditorProps {
  originalData: string
  fileName: string
  autoRedactedColumns?: string[] // Columns that were already auto-redacted (for NIST compliance)
  onConfirm: (editedData: string, removedColumns: string[]) => void
  onCancel: () => void
}

// Proper CSV line parser (handles quoted fields with commas)
function parseCSVLine(line: string): string[] {
  const result: string[] = []
  let current = ''
  let inQuotes = false
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i]
    const nextChar = line[i + 1]
    
    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        current += '"'
        i++
      } else {
        inQuotes = !inQuotes
      }
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim())
      current = ''
    } else {
      current += char
    }
  }
  result.push(current.trim())
  return result
}

// Rebuild CSV from parsed data
function buildCSV(headers: string[], rows: string[][]): string {
  const escapedHeaders = headers.map(h => `"${h.replace(/"/g, '""')}"`)
  const csvLines = [escapedHeaders.join(',')]
  
  rows.forEach(row => {
    const escapedRow = row.map(cell => `"${cell.replace(/"/g, '""')}"`)
    csvLines.push(escapedRow.join(','))
  })
  
  return csvLines.join('\n')
}

export function CSVDataEditor({ 
  originalData, 
  fileName, 
  autoRedactedColumns = [],
  onConfirm, 
  onCancel 
}: CSVDataEditorProps) {
  // Parse CSV data
  const { originalHeaders, originalRows } = useMemo(() => {
    const lines = originalData.split('\n').filter(line => line.trim())
    if (lines.length === 0) return { originalHeaders: [], originalRows: [] }
    
    const headers = parseCSVLine(lines[0]).map(h => h.replace(/^"|"$/g, '').trim())
    const rows = lines.slice(1).map(line => 
      parseCSVLine(line).map(cell => cell.replace(/^"|"$/g, '').trim())
    )
    
    return { originalHeaders: headers, originalRows: rows }
  }, [originalData])

  // Track which columns and rows are removed
  // Pre-populate with auto-redacted columns
  const [removedColumnIndices, setRemovedColumnIndices] = useState<Set<number>>(() => {
    const indices = new Set<number>()
    autoRedactedColumns.forEach(colName => {
      const index = originalHeaders.findIndex(h => h === colName)
      if (index !== -1) indices.add(index)
    })
    return indices
  })
  const [removedRowIndices, setRemovedRowIndices] = useState<Set<number>>(new Set())

  // Filter data based on removals
  const { headers, rows } = useMemo(() => {
    // Filter columns
    const filteredHeaders = originalHeaders.filter((_, i) => !removedColumnIndices.has(i))
    const filteredRows = originalRows
      .filter((_, i) => !removedRowIndices.has(i))
      .map(row => row.filter((_, i) => !removedColumnIndices.has(i)))
    
    return { headers: filteredHeaders, rows: filteredRows }
  }, [originalHeaders, originalRows, removedColumnIndices, removedRowIndices])

  const toggleColumn = (index: number) => {
    setRemovedColumnIndices(prev => {
      const next = new Set(prev)
      if (next.has(index)) {
        next.delete(index)
      } else {
        next.add(index)
      }
      return next
    })
  }

  const toggleRow = (index: number) => {
    setRemovedRowIndices(prev => {
      const next = new Set(prev)
      if (next.has(index)) {
        next.delete(index)
      } else {
        next.add(index)
      }
      return next
    })
  }

  const handleConfirm = () => {
    const editedCSV = buildCSV(headers, rows)
    const removedColumns = originalHeaders.filter((_, i) => removedColumnIndices.has(i))
    onConfirm(editedCSV, removedColumns)
  }

  const hasChanges = removedColumnIndices.size > 0 || removedRowIndices.size > 0

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onCancel}></div>
      <div className="relative bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border-2 border-gray-200 dark:border-gray-700 w-[96vw] max-w-[1400px] h-[92vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-8 py-6 bg-gradient-to-r from-purple-50 to-indigo-50 dark:from-purple-900/20 dark:to-indigo-900/20 border-b-2 border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-indigo-600 dark:from-purple-600 dark:to-indigo-700 flex items-center justify-center shadow-lg">
              <Trash2 className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                Edit Dataset
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 font-medium">
                {fileName}
              </p>
            </div>
          </div>
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={onCancel}
            className="rounded-lg hover:bg-white/50 dark:hover:bg-gray-700"
          >
            <X className="h-5 w-5 text-gray-700 dark:text-gray-300" />
          </Button>
        </div>

        {/* Info Banner with Legend */}
        <div className="px-8 py-4 bg-blue-50 dark:bg-blue-950/30 border-b border-blue-200 dark:border-blue-800">
          <div className="flex items-start justify-between gap-6">
            <div className="flex items-start gap-3 flex-1">
              <AlertCircle className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm text-blue-900 dark:text-blue-200 font-semibold">
                  {autoRedactedColumns.length > 0 ? 'Review Auto-Redacted Data & Remove More' : 'Remove Unwanted Data'}
                </p>
                <p className="text-xs text-blue-800 dark:text-blue-300 mt-1">
                  {autoRedactedColumns.length > 0 ? (
                    <>
                      <strong>{autoRedactedColumns.length} sensitive column(s)</strong> were automatically redacted. 
                      Click headers or row numbers to toggle removal. Red = removed, Purple = included.
                    </>
                  ) : (
                    <>
                      Click on column headers to remove entire columns. Click on row numbers to remove entire rows. 
                      Click again to undo.
                    </>
                  )}
                </p>
              </div>
            </div>
            
            {/* Legend */}
            <div className="flex items-center gap-4 text-xs flex-shrink-0">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded bg-purple-100 dark:bg-purple-900/30 border-2 border-purple-300 dark:border-purple-700"></div>
                <span className="text-gray-700 dark:text-gray-300">Included</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded bg-red-100 dark:bg-red-900/30 border-2 border-red-300 dark:border-red-700"></div>
                <span className="text-gray-700 dark:text-gray-300">Removed</span>
              </div>
            </div>
          </div>
        </div>

        {/* Data Table */}
        <div className="flex-1 overflow-auto px-8 py-6 bg-gray-50 dark:bg-gray-900/50">
          <div className="inline-block min-w-full">
            <table className="border-collapse shadow-lg rounded-lg overflow-hidden">
              <thead>
                <tr>
                  <th className="sticky left-0 z-20 bg-gradient-to-b from-gray-200 to-gray-100 dark:from-gray-700 dark:to-gray-800 border-2 border-gray-300 dark:border-gray-600 px-4 py-3 text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider shadow-sm">
                    #
                  </th>
                  {originalHeaders.map((header, i) => {
                    const isRemoved = removedColumnIndices.has(i)
                    const wasAutoRedacted = autoRedactedColumns.includes(header)
                    return (
                      <th
                        key={i}
                        onClick={() => toggleColumn(i)}
                        className={`border-2 px-4 py-3 text-sm font-bold cursor-pointer transition-all duration-150 ${
                          isRemoved
                            ? 'bg-gradient-to-b from-red-100 to-red-50 dark:from-red-900/40 dark:to-red-900/20 text-red-800 dark:text-red-300 border-red-400 dark:border-red-700 line-through shadow-inner'
                            : 'bg-gradient-to-b from-purple-100 to-purple-50 dark:from-purple-900/40 dark:to-purple-900/20 text-purple-900 dark:text-purple-200 border-purple-300 dark:border-purple-700 hover:from-purple-200 hover:to-purple-100 dark:hover:from-purple-800/50 dark:hover:to-purple-900/30 shadow-sm hover:shadow-md'
                        }`}
                      >
                        <div className="flex items-center justify-center gap-2">
                          {isRemoved && <Trash2 className="w-4 h-4 flex-shrink-0" />}
                          <span className="truncate max-w-[200px]">{header}</span>
                          {wasAutoRedacted && isRemoved && (
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-red-200 dark:bg-red-800 text-red-900 dark:text-red-200 font-semibold">
                              AUTO
                            </span>
                          )}
                        </div>
                      </th>
                    )
                  })}
                </tr>
              </thead>
              <tbody>
                {originalRows.map((row, rowIndex) => {
                  const isRowRemoved = removedRowIndices.has(rowIndex)
                  return (
                    <tr key={rowIndex} className={isRowRemoved ? '' : 'hover:bg-purple-50/50 dark:hover:bg-purple-900/10'}>
                      <td
                        onClick={() => toggleRow(rowIndex)}
                        className={`sticky left-0 z-10 border-2 px-4 py-2.5 text-xs font-bold text-center cursor-pointer transition-all duration-150 ${
                          isRowRemoved
                            ? 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300 border-red-400 dark:border-red-700 shadow-inner'
                            : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600 hover:bg-gray-200 dark:hover:bg-gray-700 shadow-sm'
                        }`}
                      >
                        {isRowRemoved ? <Trash2 className="w-3.5 h-3.5 inline" /> : rowIndex + 1}
                      </td>
                      {row.map((cell, colIndex) => {
                        const isColRemoved = removedColumnIndices.has(colIndex)
                        const isCellRemoved = isRowRemoved || isColRemoved
                        return (
                          <td
                            key={colIndex}
                            className={`border-2 px-4 py-2.5 text-sm transition-all duration-150 ${
                              isCellRemoved
                                ? 'bg-red-50/80 dark:bg-red-950/20 text-red-700 dark:text-red-400 border-red-200 dark:border-red-800/50 line-through opacity-50'
                                : 'bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 border-gray-200 dark:border-gray-700'
                            }`}
                          >
                            <div className="truncate max-w-[300px]">
                              {cell || <span className="text-gray-400 dark:text-gray-600 italic text-xs">empty</span>}
                            </div>
                          </td>
                        )
                      })}
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Footer with Stats and Actions */}
        <div className="px-8 py-5 bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-850 border-t-2 border-gray-200 dark:border-gray-700 shadow-inner">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-6 text-sm">
              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">Original:</span>
                  <span className="font-bold text-gray-800 dark:text-gray-200 bg-gray-200 dark:bg-gray-700 px-2 py-1 rounded">
                    {originalHeaders.length} cols × {originalRows.length} rows
                  </span>
                </div>
                {hasChanges && (
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">Result:</span>
                    <span className="font-bold text-green-700 dark:text-green-300 bg-green-100 dark:bg-green-900/30 px-2 py-1 rounded">
                      {headers.length} cols × {rows.length} rows
                    </span>
                  </div>
                )}
              </div>
              {hasChanges && (
                <>
                  <div className="w-px h-10 bg-gray-300 dark:bg-gray-600"></div>
                  <div className="flex items-center gap-3 px-4 py-2 bg-red-50 dark:bg-red-950/30 border-2 border-red-200 dark:border-red-800 rounded-lg">
                    <Trash2 className="w-5 h-5 text-red-600 dark:text-red-400" />
                    <div className="flex flex-col">
                      <span className="text-xs text-red-600 dark:text-red-400 font-medium">Removed:</span>
                      <span className="text-red-700 dark:text-red-300 font-bold">
                        {removedColumnIndices.size} column{removedColumnIndices.size !== 1 ? 's' : ''}, {removedRowIndices.size} row{removedRowIndices.size !== 1 ? 's' : ''}
                      </span>
                    </div>
                  </div>
                </>
              )}
            </div>
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                onClick={onCancel}
                className="border-2 px-5 py-2.5 hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                Cancel
              </Button>
              <Button
                onClick={handleConfirm}
                className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-semibold px-6 py-2.5 shadow-lg hover:shadow-xl transition-all duration-200"
              >
                <Check className="w-4 h-4 mr-2" />
                {hasChanges ? 'Apply Changes & Upload' : 'Continue Without Changes'}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

