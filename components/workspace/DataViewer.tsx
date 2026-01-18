'use client'

import { useState, useMemo } from 'react'
import { Table, ChevronDown, Database } from 'lucide-react'
import { parseCsv } from '@/utils/csv'
import type { DatasetItem } from '@/types/dataset'

interface DataViewerProps {
  datasets: DatasetItem[]
}

export function DataViewer({ datasets }: DataViewerProps) {
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [dropdownOpen, setDropdownOpen] = useState(false)

  const selectedDataset = datasets[selectedIndex]

  const { headers, rows } = useMemo(() => {
    if (!selectedDataset?.csvText) return { headers: [], rows: [] }
    return parseCsv(selectedDataset.csvText)
  }, [selectedDataset])

  if (datasets.length === 0) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-zinc-500 p-4">
        <Database className="h-12 w-12 mb-3 opacity-50" />
        <p className="text-sm font-medium">No data from last run</p>
        <p className="text-xs mt-1 text-zinc-600">Upload CSVs and run your code to see data here</p>
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col bg-zinc-900">
      <div className="p-2 bg-zinc-800/50 border-b border-zinc-700 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Table className="h-4 w-4 text-blue-400" />
          <span className="text-sm font-medium text-white">Data</span>
        </div>

        {datasets.length > 1 && (
          <div className="relative">
            <button
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="flex items-center gap-1 px-2 py-1 text-xs bg-zinc-700 hover:bg-zinc-600 rounded border border-zinc-600 text-zinc-200"
            >
              <span className="truncate max-w-[150px]">{selectedDataset?.fileName}</span>
              <ChevronDown className="h-3 w-3" />
            </button>

            {dropdownOpen && (
              <div className="absolute right-0 mt-1 w-48 bg-zinc-800 border border-zinc-700 rounded shadow-lg z-10">
                {datasets.map((dataset, index) => (
                  <button
                    key={dataset.id}
                    onClick={() => {
                      setSelectedIndex(index)
                      setDropdownOpen(false)
                    }}
                    className={`w-full text-left px-3 py-2 text-xs hover:bg-zinc-700 ${
                      index === selectedIndex ? 'bg-zinc-700 text-white' : 'text-zinc-300'
                    }`}
                  >
                    {dataset.fileName}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {datasets.length === 1 && (
          <span className="text-xs text-zinc-400 truncate max-w-[150px]">
            {selectedDataset?.fileName}
          </span>
        )}
      </div>

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

      <div className="px-3 py-1.5 bg-zinc-800/50 border-t border-zinc-700 text-xs text-zinc-500">
        {rows.length} rows × {headers.length} columns
      </div>
    </div>
  )
}
