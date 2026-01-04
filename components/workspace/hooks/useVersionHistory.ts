import { useState, useEffect, useCallback } from 'react'
import { getVersions, saveVersion, restoreVersion as restoreVersionAction, deleteVersion } from '@/lib/db/versions'
import type { CodeVersion } from '@/types/database'

export interface CodeVersionWithProfile extends CodeVersion {
  profiles?: {
    id: string
    display_name: string | null
    avatar_url: string | null
  }
}

interface UseVersionHistoryProps {
  projectId: string
  currentCode: string
  currentPlotUrl?: string
  onVersionRestore?: (code: string, plotUrl?: string) => void
  onSaveVersion?: (code: string, plotUrl?: string, description?: string) => void
}

export function useVersionHistory({
  projectId,
  currentCode,
  currentPlotUrl,
  onVersionRestore,
  onSaveVersion
}: UseVersionHistoryProps) {
  const [versions, setVersions] = useState<CodeVersionWithProfile[]>([])
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState<string | null>(null)
  const [showHistory, setShowHistory] = useState(false)
  const [description, setDescription] = useState('')
  const [showDescriptionInput, setShowDescriptionInput] = useState(false)
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set())

  const loadVersions = useCallback(async () => {
    setLoading(true)
    try {
      const versionsData = await getVersions(projectId)
      setVersions(versionsData as CodeVersionWithProfile[])
    } catch (error) {
      console.error('Failed to load versions:', error)
    } finally {
      setLoading(false)
    }
  }, [projectId])

  useEffect(() => {
    if (showHistory) {
      loadVersions()
    }
  }, [showHistory, projectId, loadVersions])

  const saveCurrentVersion = useCallback(async () => {
    if (!currentCode.trim() || !onSaveVersion) return

    setSaving(true)
    try {
      const version = await saveVersion(projectId, {
        code: currentCode,
        plot_url: currentPlotUrl,
        description: description || `Version ${versions.length + 1}`
      })

      if (version) {
        setVersions(prev => [version as CodeVersionWithProfile, ...prev])
        setDescription('')
        setShowDescriptionInput(false)
        onSaveVersion(version.code, version.plot_url ?? undefined, version.description)
      }
    } catch (error) {
      console.error('Failed to save version:', error)
    } finally {
      setSaving(false)
    }
  }, [currentCode, currentPlotUrl, description, onSaveVersion, projectId, versions.length])

  const handleRestoreVersion = useCallback(async (versionId: string) => {
    if (!onVersionRestore) return

    try {
      const result = await restoreVersionAction(projectId, versionId)
      if (result) {
        onVersionRestore(result.code, result.plot_url ?? undefined)
        setShowHistory(false)
      }
    } catch (error) {
      console.error('Failed to restore version:', error)
    }
  }, [onVersionRestore, projectId])

  const handleDeleteVersion = useCallback(async (versionId: string) => {
    if (!confirm('Are you sure you want to delete this version? This will also delete any associated plots.')) {
      return
    }

    setDeleting(versionId)
    try {
      const success = await deleteVersion(versionId)
      if (success) {
        setVersions(prev => prev.filter(v => v.id !== versionId))
      }
    } catch (error) {
      console.error('Failed to delete version:', error)
    } finally {
      setDeleting(null)
    }
  }, [])

  const toggleExpanded = useCallback((id: string) => {
    setExpandedIds(prev => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }, [])

  const expandAll = useCallback(() => {
    setExpandedIds(new Set(versions.map(v => v.id)))
  }, [versions])

  const collapseAll = useCallback(() => {
    setExpandedIds(new Set())
  }, [])

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString()
  }

  const truncateCode = (code: string, maxLength: number = 100) => {
    return code.length > maxLength ? code.substring(0, maxLength) + '...' : code
  }

  const parsePlotUrls = (plotUrl?: string | null): string[] => {
    if (!plotUrl) return []
    try {
      const parsed = JSON.parse(plotUrl)
      if (Array.isArray(parsed)) {
        return parsed
      }
      return [plotUrl]
    } catch {
      return [plotUrl]
    }
  }

  return {
    versions,
    loading,
    saving,
    deleting,
    showHistory,
    setShowHistory,
    description,
    setDescription,
    showDescriptionInput,
    setShowDescriptionInput,
    expandedIds,
    saveCurrentVersion,
    handleRestoreVersion,
    handleDeleteVersion,
    toggleExpanded,
    expandAll,
    collapseAll,
    formatDate,
    truncateCode,
    parsePlotUrls,
    canSave: !!onSaveVersion,
    canRestore: !!onVersionRestore
  }
}
