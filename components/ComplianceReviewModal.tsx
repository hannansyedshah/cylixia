'use client'

import { useMemo } from 'react'
import { X, Shield, Check, AlertTriangle, Lock } from 'lucide-react'
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

export function ComplianceReviewModal({ 
  originalData, 
  fileName, 
  onConfirm, 
  onCancel 
}: ComplianceReviewModalProps) {
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
  
  const handleConfirm = () => {
    onConfirm(redactedData)
  }
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onCancel}></div>
      <div className="relative bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 w-[96vw] max-w-[1400px] h-[92vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-8 py-6 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-gray-800 dark:to-gray-850 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 dark:from-blue-600 dark:to-indigo-700 flex items-center justify-center shadow-lg">
              <Shield className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                HIPAA/NIST Compliance Review
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
            className="rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>
        
        {/* Warning Banner */}
        <div className="px-8 py-4 bg-gradient-to-r from-amber-50 to-yellow-50 dark:from-amber-900/20 dark:to-yellow-900/20 border-b border-amber-200 dark:border-amber-800">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-lg bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center flex-shrink-0 mt-0.5">
              <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold text-amber-900 dark:text-amber-200">
                Final Compliance Verification
              </p>
              <p className="text-xs text-amber-800 dark:text-amber-300 mt-1 leading-relaxed">
                This preview shows the redacted version that will be stored. Protected Health Information (PHI) columns have been automatically identified and redacted. 
                <span className="font-semibold"> Original data will NOT be stored.</span> Please verify compliance before confirming.
              </p>
            </div>
          </div>
        </div>
        
        {/* Legal Disclaimer */}
        <div className="px-8 py-3 bg-gradient-to-r from-red-50 to-orange-50 dark:from-red-900/20 dark:to-orange-900/20 border-b border-red-200 dark:border-red-800">
          <div className="flex items-start gap-3">
            <div className="w-6 h-6 rounded-lg bg-red-100 dark:bg-red-900/30 flex items-center justify-center flex-shrink-0 mt-0.5">
              <AlertTriangle className="w-4 h-4 text-red-600 dark:text-red-400" />
            </div>
            <div className="flex-1">
              <p className="text-xs font-bold text-red-900 dark:text-red-200 uppercase tracking-wide mb-1">
                Important Disclaimer & Liability Notice
              </p>
              <p className="text-xs text-red-800 dark:text-red-300 leading-relaxed">
                <span className="font-semibold">By confirming, you acknowledge and agree that:</span> (1) You are solely responsible for ensuring HIPAA/NIST compliance of the redacted data; 
                (2) This platform provides automated redaction tools but makes no guarantees regarding compliance; 
                (3) <span className="font-semibold">Redacted data, although randomized, will be shared with AI models</span> for code generation purposes; 
                (4) We assume no liability for any compliance violations, data breaches, or regulatory issues arising from your use of this service; 
                (5) You have reviewed and verified the redacted data meets all applicable compliance requirements before proceeding.
              </p>
            </div>
          </div>
        </div>
        
        {/* Data Table Container */}
        <div className="flex-1 overflow-hidden flex flex-col bg-gray-50 dark:bg-gray-900/50">
          <div className="flex-1 overflow-auto p-6">
            {parsedData.headers.length > 0 ? (
              <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-lg overflow-hidden">
                <div className="overflow-auto max-h-full">
                  <table className="w-full border-collapse">
                    {/* Header */}
                    <thead className="sticky top-0 z-20">
                      <tr>
                        {parsedData.headers.map((header, colIndex) => {
                          const isRedacted = redactedColumns.includes(header)
                          return (
                            <th
                              key={colIndex}
                              className={`px-5 py-4 text-left text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300 border-b-2 border-r border-gray-200 dark:border-gray-600 whitespace-nowrap min-w-[140px] ${
                                isRedacted 
                                  ? 'bg-gradient-to-b from-red-100 to-red-50 dark:from-red-900/40 dark:to-red-900/20 text-red-800 dark:text-red-300 border-red-300 dark:border-red-700' 
                                  : 'bg-gradient-to-b from-gray-100 to-gray-50 dark:from-gray-700 dark:to-gray-800 border-gray-300 dark:border-gray-600'
                              }`}
                            >
                              <div className="flex items-center gap-2">
                                <span className="truncate">{header}</span>
                                {isRedacted && (
                                  <Lock className="w-3.5 h-3.5 text-red-600 dark:text-red-400 flex-shrink-0" />
                                )}
                              </div>
                            </th>
                          )
                        })}
                      </tr>
                    </thead>
                    
                    {/* Body */}
                    <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                      {parsedData.rows.map((row, rowIndex) => (
                        <tr 
                          key={rowIndex} 
                          className="hover:bg-blue-50/30 dark:hover:bg-blue-900/10 transition-colors duration-150"
                        >
                          {row.map((cell, colIndex) => {
                            const header = parsedData.headers[colIndex]
                            const isRedacted = redactedColumns.includes(header)
                            return (
                              <td
                                key={colIndex}
                                className={`px-5 py-3.5 text-sm border-r border-gray-100 dark:border-gray-700 whitespace-nowrap ${
                                  isRedacted 
                                    ? 'bg-red-50/50 dark:bg-red-900/10 font-mono text-red-700 dark:text-red-400 font-semibold' 
                                    : 'text-gray-700 dark:text-gray-300'
                                }`}
                              >
                                <div className="truncate max-w-[200px]" title={isRedacted ? 'Redacted PHI' : cell}>
                                  {isRedacted ? (
                                    <span className="inline-flex items-center gap-1.5">
                                      <span className="w-2 h-2 rounded-full bg-red-500 dark:bg-red-400"></span>
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
              </div>
            ) : (
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <div className="w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mx-auto mb-4">
                    <Shield className="w-8 h-8 text-gray-400 dark:text-gray-600" />
                  </div>
                  <p className="text-gray-500 dark:text-gray-400 font-medium">No data to display</p>
                </div>
              </div>
            )}
          </div>
          
          {/* Redacted Columns Summary */}
          <div className="px-6 py-4 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-3">
                  <Lock className="w-4 h-4 text-red-600 dark:text-red-400" />
                  <h4 className="text-sm font-bold text-gray-900 dark:text-white">
                    Protected Health Information (PHI) - {redactedColumns.length} Column{redactedColumns.length !== 1 ? 's' : ''} Redacted
                  </h4>
                </div>
                <div className="flex flex-wrap gap-2">
                  {redactedColumns.map(columnName => (
                    <span
                      key={columnName}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-gradient-to-r from-red-100 to-red-50 text-red-800 dark:from-red-900/30 dark:to-red-900/20 dark:text-red-300 border border-red-200 dark:border-red-800 shadow-sm"
                    >
                      <Lock className="w-3 h-3" />
                      {columnName}
                    </span>
                  ))}
                </div>
              </div>
              <div className="ml-6 text-right">
                <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Dataset Summary</div>
                <div className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                  <span className="text-blue-600 dark:text-blue-400">{parsedData.rows.length}</span> rows
                </div>
                <div className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                  <span className="text-blue-600 dark:text-blue-400">{parsedData.headers.length}</span> columns
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Footer */}
        <div className="flex items-center justify-between px-8 py-5 bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-850 border-t border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
            <span>
              <span className="font-semibold text-gray-700 dark:text-gray-300">{redactedColumns.length}</span> PHI column{redactedColumns.length !== 1 ? 's' : ''} automatically protected
            </span>
          </div>
          <div className="flex items-center gap-3">
            <Button 
              variant="outline" 
              onClick={onCancel}
              className="px-6 py-2.5 rounded-lg border-2 hover:bg-gray-100 dark:hover:bg-gray-700 font-medium"
            >
              Cancel
            </Button>
            <Button 
              onClick={handleConfirm} 
              className="px-6 py-2.5 rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold shadow-lg hover:shadow-xl transition-all duration-200"
            >
              <Check className="w-4 h-4 mr-2" />
              Confirm Compliance
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
