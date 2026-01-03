'use client'

import { useMemo, useState } from 'react'
import { X, Shield, Check, AlertTriangle, Lock, Eye, ChevronDown } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { redactPHI, getCSVColumns, isColumnPHI } from '@/utils/phiRedactor'

interface ComplianceReviewModalProps {
  originalData: string
  fileName: string
  onConfirm: (redactedData: string, excludedColumns: string[]) => void
  onEdit: (redactedData: string, excludedColumns: string[]) => void
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

export function ComplianceReviewModal({
  originalData,
  fileName,
  onConfirm,
  onEdit,
  onCancel
}: ComplianceReviewModalProps) {
  // Note: Compliance warnings are now shown when opening NIST projects
  // This modal now only shows the data preview

  // Get all columns
  const allColumns = useMemo(() => getCSVColumns(originalData), [originalData])

  // Auto-detect PHI columns
  const autoDetectedColumns = useMemo(() => {
    return allColumns.filter(col => isColumnPHI(col))
  }, [allColumns])

  // Generate redacted data with auto-detected columns
  const { redactedData, redactedColumns } = useMemo(() => {
    return redactPHI(originalData, autoDetectedColumns)
  }, [originalData, autoDetectedColumns])

  // Parse redacted CSV for display
  const parsedData = useMemo(() => {
    const lines = redactedData.split('\n').filter(line => line.trim())
    if (lines.length === 0) return { headers: [], rows: [] }

    const headers = parseCSVLine(lines[0]).map(h => h.replace(/^"|"$/g, '').trim())
    const rows = lines.slice(1).map(line =>
      parseCSVLine(line).map(cell => cell.replace(/^"|"$/g, '').trim())
    )

    return { headers, rows }
  }, [redactedData])

  // Pagination state - show 20 rows initially
  const [displayedRowCount, setDisplayedRowCount] = useState(20)
  const visibleRows = parsedData.rows.slice(0, displayedRowCount)
  const hasMoreRows = displayedRowCount < parsedData.rows.length

  const loadMoreRows = () => {
    setDisplayedRowCount(prev => Math.min(prev + 50, parsedData.rows.length))
  }

  const handleConfirm = () => {
    onConfirm(redactedData, redactedColumns)
  }

  const handleEdit = () => {
    onEdit(redactedData, redactedColumns)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onCancel}></div>
      <div className="relative bg-zinc-900 rounded-2xl shadow-2xl border border-zinc-800 w-[96vw] max-w-[1400px] h-[92vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-8 py-6 bg-zinc-800/50 border-b border-zinc-700">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-teal-500 to-cyan-600 flex items-center justify-center shadow-lg">
              <Shield className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white">
                Compliance Review - Data Preview
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

        {/* Warning Banner */}
        <div className="px-8 py-4 bg-amber-500/10 border-b border-amber-500/30">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-lg bg-amber-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
              <AlertTriangle className="w-5 h-5 text-amber-400" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold text-amber-300">
                Final Compliance Verification
              </p>
              <p className="text-xs text-amber-400/80 mt-1 leading-relaxed">
                This preview shows the redacted version that will be stored. Protected Health Information (PHI) columns have been automatically identified and redacted.
                <span className="font-semibold"> Original data will NOT be stored.</span> Please verify compliance before confirming.
              </p>
            </div>
          </div>
        </div>

        {/* Data Table Container */}
        <div className="flex-1 overflow-hidden flex flex-col bg-zinc-900/50">
          <div className="flex-1 overflow-x-auto overflow-y-auto p-6">
            {parsedData.headers.length > 0 ? (
              <div className="bg-zinc-800/50 rounded-xl border border-zinc-700 shadow-lg overflow-hidden">
                <div className="overflow-x-auto overflow-y-auto max-h-full">
                  <table className="w-full border-collapse">
                    {/* Header */}
                    <thead className="sticky top-0 z-20">
                      <tr>
                        {parsedData.headers.map((header, colIndex) => {
                          const isRedacted = redactedColumns.includes(header)
                          return (
                            <th
                              key={colIndex}
                              className={`px-5 py-4 text-left text-xs font-bold uppercase tracking-wider border-b border-r border-zinc-700 whitespace-nowrap min-w-[140px] ${
                                isRedacted
                                  ? 'bg-red-500/20 text-red-400 border-red-500/50'
                                  : 'bg-zinc-800 text-zinc-400'
                              }`}
                            >
                              <div className="flex items-center gap-2">
                                <span className="truncate">{header}</span>
                                {isRedacted && (
                                  <Lock className="w-3.5 h-3.5 text-red-400 flex-shrink-0" />
                                )}
                              </div>
                            </th>
                          )
                        })}
                      </tr>
                    </thead>

                    {/* Body */}
                    <tbody className="divide-y divide-zinc-700">
                      {visibleRows.map((row, rowIndex) => (
                        <tr
                          key={rowIndex}
                          className="hover:bg-zinc-700/30 transition-colors duration-150"
                        >
                          {row.map((cell, colIndex) => {
                            const header = parsedData.headers[colIndex]
                            const isRedacted = redactedColumns.includes(header)
                            return (
                              <td
                                key={colIndex}
                                className={`px-5 py-3.5 text-sm border-r border-zinc-700/50 whitespace-nowrap ${
                                  isRedacted
                                    ? 'bg-red-500/10 font-mono text-red-400 font-semibold'
                                    : 'text-zinc-300'
                                }`}
                              >
                                <div className="truncate max-w-[200px]" title={isRedacted ? 'Redacted PHI' : cell}>
                                  {isRedacted ? (
                                    <span className="inline-flex items-center gap-1.5">
                                      <span className="w-2 h-2 rounded-full bg-red-500"></span>
                                      <span>XXXX</span>
                                    </span>
                                  ) : (
                                    cell
                                  )}
                                </div>
                              </td>
                            )
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Load More Button */}
                {hasMoreRows && (
                  <div className="flex justify-center mt-4 pb-4">
                    <Button
                      onClick={loadMoreRows}
                      variant="outline"
                      className="border border-teal-500/50 bg-zinc-800 hover:bg-teal-500/20 text-teal-300 font-semibold px-6 py-3"
                    >
                      <ChevronDown className="w-4 h-4 mr-2" />
                      Load More Rows ({displayedRowCount} of {parsedData.rows.length} shown)
                    </Button>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <div className="w-16 h-16 rounded-full bg-zinc-800 flex items-center justify-center mx-auto mb-4">
                    <Shield className="w-8 h-8 text-zinc-500" />
                  </div>
                  <p className="text-zinc-400 font-medium">No data to display</p>
                </div>
              </div>
            )}
          </div>

          {/* Redacted Columns Summary */}
          <div className="px-6 py-4 bg-zinc-800/50 border-t border-zinc-700">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-3">
                  <Lock className="w-4 h-4 text-red-400" />
                  <h4 className="text-sm font-bold text-white">
                    Protected Health Information (PHI) - {redactedColumns.length} Column{redactedColumns.length !== 1 ? 's' : ''} Redacted
                  </h4>
                </div>
                <div className="flex flex-wrap gap-2">
                  {redactedColumns.map(columnName => (
                    <span
                      key={columnName}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-red-500/20 text-red-300 border border-red-500/30"
                    >
                      <Lock className="w-3 h-3" />
                      {columnName}
                    </span>
                  ))}
                </div>
              </div>
              <div className="ml-6 text-right">
                <div className="text-xs text-zinc-500 mb-1">Dataset Summary</div>
                <div className="text-sm font-semibold text-zinc-300">
                  <span className="text-teal-400">{parsedData.rows.length}</span> rows
                </div>
                <div className="text-sm font-semibold text-zinc-300">
                  <span className="text-teal-400">{parsedData.headers.length}</span> columns
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-8 py-5 bg-zinc-800/50 border-t border-zinc-700">
          <div className="flex items-center gap-2 text-sm text-zinc-400">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
            <span>
              <span className="font-semibold text-zinc-300">{redactedColumns.length}</span> PHI column{redactedColumns.length !== 1 ? 's' : ''} automatically protected
            </span>
          </div>
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              onClick={onCancel}
              className="px-6 py-2.5 bg-zinc-800 border-zinc-700 text-zinc-300 hover:bg-zinc-700 hover:text-white"
            >
              Cancel
            </Button>
            <Button
              variant="outline"
              onClick={handleEdit}
              className="px-6 py-2.5 bg-zinc-800 border-purple-500/50 text-purple-300 hover:bg-purple-500/20"
            >
              <Eye className="w-4 h-4 mr-2" />
              Edit Data
            </Button>
            <Button
              onClick={handleConfirm}
              className="px-6 py-2.5 bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-700 hover:to-cyan-700 text-white font-semibold shadow-lg hover:shadow-xl transition-all duration-200"
            >
              <Check className="w-4 h-4 mr-2" />
              Upload
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
