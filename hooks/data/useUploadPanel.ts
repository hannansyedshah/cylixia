'use client'

import { useMemo, useRef, useState, useCallback } from 'react'
import { saveDataset, deleteDataset } from '@/lib/db/csvUpload'
import type { DatasetItem } from '@/types/dataset'

interface UseUploadPanelOptions {
  datasets: DatasetItem[]
  onDatasetsChange?: (datasets: DatasetItem[]) => void
  privacyMode?: boolean
  projectId?: string
}

export function useUploadPanel({
  datasets,
  onDatasetsChange,
  privacyMode = true,
  projectId
}: UseUploadPanelOptions) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [previewItem, setPreviewItem] = useState<DatasetItem | null>(null)
  const [previewViewMode, setPreviewViewMode] = useState<'original' | 'randomized'>('randomized')
  const [dataEditorData, setDataEditorData] = useState<{ originalData: string; fileName: string; autoRedactedColumns?: string[] } | null>(null)
  const [complianceReviewData, setComplianceReviewData] = useState<{ originalData: string; fileName: string; manuallyRemovedColumns: string[] } | null>(null)
  const [uploadChoiceData, setUploadChoiceData] = useState<{ originalData: string; fileName: string } | null>(null)
  const [savingId, setSavingId] = useState<string | null>(null)

  const canAddMore = datasets.length < 5

  const selectedCounts = useMemo(() => ({
    chat: datasets.filter(i => i.includeChat).length,
    run: datasets.filter(i => i.includeRun).length,
  }), [datasets])

  const notifyChange = useCallback((next: DatasetItem[]) => {
    onDatasetsChange?.(next)
  }, [onDatasetsChange])

  const handleLocalAdd = useCallback(async (file: File) => {
    if (!file.name.toLowerCase().endsWith('.csv')) return alert('Only .csv files are allowed')
    if (file.size > 10 * 1024 * 1024) return alert('File too large (max 10MB)')

    const text = await file.text()
    setUploadChoiceData({ originalData: text, fileName: file.name })
  }, [])

  const handleDataEditorConfirm = useCallback((editedData: string, removedColumns: string[]) => {
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
      notifyChange([...datasets, item])
    }

    setDataEditorData(null)
  }, [dataEditorData, datasets, notifyChange])

  const handleDataEditorCancel = useCallback(() => {
    setDataEditorData(null)
  }, [])

  const handleComplianceConfirm = useCallback((redactedData: string, autoRedactedColumns: string[]) => {
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
      notifyChange([...datasets, item])
    }

    setComplianceReviewData(null)
  }, [complianceReviewData, datasets, notifyChange])

  const handleComplianceEdit = useCallback((redactedData: string, autoRedactedColumns: string[]) => {
    if (!complianceReviewData) return

    setDataEditorData({
      originalData: redactedData,
      fileName: complianceReviewData.fileName,
      autoRedactedColumns
    })

    setComplianceReviewData(null)
  }, [complianceReviewData])

  const handleComplianceCancel = useCallback(() => {
    setComplianceReviewData(null)
  }, [])

  const handleUploadChoice = useCallback((choice: 'compliance' | 'editor' | 'direct') => {
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
        notifyChange([...datasets, item])
      }
    }

    setUploadChoiceData(null)
  }, [uploadChoiceData, datasets, notifyChange])

  const handleUploadChoiceCancel = useCallback(() => {
    setUploadChoiceData(null)
  }, [])

  const handleSelectFiles = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const all = Array.from(e.target.files || [])
    if (all.length === 0) return

    if (all.length > 0) {
      await handleLocalAdd(all[0])
      if (all.length > 1) {
        alert(`Files are processed one at a time. Please upload the remaining ${all.length - 1} file(s) separately after completing your choice.`)
      }
    }

    if (inputRef.current) inputRef.current.value = ''
  }, [handleLocalAdd])

  const handlePreviewOpen = useCallback((item: DatasetItem) => {
    setPreviewViewMode(privacyMode ? 'randomized' : 'original')
    setPreviewItem(item)
  }, [privacyMode])

  const handlePreviewClose = useCallback(() => {
    setPreviewItem(null)
  }, [])

  const removeItem = useCallback(async (id: string) => {
    const item = datasets.find(i => i.id === id)
    if (item?.persisted) {
      await deleteDataset(id)
    }
    const next = datasets.filter(i => i.id !== id)
    notifyChange(next)
  }, [datasets, notifyChange])

  const toggleFlag = useCallback((id: string, key: 'includeChat' | 'includeRun') => {
    const next = datasets.map(i => i.id === id ? { ...i, [key]: !i[key] } : i)
    notifyChange(next)
  }, [datasets, notifyChange])

  const handleSaveToCloud = useCallback(async (item: DatasetItem) => {
    if (!projectId || !item.csvText || item.persisted) return

    setSavingId(item.id)
    try {
      const result = await saveDataset({
        projectId,
        fileName: item.fileName,
        csvText: item.csvText
      })

      if (!result) throw new Error('Failed to save')

      const next = datasets.map(i =>
        i.id === item.id ? { ...i, id: result.id, persisted: true } : i
      )
      notifyChange(next)
    } catch (err: any) {
      alert(err.message || 'Failed to save')
    } finally {
      setSavingId(null)
    }
  }, [projectId, datasets, notifyChange])

  return {
    // Refs
    inputRef,

    // State
    previewItem,
    previewViewMode,
    setPreviewViewMode,
    dataEditorData,
    complianceReviewData,
    uploadChoiceData,
    savingId,

    // Computed
    canAddMore,
    selectedCounts,

    // Handlers
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
  }
}
