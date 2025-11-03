'use client'

import { useMemo, useRef, useState } from 'react'
import { Upload, X, Eye } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { DataPreview } from '@/components/DataPreview'

interface DatasetItem {
  id: string
  fileName: string
  sizeBytes: number
  persisted: boolean
  includeChat: boolean
  includeRun: boolean
  csvText?: string // present for ephemeral items
}

interface UploadPanelProps {
  datasets: DatasetItem[]
  onDatasetsChange?: (datasets: DatasetItem[]) => void
  privacyMode?: boolean
}

export function UploadPanel({ datasets, onDatasetsChange, privacyMode = true }: UploadPanelProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [previewItem, setPreviewItem] = useState<DatasetItem | null>(null)
  const [pendingFiles, setPendingFiles] = useState<File[] | null>(null)
  const [previewViewMode, setPreviewViewMode] = useState<'original' | 'randomized'>('randomized')
  
  // Reset view mode when opening preview
  const handlePreviewOpen = (item: DatasetItem) => {
    setPreviewViewMode(privacyMode ? 'randomized' : 'original')
    setPreviewItem(item)
  }

  const canAddMore = datasets.length < 5
  const selectedCounts = useMemo(() => ({
    chat: datasets.filter(i => i.includeChat).length,
    run: datasets.filter(i => i.includeRun).length,
  }), [datasets])

  const notifyChange = (next: DatasetItem[]) => {
    onDatasetsChange?.(next)
  }

  const handleLocalAdd = async (file: File) => {
    if (!file.name.toLowerCase().endsWith('.csv')) return alert('Only .csv files are allowed')
    if (file.size > 10 * 1024 * 1024) return alert('File too large (max 10MB)')

    const text = await file.text()
    const item: DatasetItem = {
      id: `ephemeral_${Date.now()}_${Math.random().toString(36).slice(2)}`,
      fileName: file.name,
      sizeBytes: file.size,
      persisted: false,
      includeChat: true,
      includeRun: true,
      csvText: text,
    }
    
    // Check if there's a placeholder with the same file name
    const existingIndex = datasets.findIndex(d => d.fileName === file.name && d.persisted && !d.csvText)
    if (existingIndex >= 0) {
      // Replace the placeholder with the actual file
      const updated = [...datasets]
      updated[existingIndex] = item
      notifyChange(updated)
    } else {
      notifyChange([...(datasets || []), item])
    }
  }

  const fileToItem = async (file: File): Promise<DatasetItem | null> => {
    if (!file.name.toLowerCase().endsWith('.csv')) { alert('Only .csv files are allowed'); return null }
    if (file.size > 10 * 1024 * 1024) { alert('File too large (max 10MB)'); return null }
    const text = await file.text()
    return {
      id: `ephemeral_${Date.now()}_${Math.random().toString(36).slice(2)}`,
      fileName: file.name,
      sizeBytes: file.size,
      persisted: false,
      includeChat: true,
      includeRun: true,
      csvText: text,
    }
  }

  const handleSelectFiles = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const all = Array.from(e.target.files || [])
    if (all.length === 0) return
    
    // Check how many placeholders exist
    const placeholderCount = datasets.filter(d => d.persisted && !d.csvText).length
    const activeCount = datasets.filter(d => d.csvText).length
    const remaining = Math.max(0, 5 - activeCount)
    
    const items = (await Promise.all(all.map(fileToItem))).filter(Boolean) as DatasetItem[]
    
    // Process items: replace placeholders if file name matches, otherwise add new
    let updatedDatasets = [...datasets]
    let addedCount = 0
    
    for (const item of items) {
      // Check if there's a placeholder with the same file name
      const placeholderIndex = updatedDatasets.findIndex(
        d => d.fileName === item.fileName && d.persisted && !d.csvText
      )
      
      if (placeholderIndex >= 0) {
        // Replace placeholder with actual file
        updatedDatasets[placeholderIndex] = item
      } else if (activeCount + addedCount < 5) {
        // Add new item if under limit
        updatedDatasets.push(item)
        addedCount++
      }
    }
    
    if (items.length > 0) {
      if (addedCount < items.length && placeholderCount === 0) {
        alert(`Only ${remaining} more dataset(s) can be added (max 5). ${items.length - addedCount} file(s) skipped.`)
      }
      notifyChange(updatedDatasets)
    }
    
    if (inputRef.current) inputRef.current.value = ''
  }

  const confirmAddPending = async () => {
    if (!pendingFiles) return
    for (const f of pendingFiles) {
      // eslint-disable-next-line no-await-in-loop
      await handleLocalAdd(f)
    }
    setPendingFiles(null)
  }

  const cancelPending = () => {
    setPendingFiles(null)
  }

  const removeItem = (id: string) => {
    const next = datasets.filter(i => i.id !== id)
    notifyChange(next)
  }

  const toggleFlag = (id: string, key: 'includeChat' | 'includeRun') => {
    const next = datasets.map(i => i.id === id ? { ...i, [key]: !i[key] } : i)
    notifyChange(next)
  }

  return (
    <div className="p-3 border-b bg-gradient-to-r from-white to-blue-50/30 dark:from-gray-800 dark:to-blue-950/30">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 flex-1">
          <input
            ref={inputRef}
            id="file-upload"
            type="file"
            accept=".csv"
            multiple
            className="hidden"
            onChange={handleSelectFiles}
          />
          <label htmlFor="file-upload" className="flex-1 cursor-pointer">
            <div className={`w-full inline-flex items-center justify-center whitespace-nowrap rounded-xl text-sm font-medium transition-all duration-200 border-2 border-dashed border-rstudio/30 bg-white dark:bg-gray-700 hover:bg-rstudio/5 dark:hover:bg-rstudio/10 text-rstudio dark:text-white h-12 px-4 py-2 transform ${canAddMore ? 'hover:scale-105 active:scale-95' : 'opacity-50 cursor-not-allowed'}`}>
              <Upload className="h-5 w-5 mr-2" />
              <span className="font-semibold">Add CSV</span>
            </div>
          </label>
        </div>
        <div className="text-xs text-gray-600 dark:text-gray-400 min-w-[160px] text-right">
          {selectedCounts.chat} in Chat • {selectedCounts.run} in Run
        </div>
      </div>

      {/* Add confirmation inline panel (no server save) */}
      {pendingFiles && (
        <div className="mt-2 p-3 rounded-lg border bg-white dark:bg-gray-800">
          <div className="flex items-center justify-between gap-2">
            <div>
              <div className="text-sm">Add {pendingFiles.length} file{pendingFiles.length > 1 ? 's' : ''} to this session</div>
              <div className="text-[11px] text-gray-500 mt-1">Files are kept locally in this browser session.</div>
            </div>
            <div className="flex items-center gap-2">
              <Button size="sm" variant="outline" onClick={cancelPending}>Cancel</Button>
              <Button size="sm" onClick={confirmAddPending}>Add</Button>
            </div>
          </div>
        </div>
      )}

      {/* Info about saved files */}
      {datasets.some(d => d.persisted && !d.csvText) && (
        <div className="mt-2 p-2 rounded-lg bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800">
          <p className="text-xs text-yellow-800 dark:text-yellow-300">
            💡 <strong>Files needed:</strong> These files were previously uploaded to this project. Please re-upload them to use them again.
          </p>
        </div>
      )}

      {/* List */}
      {datasets.length > 0 && (
        <div className="mt-3 space-y-2">
          {datasets.map(item => {
            const isPlaceholder = item.persisted && !item.csvText
            return (
              <div key={item.id} className={`flex items-center gap-2 p-2 rounded-lg border ${
                isPlaceholder 
                  ? 'bg-yellow-50 dark:bg-yellow-900/10 border-yellow-300 dark:border-yellow-700' 
                  : 'bg-white dark:bg-gray-800'
              }`}>
                <span className={`inline-flex items-center max-w-[40%] truncate px-2 py-1 rounded-full text-xs font-medium ${
                  isPlaceholder
                    ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300 border border-yellow-300 dark:border-yellow-700'
                    : 'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 border border-blue-200 dark:border-blue-700'
                }`}>
                  {isPlaceholder ? '⚠️' : '📊'} <span className="ml-1 truncate">{item.fileName}</span>
                </span>
                {item.sizeBytes > 0 && (
                  <span className="text-[10px] text-gray-500">{(item.sizeBytes/1024).toFixed(1)} KB</span>
                )}
                {isPlaceholder ? (
                  <span className="text-xs text-yellow-700 dark:text-yellow-400 font-medium">
                    Re-upload needed
                  </span>
                ) : (
                  <Button size="sm" variant="outline" onClick={() => handlePreviewOpen(item)} className="h-7 px-2">
                    <Eye className="h-3.5 w-3.5 mr-1" /> Preview
                  </Button>
                )}
                <label className="ml-auto text-xs flex items-center gap-1">
                  <input type="checkbox" checked={item.includeChat} onChange={() => toggleFlag(item.id, 'includeChat')} disabled={isPlaceholder} /> Chat
                </label>
                <label className="text-xs flex items-center gap-1">
                  <input type="checkbox" checked={item.includeRun} onChange={() => toggleFlag(item.id, 'includeRun')} disabled={isPlaceholder} /> Run
                </label>
                <Button variant="ghost" size="icon" onClick={() => removeItem(item.id)} className="h-7 w-7 hover:bg-red-100 dark:hover:bg-red-900/20">
                  <X className="h-4 w-4 text-red-600" />
                </Button>
              </div>
            )
          })}
        </div>
      )}

      {/* Preview Modal */}
      {previewItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50" onClick={() => setPreviewItem(null)}></div>
          <div className="relative bg-white dark:bg-gray-900 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 w-[95vw] max-w-7xl h-[90vh] p-4 flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-gray-200 dark:border-gray-700">
              <div className="text-sm font-semibold text-darktext dark:text-white truncate">{previewItem.fileName}</div>
              <div className="flex items-center gap-2">
                <Button 
                  variant={previewViewMode === 'randomized' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setPreviewViewMode(previewViewMode === 'randomized' ? 'original' : 'randomized')}
                  className="text-xs"
                >
                  {previewViewMode === 'randomized' ? '🔒 Randomized' : '🔓 Original'}
                </Button>
                <Button variant="ghost" size="icon" onClick={() => setPreviewItem(null)}>
                  <X className="h-5 w-5" />
                </Button>
              </div>
            </div>
            <div className="flex-1 min-h-0 mt-3 overflow-auto">
              <DataPreview 
                originalData={previewItem.csvText || ''} 
                fileName={previewItem.fileName} 
                privacyMode={privacyMode || false}
                controlledViewMode={previewViewMode}
                onViewModeChange={setPreviewViewMode}
                isModal={true}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

