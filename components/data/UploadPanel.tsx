'use client'

import { useMemo, useRef, useState } from 'react'
import { Upload, X, Eye, Shield } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { DataPreview } from './DataPreview'
import { ComplianceReviewModal } from './ComplianceReviewModal'
import { CSVDataEditor } from './CSVDataEditor'
import type { DatasetItem } from '@/types/dataset'

interface UploadPanelProps {
  datasets: DatasetItem[]
  onDatasetsChange?: (datasets: DatasetItem[]) => void
  privacyMode?: boolean
  hipaaCompliant?: boolean
}

export function UploadPanel({
  datasets,
  onDatasetsChange,
  privacyMode = true,
  hipaaCompliant = false,
}: UploadPanelProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [previewItem, setPreviewItem] = useState<DatasetItem | null>(null)
  const [previewViewMode, setPreviewViewMode] = useState<'original' | 'randomized'>('randomized')
  const [dataEditorData, setDataEditorData] = useState<{ originalData: string; fileName: string; autoRedactedColumns?: string[] } | null>(null)
  const [complianceReviewData, setComplianceReviewData] = useState<{ originalData: string; fileName: string; manuallyRemovedColumns: string[] } | null>(null)
  const [uploadChoiceData, setUploadChoiceData] = useState<{ originalData: string; fileName: string } | null>(null)

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
    setUploadChoiceData({ originalData: text, fileName: file.name })
  }

  const handleDataEditorConfirm = (editedData: string, removedColumns: string[]) => {
    if (!dataEditorData) return

    const allExcludedColumns = [...new Set([
      ...(dataEditorData.autoRedactedColumns || []),
      ...removedColumns
    ])]

    const item: DatasetItem = {
      id: `ephemeral_${Date.now()}_${Math.random().toString(36).slice(2)}`,
      fileName: dataEditorData.fileName,
      sizeBytes: new Blob([editedData]).size,
      persisted: false,
      includeChat: true,
      includeRun: true,
      csvText: editedData,
      excludedColumns: allExcludedColumns,
    }

    const existingIndex = datasets.findIndex(d => d.fileName === dataEditorData.fileName && d.persisted && !d.csvText)
    if (existingIndex >= 0) {
      const updated = [...datasets]
      updated[existingIndex] = item
      notifyChange(updated)
    } else {
      notifyChange([...(datasets || []), item])
    }

    setDataEditorData(null)
  }

  const handleDataEditorCancel = () => {
    setDataEditorData(null)
  }

  const handleComplianceConfirm = (redactedData: string, autoRedactedColumns: string[]) => {
    if (!complianceReviewData) return

    const item: DatasetItem = {
      id: `ephemeral_${Date.now()}_${Math.random().toString(36).slice(2)}`,
      fileName: complianceReviewData.fileName,
      sizeBytes: new Blob([redactedData]).size,
      persisted: false,
      includeChat: true,
      includeRun: true,
      csvText: redactedData,
      excludedColumns: autoRedactedColumns,
    }

    const existingIndex = datasets.findIndex(d => d.fileName === complianceReviewData.fileName && d.persisted && !d.csvText)
    if (existingIndex >= 0) {
      const updated = [...datasets]
      updated[existingIndex] = item
      notifyChange(updated)
    } else {
      notifyChange([...(datasets || []), item])
    }

    setComplianceReviewData(null)
  }

  const handleComplianceEdit = (redactedData: string, autoRedactedColumns: string[]) => {
    if (!complianceReviewData) return

    setDataEditorData({
      originalData: redactedData,
      fileName: complianceReviewData.fileName,
      autoRedactedColumns
    })

    setComplianceReviewData(null)
  }

  const handleComplianceCancel = () => {
    setComplianceReviewData(null)
  }

  const handleUploadChoice = (choice: 'compliance' | 'editor' | 'direct') => {
    if (!uploadChoiceData) return

    if (choice === 'compliance') {
      setComplianceReviewData({
        originalData: uploadChoiceData.originalData,
        fileName: uploadChoiceData.fileName,
        manuallyRemovedColumns: []
      })
    } else if (choice === 'editor') {
      setDataEditorData({
        originalData: uploadChoiceData.originalData,
        fileName: uploadChoiceData.fileName
      })
    } else {
      const item: DatasetItem = {
        id: `ephemeral_${Date.now()}_${Math.random().toString(36).slice(2)}`,
        fileName: uploadChoiceData.fileName,
        sizeBytes: new Blob([uploadChoiceData.originalData]).size,
        persisted: false,
        includeChat: true,
        includeRun: true,
        csvText: uploadChoiceData.originalData,
        excludedColumns: []
      }

      const existingIndex = datasets.findIndex(d => d.fileName === uploadChoiceData.fileName && d.persisted && !d.csvText)
      if (existingIndex >= 0) {
        const updated = [...datasets]
        updated[existingIndex] = item
        notifyChange(updated)
      } else {
        notifyChange([...(datasets || []), item])
      }
    }

    setUploadChoiceData(null)
  }

  const handleUploadChoiceCancel = () => {
    setUploadChoiceData(null)
  }

  const handleSelectFiles = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const all = Array.from(e.target.files || [])
    if (all.length === 0) return

    if (all.length > 0) {
      await handleLocalAdd(all[0])
      if (all.length > 1) {
        alert(`Files are processed one at a time. Please upload the remaining ${all.length - 1} file(s) separately after completing your choice.`)
      }
    }

    if (inputRef.current) inputRef.current.value = ''
  }

  const handlePreviewOpen = (item: DatasetItem) => {
    setPreviewViewMode(privacyMode ? 'randomized' : 'original')
    setPreviewItem(item)
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
      {hipaaCompliant && (
        <div className="mb-3 p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30 border border-blue-300 dark:border-blue-700">
          <div className="flex items-center gap-2">
            <Shield className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            <span className="text-xs font-semibold text-blue-800 dark:text-blue-300">
              NIST Compliance Mode Active
            </span>
            <span className="text-xs text-blue-600 dark:text-blue-400">
              - Compliance review available for uploaded files
            </span>
          </div>
        </div>
      )}

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
            <div className={`w-full inline-flex items-center justify-center whitespace-nowrap rounded-xl text-sm font-medium transition-all duration-200 border-2 border-dashed border-rstudio/30 bg-white dark:bg-gray-700 text-rstudio dark:text-white h-12 px-4 py-2 ${
              canAddMore
                ? 'hover:bg-rstudio/5 dark:hover:bg-rstudio/10 hover:scale-105 active:scale-95'
                : 'opacity-50 cursor-not-allowed'
            }`}>
              <Upload className="h-5 w-5 mr-2" />
              <span className="font-semibold">Add CSV</span>
            </div>
          </label>
        </div>
        <div className="text-xs text-gray-600 dark:text-gray-400 min-w-[160px] text-right">
          {selectedCounts.chat} in Chat • {selectedCounts.run} in Run
        </div>
      </div>

      {datasets.some(d => d.persisted && !d.csvText) && (
        <div className="mt-2 p-2 rounded-lg bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800">
          <p className="text-xs text-yellow-800 dark:text-yellow-300">
            💡 <strong>Files needed:</strong> These files were previously uploaded to this project. Please re-upload them to use them again.
          </p>
        </div>
      )}

      {datasets.length > 0 && (
        <div className="mt-3">
          <div className="flex items-center gap-2 mb-2">
            <Upload className="w-4 h-4 text-gray-600 dark:text-gray-400" />
            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">Your Datasets</h3>
          </div>
          <div className="space-y-2">
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
        </div>
      )}

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

      {dataEditorData && (
        <CSVDataEditor
          originalData={dataEditorData.originalData}
          fileName={dataEditorData.fileName}
          autoRedactedColumns={dataEditorData.autoRedactedColumns}
          onConfirm={handleDataEditorConfirm}
          onCancel={handleDataEditorCancel}
        />
      )}

      {complianceReviewData && (
        <ComplianceReviewModal
          originalData={complianceReviewData.originalData}
          fileName={complianceReviewData.fileName}
          onConfirm={handleComplianceConfirm}
          onEdit={handleComplianceEdit}
          onCancel={handleComplianceCancel}
        />
      )}

      {uploadChoiceData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={handleUploadChoiceCancel}></div>
          <div className="relative bg-white dark:bg-gray-800 rounded-xl shadow-2xl border-2 border-gray-200 dark:border-gray-700 w-[90vw] max-w-2xl p-6">
            <div className="flex items-start gap-3 mb-6">
              <div className="flex-shrink-0 w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                <Upload className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                  How would you like to process this file?
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  <strong className="text-gray-900 dark:text-white">{uploadChoiceData.fileName}</strong>
                </p>
              </div>
            </div>

            <div className="space-y-3 mb-6">
              {hipaaCompliant && (
                <button
                  onClick={() => handleUploadChoice('compliance')}
                  className="w-full p-4 rounded-lg border-2 border-blue-200 dark:border-blue-700 bg-white dark:bg-gray-900 hover:border-blue-400 dark:hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all text-left group"
                >
                  <div className="flex items-start gap-3">
                    <Shield className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-1 flex-shrink-0" />
                    <div>
                      <h4 className="font-semibold text-gray-900 dark:text-white mb-1">
                        Compliance Review (Recommended for NIST)
                      </h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Automatically detect and redact PHI (names, SSNs, DOBs, etc.), then manually review if needed.
                      </p>
                    </div>
                  </div>
                </button>
              )}

              <button
                onClick={() => handleUploadChoice('editor')}
                className="w-full p-4 rounded-lg border-2 border-purple-200 dark:border-purple-700 bg-white dark:bg-gray-900 hover:border-purple-400 dark:hover:border-purple-500 hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-all text-left group"
              >
                <div className="flex items-start gap-3">
                  <Eye className="w-5 h-5 text-purple-600 dark:text-purple-400 mt-1 flex-shrink-0" />
                  <div>
                    <h4 className="font-semibold text-gray-900 dark:text-white mb-1">
                      Manual Editor
                    </h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Manually select which columns or rows to remove before uploading.
                    </p>
                  </div>
                </div>
              </button>

              <button
                onClick={() => handleUploadChoice('direct')}
                className="w-full p-4 rounded-lg border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 hover:border-gray-400 dark:hover:border-gray-500 hover:bg-gray-50 dark:hover:bg-gray-800 transition-all text-left group"
              >
                <div className="flex items-start gap-3">
                  <Upload className="w-5 h-5 text-gray-600 dark:text-gray-400 mt-1 flex-shrink-0" />
                  <div>
                    <h4 className="font-semibold text-gray-900 dark:text-white mb-1">
                      Upload As-Is
                    </h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Upload the file without any modifications or reviews.
                    </p>
                  </div>
                </div>
              </button>
            </div>

            <div className="flex items-center justify-end">
              <Button
                variant="outline"
                onClick={handleUploadChoiceCancel}
                className="px-4 bg-white dark:bg-gray-900 hover:bg-gray-100 dark:hover:bg-gray-800 border-gray-300 dark:border-gray-600"
              >
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
