'use client'

import { useMemo, useRef, useState } from 'react'
import { Upload, X, Eye, Share2, Users, Plus, Shield } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { DataPreview } from '@/components/DataPreview'
import { UserAvatar } from './UserAvatar'
import { ComplianceReviewModal } from './ComplianceReviewModal'
import { CSVDataEditor } from './CSVDataEditor'
import { redactPHI } from '@/lib/phiRedactor'

interface DatasetItem {
  id: string
  fileName: string
  sizeBytes: number
  persisted: boolean
  includeChat: boolean
  includeRun: boolean
  csvText?: string // present for ephemeral items
  excludedColumns?: string[] // columns that were excluded/redacted (for HIPAA)
}

interface SharedDataset {
  id: string
  project_id: string
  user_id: string
  file_name: string
  csv_text: string
  size_bytes: number
  include_chat: boolean
  include_run: boolean
  created_at: string
  profiles?: {
    id: string
    display_name: string | null
    avatar_url: string | null
  } | null
}

interface UploadPanelProps {
  datasets: DatasetItem[]
  sharedDatasets?: SharedDataset[]
  onDatasetsChange?: (datasets: DatasetItem[]) => void
  onSharedDatasetsChange?: (datasets: SharedDataset[]) => void
  privacyMode?: boolean
  hipaaCompliant?: boolean
  projectId?: string
  userRole?: 'owner' | 'edit' | 'view'
  currentUserId?: string
  onShareDataset?: (dataset: DatasetItem) => Promise<void>
  onRemoveSharedDataset?: (datasetId: string) => Promise<void>
  onSharedDatasetPreferenceChange?: (datasetId: string, type: 'chat' | 'run', value: boolean) => void
  sharedDatasetPreferences?: Record<string, { includeChat: boolean; includeRun: boolean }>
}

export function UploadPanel({ 
  datasets, 
  sharedDatasets = [],
  onDatasetsChange, 
  onSharedDatasetsChange,
  privacyMode = true,
  hipaaCompliant = false,
  projectId,
  userRole,
  currentUserId,
  onShareDataset,
  onRemoveSharedDataset,
  onSharedDatasetPreferenceChange,
  sharedDatasetPreferences = {}
}: UploadPanelProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [previewItem, setPreviewItem] = useState<DatasetItem | null>(null)
  const [pendingFiles, setPendingFiles] = useState<File[] | null>(null)
  const [previewViewMode, setPreviewViewMode] = useState<'original' | 'randomized'>('randomized')
  const [shareWithCollaborators, setShareWithCollaborators] = useState(false)
  const [sharingDatasetId, setSharingDatasetId] = useState<string | null>(null)
  const [removingDatasetId, setRemovingDatasetId] = useState<string | null>(null)
  const [showShareConfirm, setShowShareConfirm] = useState(false)
  const [pendingShareDataset, setPendingShareDataset] = useState<DatasetItem | null>(null)
  const [dontShowShareConfirm, setDontShowShareConfirm] = useState(false)
  const [dataEditorData, setDataEditorData] = useState<{ originalData: string; fileName: string } | null>(null)
  const [complianceReviewData, setComplianceReviewData] = useState<{ originalData: string; fileName: string; manuallyRemovedColumns: string[] } | null>(null)
  
  // Allow sharing for project owners and collaborators with 'owner' or 'edit' role
  const canShare = userRole === 'owner' || userRole === 'edit'
  

  const canAddMore = datasets.length < 5
  const selectedCounts = useMemo(() => ({
    chat: datasets.filter(i => i.includeChat).length,
    run: datasets.filter(i => i.includeRun).length,
  }), [datasets])

  const notifyChange = (next: DatasetItem[]) => {
    onDatasetsChange?.(next)
  }

  const handleLocalAdd = async (file: File, shouldShare: boolean = false) => {
    // Prevent file upload for view-only users
    if (userRole === 'view') {
      alert('View-only access: You cannot upload files.')
      return
    }
    
    if (!file.name.toLowerCase().endsWith('.csv')) return alert('Only .csv files are allowed')
    if (file.size > 10 * 1024 * 1024) return alert('File too large (max 10MB)')

    const text = await file.text()
    
    // ALWAYS show data editor first for manual column/row removal
    setDataEditorData({ originalData: text, fileName: file.name })
  }
  
  // Handle data editor confirmation (manual column/row removal)
  const handleDataEditorConfirm = (editedData: string, removedColumns: string[]) => {
    if (!dataEditorData) return
    
    // If HIPAA mode, proceed to compliance review with edited data
    if (hipaaCompliant) {
      setComplianceReviewData({ 
        originalData: editedData, 
        fileName: dataEditorData.fileName,
        manuallyRemovedColumns: removedColumns
      })
      setDataEditorData(null)
      return
    }
    
    // Otherwise, add directly to datasets
    const item: DatasetItem = {
      id: `ephemeral_${Date.now()}_${Math.random().toString(36).slice(2)}`,
      fileName: dataEditorData.fileName,
      sizeBytes: new Blob([editedData]).size,
      persisted: false,
      includeChat: true,
      includeRun: true,
      csvText: editedData,
      excludedColumns: removedColumns,
    }
    
    // Check if there's a placeholder with the same file name
    const existingIndex = datasets.findIndex(d => d.fileName === dataEditorData.fileName && d.persisted && !d.csvText)
    if (existingIndex >= 0) {
      // Replace the placeholder with the actual file
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

  // Handle HIPAA compliance review confirmation (automatic PHI redaction)
  const handleComplianceConfirm = (redactedData: string, autoRedactedColumns: string[]) => {
    if (!complianceReviewData) return
    
    // Combine manually removed columns with auto-redacted columns
    const allExcludedColumns = [...new Set([
      ...(complianceReviewData.manuallyRemovedColumns || []),
      ...autoRedactedColumns
    ])]
    
    // Create dataset item with redacted data only
    const item: DatasetItem = {
      id: `ephemeral_${Date.now()}_${Math.random().toString(36).slice(2)}`,
      fileName: complianceReviewData.fileName,
      sizeBytes: new Blob([redactedData]).size,
      persisted: false,
      includeChat: true,
      includeRun: true,
      csvText: redactedData, // Only store redacted version
      excludedColumns: allExcludedColumns, // Store all excluded columns
    }
    
    // Check if there's a placeholder with the same file name
    const existingIndex = datasets.findIndex(d => d.fileName === complianceReviewData.fileName && d.persisted && !d.csvText)
    if (existingIndex >= 0) {
      // Replace the placeholder with the redacted file
      const updated = [...datasets]
      updated[existingIndex] = item
      notifyChange(updated)
    } else {
      notifyChange([...(datasets || []), item])
    }
    
    // Clear compliance review data
    setComplianceReviewData(null)
  }
  
  const handleComplianceCancel = () => {
    setComplianceReviewData(null)
  }

  const fileToItem = async (file: File): Promise<DatasetItem | null> => {
    if (!file.name.toLowerCase().endsWith('.csv')) { alert('Only .csv files are allowed'); return null }
    if (file.size > 10 * 1024 * 1024) { alert('File too large (max 10MB)'); return null }
    const text = await file.text()
    
    // If HIPAA compliant mode, we'll handle it in handleSelectFiles
    // This function is used for batch processing, so we'll let handleLocalAdd handle compliance
    if (hipaaCompliant) {
      // For batch files, we'll process them one by one through handleLocalAdd
      return null
    }
    
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
    // Prevent file upload for view-only users
    if (userRole === 'view') {
      e.preventDefault()
      alert('View-only access: You cannot upload files.')
      if (inputRef.current) inputRef.current.value = ''
      return
    }
    
    const all = Array.from(e.target.files || [])
    if (all.length === 0) return
    
    // If HIPAA compliant mode, process files one by one through handleLocalAdd
    // This ensures each file goes through compliance review
    if (hipaaCompliant) {
      // Process first file (others will be queued)
      if (all.length > 0) {
        await handleLocalAdd(all[0])
        // Note: Additional files will need to be processed after compliance review
        // For now, we'll process one at a time
        if (all.length > 1) {
          alert(`In compliance mode, files are processed one at a time. Please upload the remaining ${all.length - 1} file(s) separately after completing the review.`)
        }
      }
      if (inputRef.current) inputRef.current.value = ''
      return
    }
    
    // Normal flow for non-compliance mode
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
      await handleLocalAdd(f, shareWithCollaborators)
    }
    setPendingFiles(null)
    setShareWithCollaborators(false)
  }
  
  const handleShareDataset = async (dataset: DatasetItem) => {
    if (!canShare || !onShareDataset || !projectId) return
    
    // Check if user has opted to skip confirmation
    const skipConfirm = localStorage.getItem('skipShareDatasetConfirm') === 'true'
    
    if (!skipConfirm) {
      // Show confirmation dialog
      setPendingShareDataset(dataset)
      setShowShareConfirm(true)
      return
    }
    
    // Proceed with sharing
    await proceedWithShare(dataset)
  }
  
  const proceedWithShare = async (dataset: DatasetItem) => {
    if (!onShareDataset || !projectId) return
    
    setSharingDatasetId(dataset.id)
    try {
      await onShareDataset(dataset)
      setShowShareConfirm(false)
      setPendingShareDataset(null)
    } catch (error) {
      console.error('Failed to share dataset:', error)
      alert('Failed to share dataset with collaborators')
    } finally {
      setSharingDatasetId(null)
    }
  }
  
  const handleShareConfirm = async () => {
    if (!pendingShareDataset) return
    
    // Save "don't show again" preference
    if (dontShowShareConfirm) {
      localStorage.setItem('skipShareDatasetConfirm', 'true')
    }
    
    await proceedWithShare(pendingShareDataset)
    setDontShowShareConfirm(false)
  }
  
  const handleShareCancel = () => {
    setShowShareConfirm(false)
    setPendingShareDataset(null)
    setDontShowShareConfirm(false)
  }
  
  const toggleSharedDatasetPreference = (datasetId: string, type: 'chat' | 'run') => {
    const current = sharedDatasetPreferences[datasetId] || { includeChat: true, includeRun: true }
    const newValue = !current[type === 'chat' ? 'includeChat' : 'includeRun']
    onSharedDatasetPreferenceChange?.(datasetId, type, newValue)
  }
  
  const getSharedDatasetPreference = (datasetId: string, type: 'chat' | 'run'): boolean => {
    const prefs = sharedDatasetPreferences[datasetId]
    if (!prefs) {
      // Default to true if no preference set
      return true
    }
    return type === 'chat' ? prefs.includeChat : prefs.includeRun
  }
  
  const handleRemoveSharedDataset = async (datasetId: string) => {
    if (!onRemoveSharedDataset) return
    
    setRemovingDatasetId(datasetId)
    try {
      await onRemoveSharedDataset(datasetId)
    } catch (error) {
      console.error('Failed to remove shared dataset:', error)
      alert('Failed to remove shared dataset')
    } finally {
      setRemovingDatasetId(null)
    }
  }
  
  const handleRestoreSharedDataset = (sharedItem: SharedDataset) => {
    // Check if already in local datasets
    const alreadyExists = datasets.some(d => 
      d.fileName === sharedItem.file_name && d.csvText
    )
    
    if (alreadyExists) {
      return // Already in local datasets
    }
    
    // Check if we're at the limit
    const activeCount = datasets.filter(d => d.csvText).length
    if (activeCount >= 5) {
      alert('Maximum 5 datasets allowed. Please remove one first.')
      return
    }
    
    // Convert shared dataset to local dataset item
    const localItem: DatasetItem = {
      id: `ephemeral_${Date.now()}_${Math.random().toString(36).slice(2)}`,
      fileName: sharedItem.file_name,
      sizeBytes: sharedItem.size_bytes,
      persisted: false,
      includeChat: sharedItem.include_chat,
      includeRun: sharedItem.include_run,
      csvText: sharedItem.csv_text,
    }
    
    // Check if there's a placeholder with the same file name
    const placeholderIndex = datasets.findIndex(
      d => d.fileName === sharedItem.file_name && d.persisted && !d.csvText
    )
    
    if (placeholderIndex >= 0) {
      // Replace placeholder with the shared dataset
      const updated = [...datasets]
      updated[placeholderIndex] = localItem
      notifyChange(updated)
    } else {
      // Add new item
      notifyChange([...datasets, localItem])
    }
  }
  
  const handlePreviewOpen = (item: DatasetItem | SharedDataset) => {
    const csvText = 'csvText' in item 
      ? item.csvText 
      : (item as unknown as SharedDataset).csv_text
    const previewItem: DatasetItem = {
      id: item.id,
      fileName: 'file_name' in item 
        ? (item as unknown as SharedDataset).file_name 
        : item.fileName,
      sizeBytes: 'size_bytes' in item 
        ? (item as unknown as SharedDataset).size_bytes 
        : item.sizeBytes,
      persisted: true,
      includeChat: 'include_chat' in item 
        ? (item as unknown as SharedDataset).include_chat 
        : item.includeChat,
      includeRun: 'include_run' in item 
        ? (item as unknown as SharedDataset).include_run 
        : item.includeRun,
      csvText: csvText || undefined
    }
    setPreviewViewMode(privacyMode ? 'randomized' : 'original')
    setPreviewItem(previewItem)
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

  // Disable file upload for view-only users
  const isViewOnly = userRole === 'view'
  const canUpload = canAddMore && !isViewOnly

  return (
    <div className="p-3 border-b bg-gradient-to-r from-white to-blue-50/30 dark:from-gray-800 dark:to-blue-950/30">
      {/* Compliance Mode Indicator */}
      {hipaaCompliant && (
        <div className="mb-3 p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30 border border-blue-300 dark:border-blue-700">
          <div className="flex items-center gap-2">
            <Shield className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            <span className="text-xs font-semibold text-blue-800 dark:text-blue-300">
              HIPAA/NIST Compliance Mode Active
            </span>
            <span className="text-xs text-blue-600 dark:text-blue-400">
              - PHI will be automatically redacted
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
            disabled={isViewOnly}
          />
          <label 
            htmlFor="file-upload" 
            className={`flex-1 ${isViewOnly ? 'cursor-not-allowed' : 'cursor-pointer'}`}
            onClick={(e) => {
              if (isViewOnly) {
                e.preventDefault()
                e.stopPropagation()
              }
            }}
          >
            <div className={`w-full inline-flex items-center justify-center whitespace-nowrap rounded-xl text-sm font-medium transition-all duration-200 border-2 border-dashed border-rstudio/30 bg-white dark:bg-gray-700 text-rstudio dark:text-white h-12 px-4 py-2 ${
              isViewOnly 
                ? 'opacity-50 cursor-not-allowed' 
                : canAddMore 
                  ? 'hover:bg-rstudio/5 dark:hover:bg-rstudio/10 hover:scale-105 active:scale-95' 
                  : 'opacity-50 cursor-not-allowed'
            }`}>
              <Upload className="h-5 w-5 mr-2" />
              <span className="font-semibold">{isViewOnly ? 'View-only: File upload disabled' : 'Add CSV'}</span>
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

      {/* Info about saved files - only show if there are placeholders that aren't shared */}
      {datasets.some(d => {
        if (!d.persisted || d.csvText) return false
        // Don't show if file is shared (available as shared dataset, regardless of who uploaded it)
        const isShared = sharedDatasets.some(sd => sd.file_name === d.fileName)
        return !isShared
      }) && (
        <div className="mt-2 p-2 rounded-lg bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800">
          <p className="text-xs text-yellow-800 dark:text-yellow-300">
            💡 <strong>Files needed:</strong> These files were previously uploaded to this project. Please re-upload them to use them again.
          </p>
        </div>
      )}

      {/* Shared Datasets Section */}
      {sharedDatasets.length > 0 && (
        <div className="mt-3">
          <div className="flex items-center gap-2 mb-2">
            <Users className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">Shared Datasets</h3>
          </div>
          <div className="space-y-2">
            {sharedDatasets.map(item => {
              const isOwner = item.user_id === currentUserId
              const sharerName = item.profiles?.display_name || 'User'
              // Check if this shared dataset is already in local datasets
              const isInLocalDatasets = datasets.some(d => 
                d.fileName === item.file_name && d.csvText
              )
              return (
                <div key={item.id} className="flex items-center gap-2 p-2 rounded-lg border bg-green-50 dark:bg-green-900/10 border-green-200 dark:border-green-800">
                  <span className="inline-flex items-center max-w-[40%] truncate px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300 border border-green-300 dark:border-green-700">
                    <Share2 className="w-3 h-3 mr-1" />
                    <span className="truncate">{item.file_name}</span>
                  </span>
                  {item.size_bytes > 0 && (
                    <span className="text-[10px] text-gray-500">{(item.size_bytes/1024).toFixed(1)} KB</span>
                  )}
                  <div className="flex items-center gap-1 text-xs text-gray-600 dark:text-gray-400">
                    <UserAvatar
                      userId={item.user_id}
                      displayName={sharerName}
                      avatarUrl={item.profiles?.avatar_url}
                      size="xs"
                    />
                    <span className="truncate">by {sharerName}</span>
                  </div>
                  <Button size="sm" variant="outline" onClick={() => handlePreviewOpen(item)} className="h-7 px-2">
                    <Eye className="h-3.5 w-3.5 mr-1" /> Preview
                  </Button>
                  {!isInLocalDatasets && !isViewOnly && (
                    <Button 
                      size="sm" 
                      variant="outline" 
                      onClick={() => handleRestoreSharedDataset(item)} 
                      className="h-7 px-2 text-green-600 border-green-300 hover:bg-green-100 dark:hover:bg-green-900/20"
                      title="Add to My Datasets"
                    >
                      <Plus className="h-3.5 w-3.5 mr-1" /> Add
                    </Button>
                  )}
                  {isInLocalDatasets && (
                    <span className="text-xs text-green-600 dark:text-green-400 font-medium px-2">
                      ✓ Added
                    </span>
                  )}
                  <label className={`ml-auto text-xs flex items-center gap-1 ${isViewOnly ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}`}>
                    <input 
                      type="checkbox" 
                      checked={getSharedDatasetPreference(item.id, 'chat')} 
                      onChange={() => toggleSharedDatasetPreference(item.id, 'chat')}
                      disabled={isViewOnly}
                    /> Chat
                  </label>
                  <label className={`text-xs flex items-center gap-1 ${isViewOnly ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}`}>
                    <input 
                      type="checkbox" 
                      checked={getSharedDatasetPreference(item.id, 'run')} 
                      onChange={() => toggleSharedDatasetPreference(item.id, 'run')}
                      disabled={isViewOnly}
                    /> Run
                  </label>
                  {isOwner && onRemoveSharedDataset && (
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      onClick={() => handleRemoveSharedDataset(item.id)} 
                      disabled={removingDatasetId === item.id}
                      className="h-7 w-7 hover:bg-red-100 dark:hover:bg-red-900/20"
                    >
                      {removingDatasetId === item.id ? (
                        <div className="w-4 h-4 border-2 border-red-600 border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <X className="h-4 w-4 text-red-600" />
                      )}
                    </Button>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Local Datasets Section */}
      {datasets.length > 0 && (
        <div className={`mt-3 ${sharedDatasets.length > 0 ? 'border-t pt-3' : ''}`}>
          <div className="flex items-center gap-2 mb-2">
            <Upload className="w-4 h-4 text-gray-600 dark:text-gray-400" />
            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">Your Datasets</h3>
          </div>
          <div className="space-y-2">
            {datasets.map(item => {
              const isPlaceholder = item.persisted && !item.csvText
              const isShared = sharedDatasets.some(sd => sd.file_name === item.fileName)
              // Don't show placeholder styling if file is shared (available as shared dataset)
              const shouldShowPlaceholder = isPlaceholder && !isShared
              return (
                <div key={item.id} className={`flex items-center gap-2 p-2 rounded-lg border ${
                  shouldShowPlaceholder 
                    ? 'bg-yellow-50 dark:bg-yellow-900/10 border-yellow-300 dark:border-yellow-700' 
                    : 'bg-white dark:bg-gray-800'
                }`}>
                  <span className={`inline-flex items-center max-w-[40%] truncate px-2 py-1 rounded-full text-xs font-medium ${
                    shouldShowPlaceholder
                      ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300 border border-yellow-300 dark:border-yellow-700'
                      : 'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 border border-blue-200 dark:border-blue-700'
                  }`}>
                    {shouldShowPlaceholder ? '⚠️' : '📊'} <span className="ml-1 truncate">{item.fileName}</span>
                    {isShared && (
                      <span className="ml-1 px-1 py-0.5 rounded text-[10px] bg-green-500 text-white">Shared</span>
                    )}
                  </span>
                  {item.sizeBytes > 0 && (
                    <span className="text-[10px] text-gray-500">{(item.sizeBytes/1024).toFixed(1)} KB</span>
                  )}
                  {shouldShowPlaceholder ? (
                    <span className="text-xs text-yellow-700 dark:text-yellow-400 font-medium">
                      Re-upload needed
                    </span>
                  ) : (
                    <>
                      <Button size="sm" variant="outline" onClick={() => handlePreviewOpen(item)} className="h-7 px-2">
                        <Eye className="h-3.5 w-3.5 mr-1" /> Preview
                      </Button>
                      {canShare && !isShared && item.csvText && (
                        <Button 
                          size="sm" 
                          variant="outline" 
                          onClick={() => handleShareDataset(item)}
                          disabled={sharingDatasetId === item.id}
                          className="h-7 px-2"
                        >
                          {sharingDatasetId === item.id ? (
                            <div className="w-3 h-3 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                          ) : (
                            <>
                              <Share2 className="h-3.5 w-3.5 mr-1" /> Share
                            </>
                          )}
                        </Button>
                      )}
                    </>
                  )}
                  <label className="ml-auto text-xs flex items-center gap-1">
                    <input type="checkbox" checked={item.includeChat} onChange={() => toggleFlag(item.id, 'includeChat')} disabled={shouldShowPlaceholder || isViewOnly} /> Chat
                  </label>
                  <label className="text-xs flex items-center gap-1">
                    <input type="checkbox" checked={item.includeRun} onChange={() => toggleFlag(item.id, 'includeRun')} disabled={shouldShowPlaceholder || isViewOnly} /> Run
                  </label>
                  {!isViewOnly && (
                    <Button variant="ghost" size="icon" onClick={() => removeItem(item.id)} className="h-7 w-7 hover:bg-red-100 dark:hover:bg-red-900/20">
                      <X className="h-4 w-4 text-red-600" />
                    </Button>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Share Confirmation Dialog */}
      {showShareConfirm && pendingShareDataset && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50" onClick={handleShareCancel}></div>
          <div className="relative bg-white dark:bg-gray-900 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 w-[90vw] max-w-md p-6">
            <div className="flex items-start gap-3 mb-4">
              <div className="flex-shrink-0 w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                <Share2 className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  Share Dataset
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  You are sharing <strong>{pendingShareDataset.fileName}</strong> with everyone who has access to this project. The dataset is still stored safely and you can remove it at any time.
                </p>
              </div>
            </div>
            <div className="mb-4">
              <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300 cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={dontShowShareConfirm}
                  onChange={(e) => setDontShowShareConfirm(e.target.checked)}
                  className="rounded"
                />
                <span>Don&apos;t show this again</span>
              </label>
            </div>
            <div className="flex items-center justify-end gap-3">
              <Button 
                variant="outline" 
                onClick={handleShareCancel}
                className="px-4"
              >
                No
              </Button>
              <Button 
                onClick={handleShareConfirm}
                className="px-4 bg-blue-600 hover:bg-blue-700 text-white"
              >
                Yes, Share
              </Button>
            </div>
          </div>
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

      {/* CSV Data Editor Modal - for manual column/row removal */}
      {dataEditorData && (
        <CSVDataEditor
          originalData={dataEditorData.originalData}
          fileName={dataEditorData.fileName}
          onConfirm={handleDataEditorConfirm}
          onCancel={handleDataEditorCancel}
        />
      )}

      {/* Compliance Review Modal - for HIPAA automatic PHI redaction */}
      {complianceReviewData && (
        <ComplianceReviewModal
          originalData={complianceReviewData.originalData}
          fileName={complianceReviewData.fileName}
          onConfirm={handleComplianceConfirm}
          onCancel={handleComplianceCancel}
        />
      )}
    </div>
  )
}

