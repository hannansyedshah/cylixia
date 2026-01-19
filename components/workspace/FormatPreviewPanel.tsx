'use client'

import { useState, useMemo } from 'react'
import { Table, Eye, EyeOff } from 'lucide-react'
import { parseCsv } from '@/utils/csv'

interface FormatPreviewPanelProps {
  originalCsv: string
  previewCsv: string | null
  error: string | null
}

export function FormatPreviewPanel({ originalCsv, previewCsv, error }: FormatPreviewPanelProps) {
  const [showOriginal, setShowOriginal] = useState(false)

  const displayCsv = showOriginal ? originalCsv : (previewCsv || originalCsv)
  const { headers, rows } = useMemo(() => parseCsv(displayCsv), [displayCsv])

  const originalParsed = useMemo(() => parseCsv(originalCsv), [originalCsv])
  const previewParsed = useMemo(() => previewCsv ? parseCsv(previewCsv) : null, [previewCsv])

  return (
    <div className="h-full flex flex-col bg-zinc-900">
      {/* Header */}
      <div className="p-3 bg-zinc-800/50 border-b border-zinc-700 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Table className="h-4 w-4 text-blue-400" />
          <span className="text-sm font-medium text-white">Preview</span>
        </div>

        {previewCsv && (
          <div className="flex text-xs">
            <button
              onClick={() => setShowOriginal(false)}
              className={`px-3 py-1.5 rounded-l-lg border transition-all ${
                !showOriginal
                  ? 'bg-emerald-500/20 border-emerald-500/30 text-emerald-400 font-medium'
                  : 'bg-zinc-800/50 border-zinc-700 text-zinc-400 hover:text-white hover:bg-zinc-700'
              }`}
            >
              <Eye className="h-3 w-3 inline mr-1" />
              Transformed
            </button>
            <button
              onClick={() => setShowOriginal(true)}
              className={`px-3 py-1.5 rounded-r-lg border-t border-r border-b transition-all ${
                showOriginal
                  ? 'bg-zinc-700 border-zinc-600 text-white font-medium'
                  : 'bg-zinc-800/50 border-zinc-700 text-zinc-400 hover:text-white hover:bg-zinc-700'
              }`}
            >
              <EyeOff className="h-3 w-3 inline mr-1" />
              Original
            </button>
          </div>
        )}
      </div>

      {/* Error display */}
      {error && (
        <div className="p-3 bg-red-500/10 border-b border-red-500/30">
          <p className="text-sm text-red-400">{error}</p>
        </div>
      )}

      {/* Table */}
      <div className="flex-1 overflow-auto">
        <table className="w-full text-xs">
          <thead className="sticky top-0 bg-zinc-800">
            <tr>
              {headers.map((header, i) => (
                <th
                  key={i}
                  className="px-3 py-2 text-left font-medium text-zinc-300 border-b border-zinc-700 whitespace-nowrap"
                >
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, rowIndex) => (
              <tr key={rowIndex} className="hover:bg-zinc-800/50">
                {row.map((cell, cellIndex) => (
                  <td
                    key={cellIndex}
                    className="px-3 py-1.5 text-zinc-400 border-b border-zinc-800 whitespace-nowrap"
                  >
                    {cell}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Footer with stats */}
      <div className="px-3 py-2 bg-zinc-800/50 border-t border-zinc-700 text-xs text-zinc-500 flex justify-between">
        <span>
          {rows.length} rows × {headers.length} columns
        </span>
        {previewCsv && previewParsed && (
          <span className={`${
            previewParsed.rows.length !== originalParsed.rows.length ||
            previewParsed.headers.length !== originalParsed.headers.length
              ? 'text-amber-400'
              : 'text-emerald-400'
          }`}>
            {showOriginal ? 'Viewing original' : (
              previewParsed.rows.length === originalParsed.rows.length &&
              previewParsed.headers.length === originalParsed.headers.length
                ? 'Same dimensions'
                : `Changed: ${originalParsed.rows.length}→${previewParsed.rows.length} rows, ${originalParsed.headers.length}→${previewParsed.headers.length} cols`
            )}
          </span>
        )}
      </div>
    </div>
  )
}
