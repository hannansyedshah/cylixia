'use client'

import { Upload, X, Eye, Shield, Cloud, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { DataPreview } from './DataPreview'
import { ComplianceReviewModal } from './ComplianceReviewModal'
import { CSVDataEditor } from './CSVDataEditor'
import { useUploadPanel } from '@/hooks/data/useUploadPanel'
import type { DatasetItem } from '@/types/dataset'

interface UploadPanelProps {
  datasets: DatasetItem[]
  onDatasetsChange?: (datasets: DatasetItem[]) => void
  privacyMode?: boolean
  hipaaCompliant?: boolean
  projectId?: string
}

export function UploadPanel({
  datasets,
  onDatasetsChange,
  privacyMode = true,
  hipaaCompliant = false,
  projectId,
}: UploadPanelProps) {
  const {
    inputRef,
    previewItem,
    previewViewMode,
    setPreviewViewMode,
    dataEditorData,
    complianceReviewData,
    uploadChoiceData,
    savingId,
    canAddMore,
    selectedCounts,
    handleSelectFiles,
    handlePreviewOpen,
    handlePreviewClose,
    handleDataEditorConfirm,
    handleDataEditorCancel,
    handleComplianceConfirm,
    handleComplianceEdit,
    handleComplianceCancel,
    handleUploadChoice,
    handleUploadChoiceCancel,
    removeItem,
    toggleFlag,
    handleSaveToCloud
  } = useUploadPanel({ datasets, onDatasetsChange, privacyMode, projectId })

  return (
    <div className="p-3 rounded-xl bg-zinc-800/50 border border-zinc-700">
      {hipaaCompliant && (
        <div className="mb-3 p-2 rounded-lg bg-teal-500/10 border border-teal-500/30">
          <div className="flex items-center gap-2">
            <Shield className="h-4 w-4 text-teal-400" />
            <span className="text-xs font-semibold text-teal-300">
              NIST Compliance Mode Active
            </span>
            <span className="text-xs text-teal-400/80">
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
            <div className={`w-full inline-flex items-center justify-center whitespace-nowrap rounded-xl text-sm font-medium transition-all duration-200 border-2 border-dashed border-emerald-500/30 bg-zinc-800 text-emerald-400 h-12 px-4 py-2 ${
              canAddMore
                ? 'hover:bg-emerald-500/10 hover:border-emerald-500/50 hover:scale-105 active:scale-95'
                : 'opacity-50 cursor-not-allowed'
            }`}>
              <Upload className="h-5 w-5 mr-2" />
              <span className="font-semibold">Add CSV</span>
            </div>
          </label>
        </div>
        <div className="text-xs text-zinc-400 min-w-[160px] text-right">
          {selectedCounts.chat} in Chat • {selectedCounts.run} in Run
        </div>
      </div>

      {datasets.some(d => d.persisted && !d.csvText) && (
        <div className="mt-2 p-2 rounded-lg bg-yellow-500/10 border border-yellow-500/30">
          <p className="text-xs text-yellow-400">
            <strong>Files needed:</strong> These files were previously uploaded to this project. Please re-upload them to use them again.
          </p>
        </div>
      )}

      {datasets.length > 0 && (
        <div className="mt-3">
          <div className="flex items-center gap-2 mb-2">
            <Upload className="w-4 h-4 text-zinc-400" />
            <h3 className="text-sm font-semibold text-zinc-300">Your Datasets</h3>
          </div>
          <div className="space-y-2">
            {datasets.map(item => {
              const isPlaceholder = item.persisted && !item.csvText
              return (
                <div key={item.id} className={`flex items-center gap-2 p-2 rounded-lg border ${
                  isPlaceholder
                    ? 'bg-yellow-500/10 border-yellow-500/30'
                    : 'bg-zinc-800/50 border-zinc-700'
                }`}>
                  <span className={`inline-flex items-center max-w-[40%] truncate px-2 py-1 rounded-full text-xs font-medium ${
                    isPlaceholder
                      ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'
                      : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                  }`}>
                    {isPlaceholder ? '⚠️' : '📊'} <span className="ml-1 truncate">{item.fileName}</span>
                  </span>
                  {item.sizeBytes > 0 && (
                    <span className="text-[10px] text-zinc-500">{(item.sizeBytes/1024).toFixed(1)} KB</span>
                  )}
                  {isPlaceholder ? (
                    <span className="text-xs text-yellow-400 font-medium">
                      Re-upload needed
                    </span>
                  ) : (
                    <>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handlePreviewOpen(item)}
                        className="h-7 px-2 bg-zinc-800 border-zinc-700 text-zinc-300 hover:bg-zinc-700 hover:text-white"
                      >
                        <Eye className="h-3.5 w-3.5 mr-1" /> Preview
                      </Button>
                      {projectId && !item.persisted && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleSaveToCloud(item)}
                          disabled={savingId === item.id}
                          className="h-7 px-2 bg-zinc-800 border-zinc-700 text-zinc-300 hover:bg-zinc-700 hover:text-white"
                        >
                          {savingId === item.id ? (
                            <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" />
                          ) : (
                            <Cloud className="h-3.5 w-3.5 mr-1" />
                          )}
                          Save
                        </Button>
                      )}
                      {item.persisted && (
                        <span className="text-xs text-emerald-400 font-medium flex items-center gap-1">
                          <Cloud className="h-3 w-3" /> Saved
                        </span>
                      )}
                    </>
                  )}
                  <label className="ml-auto text-xs flex items-center gap-1 text-zinc-400">
                    <input type="checkbox" checked={item.includeChat} onChange={() => toggleFlag(item.id, 'includeChat')} disabled={isPlaceholder} className="rounded border-zinc-600 bg-zinc-700 text-emerald-500" /> Chat
                  </label>
                  <label className="text-xs flex items-center gap-1 text-zinc-400">
                    <input type="checkbox" checked={item.includeRun} onChange={() => toggleFlag(item.id, 'includeRun')} disabled={isPlaceholder} className="rounded border-zinc-600 bg-zinc-700 text-emerald-500" /> Run
                  </label>
                  <Button variant="ghost" size="icon" onClick={() => removeItem(item.id)} className="h-7 w-7 hover:bg-red-500/20 text-red-400">
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {previewItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={handlePreviewClose}></div>
          <div className="relative bg-zinc-900 rounded-xl shadow-2xl border border-zinc-800 w-[95vw] max-w-7xl h-[90vh] p-4 flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
              <div className="text-sm font-semibold text-white truncate">{previewItem.fileName}</div>
              <div className="flex items-center gap-2">
                <Button
                  variant={previewViewMode === 'randomized' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setPreviewViewMode(previewViewMode === 'randomized' ? 'original' : 'randomized')}
                  className={previewViewMode === 'randomized'
                    ? 'text-xs bg-emerald-500 hover:bg-emerald-400 text-black'
                    : 'text-xs bg-zinc-800 border-zinc-700 text-zinc-300 hover:bg-zinc-700 hover:text-white'
                  }
                >
                  {previewViewMode === 'randomized' ? '🔒 Randomized' : '🔓 Original'}
                </Button>
                <Button variant="ghost" size="icon" onClick={handlePreviewClose} className="text-zinc-400 hover:text-white hover:bg-zinc-800">
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
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={handleUploadChoiceCancel}></div>
          <div className="relative bg-zinc-900 rounded-xl shadow-2xl border border-zinc-800 w-[90vw] max-w-2xl p-6">
            <div className="flex items-start gap-3 mb-6">
              <div className="flex-shrink-0 w-12 h-12 rounded-full bg-emerald-500/20 flex items-center justify-center">
                <Upload className="w-6 h-6 text-emerald-400" />
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-semibold text-white mb-2">
                  How would you like to process this file?
                </h3>
                <p className="text-sm text-zinc-400">
                  <strong className="text-white">{uploadChoiceData.fileName}</strong>
                </p>
              </div>
            </div>

            <div className="space-y-3 mb-6">
              {hipaaCompliant && (
                <button
                  onClick={() => handleUploadChoice('compliance')}
                  className="w-full p-4 rounded-lg border border-teal-500/30 bg-zinc-800/50 hover:border-teal-500/50 hover:bg-teal-500/10 transition-all text-left group"
                >
                  <div className="flex items-start gap-3">
                    <Shield className="w-5 h-5 text-teal-400 mt-1 flex-shrink-0" />
                    <div>
                      <h4 className="font-semibold text-white mb-1">
                        Compliance Review (Recommended for NIST)
                      </h4>
                      <p className="text-sm text-zinc-400">
                        Automatically detect and redact PHI (names, SSNs, DOBs, etc.), then manually review if needed.
                      </p>
                    </div>
                  </div>
                </button>
              )}

              <button
                onClick={() => handleUploadChoice('editor')}
                className="w-full p-4 rounded-lg border border-emerald-500/30 bg-zinc-800/50 hover:border-emerald-500/50 hover:bg-emerald-500/10 transition-all text-left group"
              >
                <div className="flex items-start gap-3">
                  <Eye className="w-5 h-5 text-emerald-400 mt-1 flex-shrink-0" />
                  <div>
                    <h4 className="font-semibold text-white mb-1">
                      Manual Editor
                    </h4>
                    <p className="text-sm text-zinc-400">
                      Manually select which columns or rows to remove before uploading.
                    </p>
                  </div>
                </div>
              </button>

              <button
                onClick={() => handleUploadChoice('direct')}
                className="w-full p-4 rounded-lg border border-zinc-700 bg-zinc-800/50 hover:border-zinc-600 hover:bg-zinc-800 transition-all text-left group"
              >
                <div className="flex items-start gap-3">
                  <Upload className="w-5 h-5 text-zinc-400 mt-1 flex-shrink-0" />
                  <div>
                    <h4 className="font-semibold text-white mb-1">
                      Upload As-Is
                    </h4>
                    <p className="text-sm text-zinc-400">
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
                className="px-4 bg-zinc-800 border-zinc-700 text-zinc-300 hover:bg-zinc-700 hover:text-white"
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
