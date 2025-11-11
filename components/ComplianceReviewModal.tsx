'use client'

import { useState, useMemo } from 'react'
import { X, Shield, Check, AlertTriangle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { redactPHI, getCSVColumns, isColumnPHI } from '@/lib/phiRedactor'

interface ComplianceReviewModalProps {
  originalData: string
  fileName: string
  onConfirm: (redactedData: string) => void
  onCancel: () => void
}

export function ComplianceReviewModal({ 
  originalData, 
  fileName, 
  onConfirm, 
  onCancel 
}: ComplianceReviewModalProps) {
  const [manuallySelectedColumns, setManuallySelectedColumns] = useState<Set<string>>(new Set())
  
  // Get all columns
  const allColumns = useMemo(() => getCSVColumns(originalData), [originalData])
  
  // Auto-detect PHI columns
  const autoDetectedColumns = useMemo(() => {
    return allColumns.filter(col => isColumnPHI(col))
  }, [allColumns])
  
  // Combine auto-detected and manually selected columns
  const columnsToRedact = useMemo(() => {
    const combined = new Set([...autoDetectedColumns, ...Array.from(manuallySelectedColumns)])
    return Array.from(combined)
  }, [autoDetectedColumns, manuallySelectedColumns])
  
  // Generate redacted data
  const { redactedData, redactedColumns } = useMemo(() => {
    return redactPHI(originalData, columnsToRedact)
  }, [originalData, columnsToRedact])
  
  // Parse data for display
  const parseCSVForDisplay = (data: string) => {
    const lines = data.split('\n').filter(line => line.trim())
    if (lines.length === 0) return { headers: [], rows: [] }
    
    const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''))
    const rows = lines.slice(1, 11).map(line => // Show first 10 rows
      line.split(',').map(cell => cell.trim().replace(/^"|"$/g, ''))
    )
    
    return { headers, rows }
  }
  
  const originalParsed = parseCSVForDisplay(originalData)
  const redactedParsed = parseCSVForDisplay(redactedData)
  
  const toggleColumn = (columnName: string) => {
    const newSet = new Set(manuallySelectedColumns)
    if (newSet.has(columnName)) {
      newSet.delete(columnName)
    } else {
      newSet.add(columnName)
    }
    setManuallySelectedColumns(newSet)
  }
  
  const handleConfirm = () => {
    onConfirm(redactedData)
  }
  
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
                Compliance Responsibility
              </p>
              <p className="text-xs text-yellow-700 dark:text-yellow-400 mt-1">
                You are responsible for ensuring HIPAA/NIST compliance. Original data will NOT be stored - only the redacted version will be saved. 
                Please review the redacted data carefully before confirming.
              </p>
            </div>
          </div>
        </div>
        
        {/* Content */}
        <div className="flex-1 overflow-hidden flex flex-col">
          <div className="flex-1 grid grid-cols-2 gap-4 p-6 overflow-auto">
            {/* Original Data */}
            <div className="flex flex-col">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                  Original Data (Preview Only)
                </h3>
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  {originalParsed.rows.length} rows shown
                </span>
              </div>
              <div className="flex-1 border rounded-lg overflow-auto bg-gray-50 dark:bg-gray-800">
                {originalParsed.headers.length > 0 ? (
                  <div className="w-full min-w-max">
                    {/* Headers */}
                    <div className="sticky top-0 bg-gray-200 dark:bg-gray-700 border-b z-10">
                      <div className="flex">
                        {originalParsed.headers.map((header, index) => {
                          const isRedacted = redactedColumns.includes(header)
                          return (
                            <div
                              key={index}
                              className={`flex-1 p-2 text-xs font-semibold border-r border-gray-300 dark:border-gray-600 min-w-[120px] ${
                                isRedacted ? 'bg-red-100 dark:bg-red-900/30' : ''
                              }`}
                            >
                              {header}
                              {isRedacted && (
                                <span className="ml-1 text-red-600 dark:text-red-400">🔒</span>
                              )}
                            </div>
                          )
                        })}
                      </div>
                    </div>
                    {/* Rows */}
                    {originalParsed.rows.map((row, rowIndex) => (
                      <div key={rowIndex} className="flex border-b border-gray-200 dark:border-gray-600">
                        {row.map((cell, cellIndex) => {
                          const header = originalParsed.headers[cellIndex]
                          const isRedacted = header && redactedColumns.includes(header)
                          return (
                            <div
                              key={cellIndex}
                              className={`flex-1 p-2 text-xs border-r border-gray-200 dark:border-gray-600 min-w-[120px] ${
                                isRedacted ? 'bg-red-50 dark:bg-red-900/10' : ''
                              }`}
                            >
                              <span className="block truncate">{cell}</span>
                            </div>
                          )
                        })}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-8 text-center text-gray-500 dark:text-gray-400">
                    No data to display
                  </div>
                )}
              </div>
            </div>
            
            {/* Redacted Data */}
            <div className="flex flex-col">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                  Redacted Data (Will Be Stored)
                </h3>
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  {redactedParsed.rows.length} rows shown
                </span>
              </div>
              <div className="flex-1 border rounded-lg overflow-auto bg-gray-50 dark:bg-gray-800">
                {redactedParsed.headers.length > 0 ? (
                  <div className="w-full min-w-max">
                    {/* Headers */}
                    <div className="sticky top-0 bg-gray-200 dark:bg-gray-700 border-b z-10">
                      <div className="flex">
                        {redactedParsed.headers.map((header, index) => {
                          const isRedacted = redactedColumns.includes(header)
                          return (
                            <div
                              key={index}
                              className={`flex-1 p-2 text-xs font-semibold border-r border-gray-300 dark:border-gray-600 min-w-[120px] ${
                                isRedacted ? 'bg-green-100 dark:bg-green-900/30' : ''
                              }`}
                            >
                              {header}
                              {isRedacted && (
                                <span className="ml-1 text-green-600 dark:text-green-400">✓</span>
                              )}
                            </div>
                          )
                        })}
                      </div>
                    </div>
                    {/* Rows */}
                    {redactedParsed.rows.map((row, rowIndex) => (
                      <div key={rowIndex} className="flex border-b border-gray-200 dark:border-gray-600">
                        {row.map((cell, cellIndex) => {
                          const header = redactedParsed.headers[cellIndex]
                          const isRedacted = header && redactedColumns.includes(header)
                          return (
                            <div
                              key={cellIndex}
                              className={`flex-1 p-2 text-xs border-r border-gray-200 dark:border-gray-600 min-w-[120px] ${
                                isRedacted ? 'bg-green-50 dark:bg-green-900/10 font-mono' : ''
                              }`}
                            >
                              <span className="block truncate">{cell}</span>
                            </div>
                          )
                        })}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-8 text-center text-gray-500 dark:text-gray-400">
                    No data to display
                  </div>
                )}
              </div>
            </div>
          </div>
          
          {/* Column Selection */}
          <div className="border-t border-gray-200 dark:border-gray-700 p-4 bg-gray-50 dark:bg-gray-800">
            <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
              Columns to Redact
            </h4>
            <div className="flex flex-wrap gap-2 max-h-32 overflow-auto">
              {allColumns.map(column => {
                const isAutoDetected = autoDetectedColumns.includes(column)
                const isManuallySelected = manuallySelectedColumns.has(column)
                const isSelected = isAutoDetected || isManuallySelected
                
                return (
                  <label
                    key={column}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border cursor-pointer transition-colors ${
                      isSelected
                        ? 'bg-blue-100 dark:bg-blue-900/30 border-blue-300 dark:border-blue-700'
                        : 'bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => toggleColumn(column)}
                      className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                    />
                    <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
                      {column}
                    </span>
                    {isAutoDetected && (
                      <span className="text-xs text-blue-600 dark:text-blue-400">(auto)</span>
                    )}
                  </label>
                )
              })}
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
              {redactedColumns.length} column{redactedColumns.length !== 1 ? 's' : ''} will be redacted
            </p>
          </div>
        </div>
        
        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
          <div className="text-sm text-gray-600 dark:text-gray-400">
            <span className="font-medium">{redactedColumns.length}</span> column{redactedColumns.length !== 1 ? 's' : ''} redacted
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

