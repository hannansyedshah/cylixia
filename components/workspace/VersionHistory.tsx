'use client'

import { useState, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { History, RotateCcw, Save, Eye, Clock, ChevronDown, ChevronRight, ChevronLeft } from 'lucide-react'
import { getVersions, saveVersion, restoreVersion as restoreVersionAction } from '@/lib/db/versions'
import type { CodeVersion } from '@/types/database'

// Extended CodeVersion with profile relation for display
interface CodeVersionWithProfile extends CodeVersion {
  profiles?: {
    id: string
    display_name: string | null
    avatar_url: string | null
  }
}

interface VersionHistoryProps {
  projectId: string
  currentCode: string
  currentPlotUrl?: string
  onVersionRestore?: (code: string, plotUrl?: string) => void
  onSaveVersion?: (code: string, plotUrl?: string, description?: string) => void
}

// Component for displaying multiple plots with scroll navigation
function PlotGallery({ plotUrls, versionNumber }: { plotUrls: string[], versionNumber: number }) {
  const [currentIndex, setCurrentIndex] = useState(0)

  // Reset index when plotUrls change (e.g., switching versions)
  useEffect(() => {
    setCurrentIndex(0)
  }, [plotUrls.length, versionNumber])

  if (plotUrls.length === 0) {
    return (
      <div className="p-3 text-xs text-gray-500">No plot for this version.</div>
    )
  }

  if (plotUrls.length === 1) {
    return (
      <div className="p-2 flex items-center justify-center bg-white">
        <img
          src={plotUrls[0]}
          alt={`Plot for version ${versionNumber}`}
          className="max-h-60 object-contain"
        />
      </div>
    )
  }

  // Multiple plots - show scrollable gallery
  const goToPrevious = () => {
    setCurrentIndex((prev) => (prev === 0 ? plotUrls.length - 1 : prev - 1))
  }

  const goToNext = () => {
    setCurrentIndex((prev) => (prev === plotUrls.length - 1 ? 0 : prev + 1))
  }

  return (
    <div className="relative bg-white">
      {/* Plot Display Area */}
      <div className="p-2 flex items-center justify-center min-h-[240px] max-h-60 relative">
        <img
          key={currentIndex}
          src={plotUrls[currentIndex]}
          alt={`Plot ${currentIndex + 1} of ${plotUrls.length} for version ${versionNumber}`}
          className="max-h-[232px] object-contain animate-fade-in"
        />
      </div>

      {/* Navigation Controls */}
      <div className="border-t border-gray-200 bg-gray-50 px-2 py-2 flex items-center justify-between">
        {/* Previous Button */}
        <Button
          variant="ghost"
          size="sm"
          onClick={goToPrevious}
          className="h-7 w-7 p-0"
          aria-label="Previous plot"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>

        {/* Plot Indicator */}
        <div className="flex items-center space-x-2">
          <span className="text-xs text-gray-600">
            {currentIndex + 1} / {plotUrls.length}
          </span>
          {/* Dot indicators */}
          <div className="flex space-x-1">
            {plotUrls.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentIndex(index)}
                className={`w-1.5 h-1.5 rounded-full transition-colors ${
                  index === currentIndex
                    ? 'bg-rstudio'
                    : 'bg-gray-300'
                }`}
                aria-label={`Go to plot ${index + 1}`}
              />
            ))}
          </div>
        </div>

        {/* Next Button */}
        <Button
          variant="ghost"
          size="sm"
          onClick={goToNext}
          className="h-7 w-7 p-0"
          aria-label="Next plot"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      {/* Horizontal Scrollable Thumbnails (Optional - below main view) */}
      <div className="border-t border-gray-200 bg-gray-50 px-2 py-1 overflow-x-auto">
        <div className="flex space-x-2">
          {plotUrls.map((url, index) => (
            <button
              key={index}
              onClick={() => setCurrentIndex(index)}
              className={`flex-shrink-0 border-2 rounded transition-all ${
                index === currentIndex
                  ? 'border-rstudio'
                  : 'border-gray-300 opacity-60 hover:opacity-100'
              }`}
            >
              <img
                src={url}
                alt={`Thumbnail ${index + 1}`}
                className="h-12 w-auto object-contain"
              />
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

export function VersionHistory({ 
  projectId, 
  currentCode, 
  currentPlotUrl, 
  onVersionRestore, 
  onSaveVersion 
}: VersionHistoryProps) {
  const [versions, setVersions] = useState<CodeVersionWithProfile[]>([])
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
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

  const saveCurrentVersion = async () => {
    if (!currentCode.trim() || !onSaveVersion) return

    setSaving(true)
    try {
      const version = await saveVersion(projectId, {
        code: currentCode,
        plot_url: currentPlotUrl,
        description: description || `Version ${versions.length + 1}`
      })

      if (version) {
        setVersions([version as CodeVersionWithProfile, ...versions])
        setDescription('')
        setShowDescriptionInput(false)
        onSaveVersion(version.code, version.plot_url ?? undefined, version.description)
      }
    } catch (error) {
      console.error('Failed to save version:', error)
    } finally {
      setSaving(false)
    }
  }

  const handleRestoreVersion = async (versionId: string) => {
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
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString()
  }

  const truncateCode = (code: string, maxLength: number = 100) => {
    return code.length > maxLength ? code.substring(0, maxLength) + '...' : code
  }

  const toggleExpanded = (id: string) => {
    setExpandedIds(prev => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }

  const expandAll = () => {
    setExpandedIds(new Set(versions.map(v => v.id)))
  }

  const collapseAll = () => {
    setExpandedIds(new Set())
  }

  // Helper function to parse plot URLs - could be single URL or JSON array
  const parsePlotUrls = (plotUrl?: string | null): string[] => {
    if (!plotUrl) return []
    
    try {
      // Try to parse as JSON array (for multiple plots)
      const parsed = JSON.parse(plotUrl)
      if (Array.isArray(parsed)) {
        return parsed
      }
      // Single plot URL
      return [plotUrl]
    } catch {
      // Not JSON, treat as single plot URL
      return [plotUrl]
    }
  }

  useEffect(() => {
    if (showHistory) {
      loadVersions()
    }
  }, [showHistory, projectId, loadVersions])

  return (
    <div className="relative">
      {/* Version Control Buttons */}
      <div className="flex items-center space-x-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowHistory(!showHistory)}
          className="flex items-center space-x-1"
        >
          <History className="h-4 w-4" />
          <span>History</span>
        </Button>
        
        {onSaveVersion && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowDescriptionInput(!showDescriptionInput)}
            disabled={saving}
            className="flex items-center space-x-1"
          >
            <Save className="h-4 w-4" />
            <span>{saving ? 'Saving...' : 'Save Version'}</span>
          </Button>
        )}
      </div>

      {/* Description Input */}
      {showDescriptionInput && (
        <div className="mt-2 p-3 bg-gray-50 rounded-lg border">
          <Input
            placeholder="Enter a description for this version..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="mb-2 bg-white text-darktext border-2 border-gray-300"
          />
          <div className="flex space-x-2">
            <Button size="sm" onClick={saveCurrentVersion} disabled={saving}>
              Save Version
            </Button>
            <Button 
              size="sm" 
              variant="outline" 
              onClick={() => {
                setShowDescriptionInput(false)
                setDescription('')
              }}
            >
              Cancel
            </Button>
          </div>
        </div>
      )}

      {/* Version History Panel - Fullscreen Overlay */}
      {showHistory && (
        <div className="fixed inset-0 z-[100]">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setShowHistory(false)}
          />

          {/* Content */}
          <div className="relative inset-0 w-full h-full flex items-center justify-center p-4">
            <Card className="w-[95vw] max-w-6xl h-[90vh] bg-white border shadow-2xl overflow-hidden">
              {/* Sticky Header */}
              <div className="px-4 py-3 border-b bg-white/80 backdrop-blur flex items-center justify-between sticky top-0 z-10">
                <h3 className="text-lg font-semibold flex items-center">
                  <Clock className="h-5 w-5 mr-2" />
                  Version History
                </h3>
                <div className="flex items-center gap-2">
                  {versions.length > 0 && expandedIds.size !== versions.length && (
                    <Button variant="outline" size="sm" onClick={expandAll}>
                      Expand all
                    </Button>
                  )}
                  {expandedIds.size > 0 && (
                    <Button variant="outline" size="sm" onClick={collapseAll}>
                      Collapse all
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowHistory(false)}
                  >
                    ×
                  </Button>
                </div>
              </div>

              {/* Scrollable Body */}
              <div className="p-4 overflow-y-auto h-[calc(90vh-3rem)]">
                {loading ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-rstudio"></div>
                  </div>
                ) : versions.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <History className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No versions saved yet</p>
                    <p className="text-sm">Save your first version to get started</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {versions.map((version) => (
                      <div
                        key={version.id}
                        className="p-3 border rounded-lg hover:bg-gray-50 transition-colors"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <button
                              type="button"
                              onClick={() => toggleExpanded(version.id)}
                              className="w-full text-left"
                            >
                              <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center space-x-2">
                                  {expandedIds.has(version.id) ? (
                                    <ChevronDown className="h-4 w-4" />
                                  ) : (
                                    <ChevronRight className="h-4 w-4" />
                                  )}
                                  <span className="font-semibold text-sm">
                                    Version {version.version_number}
                                    {version.profiles?.display_name && (
                                      <span className="text-gray-500 font-normal ml-2">
                                        by {version.profiles.display_name}
                                      </span>
                                    )}
                                  </span>
                                  <span className="text-xs text-gray-500">
                                    {formatDate(version.created_at)}
                                  </span>
                                </div>
                              </div>
                              <p className="text-sm text-gray-600">
                                {version.description}
                              </p>
                              {!expandedIds.has(version.id) && (
                                <div className="mt-2 bg-gray-100 p-2 rounded text-xs font-mono">
                                  <code className="text-gray-700">
                                    {truncateCode(version.code)}
                                  </code>
                                </div>
                              )}
                              {!expandedIds.has(version.id) && version.plot_url && (
                                <div className="mt-2 flex items-center text-xs text-green-600">
                                  <Eye className="h-3 w-3 mr-1" />
                                  Includes {parsePlotUrls(version.plot_url).length} plot{parsePlotUrls(version.plot_url).length > 1 ? 's' : ''}
                                </div>
                              )}
                            </button>

                            {expandedIds.has(version.id) && (
                              <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-3">
                                <div className="border rounded-md overflow-hidden">
                                  <div className="bg-gray-50 px-2 py-1 text-xs text-gray-500">Code</div>
                                  <pre className="m-0 p-3 bg-gray-100 text-xs overflow-auto max-h-60">
<code className="text-gray-800 whitespace-pre-wrap">{version.code}</code>
                                  </pre>
                                </div>
                                <div className="border rounded-md overflow-hidden">
                                  <div className="bg-gray-50 px-2 py-1 text-xs text-gray-500 flex items-center justify-between">
                                    <span>Plot{parsePlotUrls(version.plot_url).length > 1 ? `s (${parsePlotUrls(version.plot_url).length})` : ''}</span>
                                  </div>
                                  {version.plot_url ? (
                                    <PlotGallery plotUrls={parsePlotUrls(version.plot_url)} versionNumber={version.version_number} />
                                  ) : (
                                    <div className="p-3 text-xs text-gray-500">No plot for this version.</div>
                                  )}
                                </div>
                              </div>
                            )}
                          </div>
                          
                          {onVersionRestore && (
                            <div className="flex flex-col space-y-1 ml-4">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleRestoreVersion(version.id)}
                                className="flex items-center space-x-1"
                              >
                                <RotateCcw className="h-3 w-3" />
                                <span>Restore</span>
                              </Button>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </Card>
          </div>
        </div>
      )}
    </div>
  )
}
