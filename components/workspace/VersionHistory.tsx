'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { History, RotateCcw, Save, Eye, Clock, ChevronDown, ChevronRight, ChevronLeft, X, Check } from 'lucide-react'
import { useVersionHistory } from './hooks/useVersionHistory'

interface VersionHistoryProps {
  projectId: string
  currentCode: string
  currentPlotUrl?: string
  onVersionRestore?: (code: string, plotUrl?: string) => void
  onSaveVersion?: (code: string, plotUrl?: string, description?: string) => void
}

function PlotGallery({ plotUrls, versionNumber }: { plotUrls: string[], versionNumber: number }) {
  const [currentIndex, setCurrentIndex] = useState(0)

  useEffect(() => {
    setCurrentIndex(0)
  }, [plotUrls.length, versionNumber])

  if (plotUrls.length === 0) {
    return <div className="p-3 text-xs text-zinc-500">No plot for this version.</div>
  }

  if (plotUrls.length === 1) {
    return (
      <div className="p-2 flex items-center justify-center bg-zinc-800/50">
        <img src={plotUrls[0]} alt={`Plot for version ${versionNumber}`} className="max-h-60 object-contain" />
      </div>
    )
  }

  const goToPrevious = () => setCurrentIndex((prev) => (prev === 0 ? plotUrls.length - 1 : prev - 1))
  const goToNext = () => setCurrentIndex((prev) => (prev === plotUrls.length - 1 ? 0 : prev + 1))

  return (
    <div className="relative bg-zinc-800/50">
      <div className="p-2 flex items-center justify-center min-h-[240px] max-h-60 relative">
        <img
          key={currentIndex}
          src={plotUrls[currentIndex]}
          alt={`Plot ${currentIndex + 1} of ${plotUrls.length} for version ${versionNumber}`}
          className="max-h-[232px] object-contain animate-fade-in"
        />
      </div>

      <div className="border-t border-zinc-700 bg-zinc-800 px-2 py-2 flex items-center justify-between">
        <Button variant="ghost" size="sm" onClick={goToPrevious} className="h-7 w-7 p-0 text-zinc-400 hover:text-white hover:bg-zinc-700" aria-label="Previous plot">
          <ChevronLeft className="h-4 w-4" />
        </Button>

        <div className="flex items-center space-x-2">
          <span className="text-xs text-zinc-400">{currentIndex + 1} / {plotUrls.length}</span>
          <div className="flex space-x-1">
            {plotUrls.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentIndex(index)}
                className={`w-1.5 h-1.5 rounded-full transition-colors ${index === currentIndex ? 'bg-emerald-500' : 'bg-zinc-600'}`}
                aria-label={`Go to plot ${index + 1}`}
              />
            ))}
          </div>
        </div>

        <Button variant="ghost" size="sm" onClick={goToNext} className="h-7 w-7 p-0 text-zinc-400 hover:text-white hover:bg-zinc-700" aria-label="Next plot">
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      <div className="border-t border-zinc-700 bg-zinc-800 px-2 py-1 overflow-x-auto">
        <div className="flex space-x-2">
          {plotUrls.map((url, index) => (
            <button
              key={index}
              onClick={() => setCurrentIndex(index)}
              className={`flex-shrink-0 border-2 rounded transition-all ${index === currentIndex ? 'border-emerald-500' : 'border-zinc-600 opacity-60 hover:opacity-100'}`}
            >
              <img src={url} alt={`Thumbnail ${index + 1}`} className="h-12 w-auto object-contain" />
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

export function VersionHistory({ projectId, currentCode, currentPlotUrl, onVersionRestore, onSaveVersion }: VersionHistoryProps) {
  const {
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
    canSave,
    canRestore,
    saveSuccess
  } = useVersionHistory({ projectId, currentCode, currentPlotUrl, onVersionRestore, onSaveVersion })

  return (
    <div className="relative">
      <div className="flex items-center space-x-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowHistory(!showHistory)}
          className="flex items-center space-x-1 bg-zinc-800 border-zinc-700 text-zinc-300 hover:bg-zinc-700 hover:text-white"
        >
          <History className="h-4 w-4" />
          <span>History</span>
        </Button>

        {canSave && !showDescriptionInput && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowDescriptionInput(true)}
            disabled={saving}
            className="flex items-center space-x-1 bg-zinc-800 border-zinc-700 text-zinc-300 hover:bg-zinc-700 hover:text-white"
          >
            <Save className="h-4 w-4" />
            <span>Save Version</span>
          </Button>
        )}

        {canSave && showDescriptionInput && (
          <>
            <input
              type="text"
              placeholder="Version description..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') saveCurrentVersion(); if (e.key === 'Escape') { setShowDescriptionInput(false); setDescription(''); } }}
              autoFocus
              className="flex-1 min-w-[200px] max-w-[400px] h-8 px-3 bg-zinc-900 border border-zinc-600 rounded-md text-sm text-white placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
            />
            <Button
              size="sm"
              onClick={saveCurrentVersion}
              disabled={saving}
              className="h-8 px-3 bg-emerald-500 hover:bg-emerald-400 text-black font-medium rounded-md"
            >
              {saving ? 'Saving...' : 'Save'}
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => { setShowDescriptionInput(false); setDescription('') }}
              className="h-8 px-2 text-zinc-400 hover:text-white hover:bg-zinc-700 rounded-md"
            >
              <X className="h-4 w-4" />
            </Button>
          </>
        )}

        {saveSuccess && (
          <div className="flex items-center space-x-1.5 px-2.5 py-1 bg-emerald-500/20 border border-emerald-500/40 rounded-md animate-in fade-in duration-200">
            <Check className="h-3.5 w-3.5 text-emerald-400" />
            <span className="text-xs font-medium text-emerald-400">Saved!</span>
          </div>
        )}
      </div>

      {showHistory && (
        <div className="fixed inset-0 z-[100]">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setShowHistory(false)} />

          <div className="relative inset-0 w-full h-full flex items-center justify-center p-4">
            <Card className="w-[95vw] max-w-6xl h-[90vh] bg-zinc-900 border border-zinc-800 shadow-2xl overflow-hidden">
              <div className="px-4 py-3 border-b border-zinc-800 bg-zinc-900/80 backdrop-blur flex items-center justify-between sticky top-0 z-10">
                <h3 className="text-lg font-semibold flex items-center text-white">
                  <Clock className="h-5 w-5 mr-2 text-emerald-500" />
                  Version History
                </h3>
                <div className="flex items-center gap-2">
                  {versions.length > 0 && expandedIds.size !== versions.length && (
                    <Button variant="outline" size="sm" onClick={expandAll} className="bg-zinc-800 border-zinc-700 text-zinc-300 hover:bg-zinc-700 hover:text-white">
                      Expand all
                    </Button>
                  )}
                  {expandedIds.size > 0 && (
                    <Button variant="outline" size="sm" onClick={collapseAll} className="bg-zinc-800 border-zinc-700 text-zinc-300 hover:bg-zinc-700 hover:text-white">
                      Collapse all
                    </Button>
                  )}
                  <Button variant="ghost" size="sm" onClick={() => setShowHistory(false)} className="text-zinc-400 hover:text-white hover:bg-zinc-800">
                    ×
                  </Button>
                </div>
              </div>

              <div className="p-4 overflow-y-auto h-[calc(90vh-3rem)] bg-zinc-900">
                {loading ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500"></div>
                  </div>
                ) : versions.length === 0 ? (
                  <div className="text-center py-8 text-zinc-500">
                    <History className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No versions saved yet</p>
                    <p className="text-sm">Save your first version to get started</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {versions.map((version) => (
                      <div key={version.id} className="p-3 border border-zinc-800 rounded-lg hover:bg-zinc-800/50 transition-colors">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <button type="button" onClick={() => toggleExpanded(version.id)} className="w-full text-left">
                              <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center space-x-2">
                                  {expandedIds.has(version.id) ? <ChevronDown className="h-4 w-4 text-zinc-400" /> : <ChevronRight className="h-4 w-4 text-zinc-400" />}
                                  <span className="font-semibold text-sm text-white">
                                    Version {version.version_number}
                                    {version.profiles?.display_name && <span className="text-zinc-500 font-normal ml-2">by {version.profiles.display_name}</span>}
                                  </span>
                                  <span className="text-xs text-zinc-500">{formatDate(version.created_at)}</span>
                                </div>
                              </div>
                              <p className="text-sm text-zinc-400">{version.description}</p>
                              {!expandedIds.has(version.id) && (
                                <div className="mt-2 bg-zinc-800 p-2 rounded text-xs font-mono">
                                  <code className="text-zinc-300">{truncateCode(version.code)}</code>
                                </div>
                              )}
                              {!expandedIds.has(version.id) && version.plot_url && (
                                <div className="mt-2 flex items-center text-xs text-emerald-400">
                                  <Eye className="h-3 w-3 mr-1" />
                                  Includes {parsePlotUrls(version.plot_url).length} plot{parsePlotUrls(version.plot_url).length > 1 ? 's' : ''}
                                </div>
                              )}
                            </button>

                            {expandedIds.has(version.id) && (
                              <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-3">
                                <div className="border border-zinc-700 rounded-md overflow-hidden">
                                  <div className="bg-zinc-800 px-2 py-1 text-xs text-zinc-400">Code</div>
                                  <pre className="m-0 p-3 bg-zinc-800/50 text-xs overflow-auto max-h-60">
                                    <code className="text-zinc-300 whitespace-pre-wrap">{version.code}</code>
                                  </pre>
                                </div>
                                <div className="border border-zinc-700 rounded-md overflow-hidden">
                                  <div className="bg-zinc-800 px-2 py-1 text-xs text-zinc-400 flex items-center justify-between">
                                    <span>Plot{parsePlotUrls(version.plot_url).length > 1 ? `s (${parsePlotUrls(version.plot_url).length})` : ''}</span>
                                  </div>
                                  {version.plot_url ? (
                                    <PlotGallery plotUrls={parsePlotUrls(version.plot_url)} versionNumber={version.version_number} />
                                  ) : (
                                    <div className="p-3 text-xs text-zinc-500">No plot for this version.</div>
                                  )}
                                </div>
                              </div>
                            )}
                          </div>

                          <div className="flex flex-col space-y-1 ml-4">
                            {canRestore && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleRestoreVersion(version.id)}
                                className="flex items-center space-x-1 bg-zinc-800 border-zinc-700 text-zinc-300 hover:bg-emerald-500/20 hover:text-emerald-400 hover:border-emerald-500/50"
                              >
                                <RotateCcw className="h-3 w-3" />
                                <span>Restore</span>
                              </Button>
                            )}
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleDeleteVersion(version.id)}
                              disabled={deleting === version.id}
                              className="flex items-center space-x-1 bg-zinc-800 border-zinc-700 text-zinc-300 hover:bg-red-500/20 hover:text-red-400 hover:border-red-500/50"
                            >
                              <X className="h-3 w-3" />
                              <span>{deleting === version.id ? 'Deleting...' : 'Delete'}</span>
                            </Button>
                          </div>
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
