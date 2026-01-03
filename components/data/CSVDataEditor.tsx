'use client'

import { useState, useMemo } from 'react'
import { X, Trash2, Check, AlertCircle, ChevronDown } from 'lucide-react'
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

  // Pagination state - show 20 rows initially
  const [displayedRowCount, setDisplayedRowCount] = useState(20)

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

  // Calculate visible rows
  const visibleRows = originalRows.slice(0, displayedRowCount)
  const hasMoreRows = displayedRowCount < originalRows.length

  const loadMoreRows = () => {
    setDisplayedRowCount(prev => Math.min(prev + 50, originalRows.length))
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onCancel}></div>
      <div className="relative bg-zinc-900 rounded-2xl shadow-2xl border border-zinc-800 w-[96vw] max-w-[1400px] h-[92vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-8 py-6 bg-zinc-800/50 border-b border-zinc-700">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center shadow-lg">
              <Trash2 className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white">
                Edit Dataset
              </h2>
              <p className="text-sm text-zinc-400 mt-1 font-medium">
                {fileName}
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={onCancel}
            className="rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Info Banner with Legend */}
        <div className="px-8 py-4 bg-purple-500/10 border-b border-purple-500/30">
          <div className="flex items-start justify-between gap-6">
            <div className="flex items-start gap-3 flex-1">
              <AlertCircle className="w-5 h-5 text-purple-400 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm text-purple-300 font-semibold">
                  {autoRedactedColumns.length > 0 ? 'Review Auto-Redacted Data & Remove More' : 'Remove Unwanted Data'}
                </p>
                <p className="text-xs text-purple-400/80 mt-1">
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
                <div className="w-4 h-4 rounded bg-purple-500/20 border border-purple-500/50"></div>
                <span className="text-zinc-400">Included</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded bg-red-500/20 border border-red-500/50"></div>
                <span className="text-zinc-400">Removed</span>
              </div>
            </div>
          </div>
        </div>

        {/* Data Table */}
        <div className="flex-1 overflow-x-auto overflow-y-auto px-8 py-6 bg-zinc-900/50">
          <div className="inline-block min-w-full">
            <table className="border-collapse shadow-lg rounded-lg overflow-hidden w-full">
              <thead>
                <tr>
                  <th className="sticky left-0 z-20 bg-zinc-800 border border-zinc-700 px-4 py-3 text-xs font-bold text-zinc-400 uppercase tracking-wider shadow-sm">
                    #
                  </th>
                  {originalHeaders.map((header, i) => {
                    const isRemoved = removedColumnIndices.has(i)
                    const wasAutoRedacted = autoRedactedColumns.includes(header)
                    return (
                      <th
                        key={i}
                        onClick={() => toggleColumn(i)}
                        className={`border px-4 py-3 text-sm font-bold cursor-pointer transition-all duration-150 ${
                          isRemoved
                            ? 'bg-red-500/20 text-red-400 border-red-500/50 line-through'
                            : 'bg-purple-500/20 text-purple-300 border-purple-500/50 hover:bg-purple-500/30'
                        }`}
                      >
                        <div className="flex items-center justify-center gap-2">
                          {isRemoved && <Trash2 className="w-4 h-4 flex-shrink-0" />}
                          <span className="truncate max-w-[200px]">{header}</span>
                          {wasAutoRedacted && isRemoved && (
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-red-500/30 text-red-300 font-semibold">
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
                {visibleRows.map((row, rowIndex) => {
                  const isRowRemoved = removedRowIndices.has(rowIndex)
                  return (
                    <tr key={rowIndex} className={isRowRemoved ? '' : 'hover:bg-zinc-800/50'}>
                      <td
                        onClick={() => toggleRow(rowIndex)}
                        className={`sticky left-0 z-10 border px-4 py-2.5 text-xs font-bold text-center cursor-pointer transition-all duration-150 ${
                          isRowRemoved
                            ? 'bg-red-500/20 text-red-400 border-red-500/50'
                            : 'bg-zinc-800 text-zinc-400 border-zinc-700 hover:bg-zinc-700'
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
                            className={`border px-4 py-2.5 text-sm transition-all duration-150 ${
                              isCellRemoved
                                ? 'bg-red-500/10 text-red-400/50 border-red-500/30 line-through opacity-50'
                                : 'bg-zinc-800/50 text-zinc-300 border-zinc-700'
                            }`}
                          >
                            <div className="truncate max-w-[300px]">
                              {cell || <span className="text-zinc-500 italic text-xs">empty</span>}
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

          {/* Load More Button */}
          {hasMoreRows && (
            <div className="flex justify-center mt-6 mb-2">
              <Button
                onClick={loadMoreRows}
                variant="outline"
                className="border border-purple-500/50 bg-zinc-800 hover:bg-purple-500/20 text-purple-300 font-semibold px-6 py-3"
              >
                <ChevronDown className="w-4 h-4 mr-2" />
                Load More Rows ({displayedRowCount} of {originalRows.length} shown)
              </Button>
            </div>
          )}
        </div>

        {/* Footer with Stats and Actions */}
        <div className="px-8 py-5 bg-zinc-800/50 border-t border-zinc-700">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-6 text-sm">
              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium text-zinc-500 uppercase tracking-wide">Original:</span>
                  <span className="font-bold text-zinc-300 bg-zinc-700 px-2 py-1 rounded">
                    {originalHeaders.length} cols × {originalRows.length} rows
                  </span>
                </div>
                {hasChanges && (
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium text-zinc-500 uppercase tracking-wide">Result:</span>
                    <span className="font-bold text-emerald-400 bg-emerald-500/20 px-2 py-1 rounded">
                      {headers.length} cols × {rows.length} rows
                    </span>
                  </div>
                )}
              </div>
              {hasChanges && (
                <>
                  <div className="w-px h-10 bg-zinc-700"></div>
                  <div className="flex items-center gap-3 px-4 py-2 bg-red-500/10 border border-red-500/30 rounded-lg">
                    <Trash2 className="w-5 h-5 text-red-400" />
                    <div className="flex flex-col">
                      <span className="text-xs text-red-400 font-medium">Removed:</span>
                      <span className="text-red-300 font-bold">
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
                className="px-5 py-2.5 bg-zinc-800 border-zinc-700 text-zinc-300 hover:bg-zinc-700 hover:text-white"
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
