'use client'

import { useState, useMemo } from 'react'
import { X, Trash2, Check, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface CSVDataEditorProps {
  originalData: string
  fileName: string
  autoRedactedColumns?: string[] // Columns that were already auto-redacted (for HIPAA)
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
      <div className="relative bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 w-[96vw] max-w-[1400px] h-[92vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-8 py-6 bg-gradient-to-r from-purple-50 to-indigo-50 dark:from-gray-800 dark:to-gray-850 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-indigo-600 dark:from-purple-600 dark:to-indigo-700 flex items-center justify-center shadow-lg">
              <Trash2 className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                Edit Dataset
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 font-medium">
                {fileName} - Click columns or rows to remove them
              </p>
            </div>
          </div>
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={onCancel}
            className="rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Info Banner */}
        <div className="px-8 py-4 bg-blue-50 dark:bg-blue-950/20 border-b border-blue-200 dark:border-blue-800">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-sm text-blue-900 dark:text-blue-100 font-semibold">
                {autoRedactedColumns.length > 0 ? 'Review Auto-Redacted Data & Remove More' : 'Remove Unwanted Data'}
              </p>
              <p className="text-xs text-blue-700 dark:text-blue-300 mt-1">
                {autoRedactedColumns.length > 0 ? (
                  <>
                    <strong>{autoRedactedColumns.length} sensitive column(s)</strong> were automatically redacted (shown in red). 
                    You can review and manually remove additional columns or rows if needed. Click to toggle.
                  </>
                ) : (
                  <>
                    Click on column headers to remove entire columns. Click on row numbers to remove entire rows. 
                    Changes are highlighted in red and can be undone by clicking again.
                  </>
                )}
              </p>
            </div>
          </div>
        </div>

        {/* Data Table */}
        <div className="flex-1 overflow-auto px-8 py-6">
          <div className="inline-block min-w-full">
            <table className="border-collapse">
              <thead>
                <tr>
                  <th className="sticky left-0 z-10 bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-600 px-4 py-2 text-xs font-semibold text-gray-600 dark:text-gray-400">
                    Row
                  </th>
                  {originalHeaders.map((header, i) => {
                    const isRemoved = removedColumnIndices.has(i)
                    const wasAutoRedacted = autoRedactedColumns.includes(header)
                    return (
                      <th
                        key={i}
                        onClick={() => toggleColumn(i)}
                        className={`border px-4 py-2 text-sm font-semibold cursor-pointer transition-all ${
                          isRemoved
                            ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 border-red-300 dark:border-red-700 line-through'
                            : 'bg-purple-50 dark:bg-purple-900/20 text-purple-900 dark:text-purple-100 border-purple-200 dark:border-purple-800 hover:bg-purple-100 dark:hover:bg-purple-900/30'
                        }`}
                      >
                        <div className="flex items-center justify-center gap-2">
                          {isRemoved && <Trash2 className="w-3 h-3" />}
                          {header}
                          {wasAutoRedacted && isRemoved && <span className="text-xs ml-1">(auto)</span>}
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
                    <tr key={rowIndex}>
                      <td
                        onClick={() => toggleRow(rowIndex)}
                        className={`sticky left-0 z-10 border px-4 py-2 text-xs font-semibold text-center cursor-pointer transition-all ${
                          isRowRemoved
                            ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 border-red-300 dark:border-red-700'
                            : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 border-gray-300 dark:border-gray-600 hover:bg-gray-200 dark:hover:bg-gray-700'
                        }`}
                      >
                        {isRowRemoved ? <Trash2 className="w-3 h-3 inline" /> : rowIndex + 1}
                      </td>
                      {row.map((cell, colIndex) => {
                        const isColRemoved = removedColumnIndices.has(colIndex)
                        const isCellRemoved = isRowRemoved || isColRemoved
                        return (
                          <td
                            key={colIndex}
                            className={`border px-4 py-2 text-sm transition-all ${
                              isCellRemoved
                                ? 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 border-red-200 dark:border-red-800 line-through opacity-60'
                                : 'bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 border-gray-200 dark:border-gray-700'
                            }`}
                          >
                            {cell || <span className="text-gray-400 italic">empty</span>}
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
        <div className="px-8 py-4 bg-gray-50 dark:bg-gray-850 border-t border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-6 text-sm">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-gray-700 dark:text-gray-300">Original:</span>
                <span className="text-gray-600 dark:text-gray-400">
                  {originalHeaders.length} columns × {originalRows.length} rows
                </span>
              </div>
              {hasChanges && (
                <>
                  <div className="w-px h-4 bg-gray-300 dark:bg-gray-600"></div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-green-700 dark:text-green-300">After Removal:</span>
                    <span className="text-green-600 dark:text-green-400">
                      {headers.length} columns × {rows.length} rows
                    </span>
                  </div>
                  <div className="w-px h-4 bg-gray-300 dark:bg-gray-600"></div>
                  <div className="flex items-center gap-2">
                    <Trash2 className="w-4 h-4 text-red-600 dark:text-red-400" />
                    <span className="text-red-600 dark:text-red-400 font-semibold">
                      {removedColumnIndices.size} col(s), {removedRowIndices.size} row(s) removed
                    </span>
                  </div>
                </>
              )}
            </div>
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                onClick={onCancel}
                className="border-2"
              >
                Cancel
              </Button>
              <Button
                onClick={handleConfirm}
                className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-semibold px-6"
              >
                <Check className="w-4 h-4 mr-2" />
                {hasChanges ? 'Apply Changes' : 'Continue Without Changes'}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

