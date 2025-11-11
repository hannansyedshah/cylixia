'use client'

import { useState, useMemo } from 'react'
import { X, Shield, Check, AlertTriangle, Eye, EyeOff } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { redactPHI, getCSVColumns, isColumnPHI } from '@/lib/phiRedactor'

interface ComplianceReviewModalProps {
  originalData: string
  fileName: string
  onConfirm: (redactedData: string) => void
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

// Escape CSV field
function escapeCSVField(field: string): string {
  if (field.includes(',') || field.includes('"') || field.includes('\n')) {
    return `"${field.replace(/"/g, '""')}"`
  }
  return field
}

export function ComplianceReviewModal({ 
  originalData, 
  fileName, 
  onConfirm, 
  onCancel 
}: ComplianceReviewModalProps) {
  // Parse original CSV
  const parsedData = useMemo(() => {
    const lines = originalData.split('\n').filter(line => line.trim())
    if (lines.length === 0) return { headers: [], rows: [] }
    
    const headers = parseCSVLine(lines[0]).map(h => h.replace(/^"|"$/g, ''))
    const rows = lines.slice(1).map(line => 
      parseCSVLine(line).map(cell => cell.replace(/^"|"$/g, ''))
    )
    
    return { headers, rows }
  }, [originalData])
  
  // Auto-detect PHI columns
  const autoDetectedColumns = useMemo(() => {
    return parsedData.headers.filter(col => isColumnPHI(col))
  }, [parsedData.headers])
  
  // Track redacted state: Set of "row,column" keys
  const [redactedCells, setRedactedCells] = useState<Set<string>>(() => {
    // Initialize with auto-detected columns (all rows for those columns)
    const initial = new Set<string>()
    parsedData.rows.forEach((_, rowIndex) => {
      autoDetectedColumns.forEach(col => {
        const colIndex = parsedData.headers.indexOf(col)
        if (colIndex >= 0) {
          initial.add(`${rowIndex},${colIndex}`)
        }
      })
    })
    return initial
  })
  
  // Track redacted columns (for header highlighting)
  const redactedColumns = useMemo(() => {
    const cols = new Set<number>()
    redactedCells.forEach(key => {
      const [, colIndex] = key.split(',').map(Number)
      cols.add(colIndex)
    })
    return cols
  }, [redactedCells])
  
  // Track redacted rows (for row number highlighting)
  const redactedRows = useMemo(() => {
    const rows = new Set<number>()
    redactedCells.forEach(key => {
      const [rowIndex] = key.split(',').map(Number)
      rows.add(rowIndex)
    })
    return rows
  }, [redactedCells])
  
  // Toggle single cell
  const toggleCell = (rowIndex: number, colIndex: number) => {
    const key = `${rowIndex},${colIndex}`
    setRedactedCells(prev => {
      const next = new Set(prev)
      if (next.has(key)) {
        next.delete(key)
      } else {
        next.add(key)
      }
      return next
    })
  }
  
  // Toggle entire column
  const toggleColumn = (colIndex: number) => {
    const allCellsInColumn = parsedData.rows.map((_, rowIndex) => `${rowIndex},${colIndex}`)
    const allRedacted = allCellsInColumn.every(key => redactedCells.has(key))
    
    setRedactedCells(prev => {
      const next = new Set(prev)
      if (allRedacted) {
        // Remove all cells in column
        allCellsInColumn.forEach(key => next.delete(key))
      } else {
        // Add all cells in column
        allCellsInColumn.forEach(key => next.add(key))
      }
      return next
    })
  }
  
  // Toggle entire row
  const toggleRow = (rowIndex: number) => {
    const allCellsInRow = parsedData.headers.map((_, colIndex) => `${rowIndex},${colIndex}`)
    const allRedacted = allCellsInRow.every(key => redactedCells.has(key))
    
    setRedactedCells(prev => {
      const next = new Set(prev)
      if (allRedacted) {
        // Remove all cells in row
        allCellsInRow.forEach(key => next.delete(key))
      } else {
        // Add all cells in row
        allCellsInRow.forEach(key => next.add(key))
      }
      return next
    })
  }
  
  // Check if cell is redacted
  const isCellRedacted = (rowIndex: number, colIndex: number) => {
    return redactedCells.has(`${rowIndex},${colIndex}`)
  }
  
  // Generate final redacted CSV
  const generateRedactedCSV = () => {
    const redactedRows = parsedData.rows.map((row, rowIndex) =>
      row.map((cell, colIndex) => 
        isCellRedacted(rowIndex, colIndex) ? 'XXXX' : cell
      )
    )
    
    const headerLine = parsedData.headers.map(escapeCSVField).join(',')
    const dataLines = redactedRows.map(row => row.map(escapeCSVField).join(','))
    return [headerLine, ...dataLines].join('\n')
  }
  
  const handleConfirm = () => {
    const finalRedactedData = generateRedactedCSV()
    onConfirm(finalRedactedData)
  }
  
  const totalRedactedCells = redactedCells.size
  const totalCells = parsedData.headers.length * parsedData.rows.length
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onCancel}></div>
      <div className="relative bg-white dark:bg-gray-900 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 w-[95vw] max-w-7xl h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
              <Shield className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                HIPAA/NIST Compliance Review
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">{fileName}</p>
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={onCancel}>
            <X className="h-5 w-5" />
          </Button>
        </div>
        
        {/* Warning Banner */}
        <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 border-b border-yellow-200 dark:border-yellow-800">
          <div className="flex items-start gap-2">
            <AlertTriangle className="w-5 h-5 text-yellow-600 dark:text-yellow-400 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <p className="text-sm font-medium text-yellow-800 dark:text-yellow-300">
                Interactive Redaction Editor
              </p>
              <p className="text-xs text-yellow-700 dark:text-yellow-400 mt-1">
                Click any cell to redact/unredact it. Click column headers to redact entire columns. Click row numbers to redact entire rows. 
                Only the redacted version will be stored - original data is never saved.
              </p>
            </div>
          </div>
        </div>
        
        {/* Data Table */}
        <div className="flex-1 overflow-auto p-6">
          {parsedData.headers.length > 0 ? (
            <div className="border rounded-lg bg-white dark:bg-gray-800 overflow-auto">
              <div className="w-full min-w-max">
                {/* Header Row */}
                <div className="sticky top-0 bg-gray-100 dark:bg-gray-700 border-b z-20">
                  <div className="flex">
                    {/* Row number header */}
                    <div className="w-12 p-2 text-xs font-semibold text-gray-500 dark:text-gray-400 border-r border-gray-300 dark:border-gray-600 bg-gray-200 dark:bg-gray-800">
                      #
                    </div>
                    {/* Column headers */}
                    {parsedData.headers.map((header, colIndex) => {
                      const isRedacted = redactedColumns.has(colIndex)
                      const isAutoDetected = autoDetectedColumns.includes(header)
                      return (
                        <div
                          key={colIndex}
                          onClick={() => toggleColumn(colIndex)}
                          className={`flex-1 p-2 text-xs font-semibold border-r border-gray-300 dark:border-gray-600 min-w-[120px] cursor-pointer transition-colors hover:bg-gray-200 dark:hover:bg-gray-600 ${
                            isRedacted 
                              ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400' 
                              : 'text-gray-700 dark:text-gray-300'
                          }`}
                          title={`Click to ${isRedacted ? 'unredact' : 'redact'} entire column`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="truncate">{header}</span>
                            {isRedacted && (
                              <EyeOff className="w-3 h-3 ml-1 flex-shrink-0" />
                            )}
                            {!isRedacted && isAutoDetected && (
                              <span className="ml-1 text-blue-500 text-[10px]">(auto)</span>
                            )}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
                
                {/* Data Rows */}
                {parsedData.rows.map((row, rowIndex) => {
                  const isRowRedacted = redactedRows.has(rowIndex)
                  return (
                    <div 
                      key={rowIndex} 
                      className={`flex border-b border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700/50 ${
                        isRowRedacted ? 'bg-red-50/30 dark:bg-red-900/10' : ''
                      }`}
                    >
                      {/* Row number */}
                      <div
                        onClick={() => toggleRow(rowIndex)}
                        className={`w-12 p-2 text-xs font-medium border-r border-gray-200 dark:border-gray-600 cursor-pointer transition-colors hover:bg-gray-200 dark:hover:bg-gray-600 ${
                          isRowRedacted 
                            ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400' 
                            : 'text-gray-500 dark:text-gray-400'
                        }`}
                        title={`Click to ${isRowRedacted ? 'unredact' : 'redact'} entire row`}
                      >
                        {rowIndex + 1}
                      </div>
                      
                      {/* Data cells */}
                      {row.map((cell, colIndex) => {
                        const isRedacted = isCellRedacted(rowIndex, colIndex)
                        return (
                          <div
                            key={colIndex}
                            onClick={() => toggleCell(rowIndex, colIndex)}
                            className={`flex-1 p-2 text-xs border-r border-gray-200 dark:border-gray-600 min-w-[120px] cursor-pointer transition-colors hover:bg-blue-50 dark:hover:bg-blue-900/20 ${
                              isRedacted 
                                ? 'bg-red-50 dark:bg-red-900/10 font-mono text-red-600 dark:text-red-400' 
                                : 'text-gray-800 dark:text-gray-200'
                            }`}
                            title={`Click to ${isRedacted ? 'unredact' : 'redact'} this cell`}
                          >
                            <span className="block truncate">
                              {isRedacted ? 'XXXX' : cell}
                            </span>
                          </div>
                        )
                      })}
                    </div>
                  )
                })}
              </div>
            </div>
          ) : (
            <div className="p-8 text-center text-gray-500 dark:text-gray-400">
              No data to display
            </div>
          )}
        </div>
        
        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
          <div className="text-sm text-gray-600 dark:text-gray-400">
            <span className="font-medium">{totalRedactedCells}</span> of <span className="font-medium">{totalCells}</span> cells redacted
            {redactedColumns.size > 0 && (
              <span className="ml-2">
                • <span className="font-medium">{redactedColumns.size}</span> column{redactedColumns.size !== 1 ? 's' : ''} fully redacted
              </span>
            )}
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" onClick={onCancel}>
              Cancel
            </Button>
            <Button onClick={handleConfirm} className="bg-blue-600 hover:bg-blue-700 text-white">
              <Check className="w-4 h-4 mr-2" />
              Confirm Compliance
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
