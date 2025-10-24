'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { History, RotateCcw, Save, Eye, Clock } from 'lucide-react'

interface CodeVersion {
  id: string
  version_number: number
  code: string
  plot_url?: string
  description: string
  created_at: string
}

interface VersionHistoryProps {
  projectId: string
  currentCode: string
  currentPlotUrl?: string
  onVersionRestore: (code: string, plotUrl?: string) => void
  onSaveVersion: (code: string, plotUrl?: string, description?: string) => void
}

export function VersionHistory({ 
  projectId, 
  currentCode, 
  currentPlotUrl, 
  onVersionRestore, 
  onSaveVersion 
}: VersionHistoryProps) {
  const [versions, setVersions] = useState<CodeVersion[]>([])
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [showHistory, setShowHistory] = useState(false)
  const [description, setDescription] = useState('')
  const [showDescriptionInput, setShowDescriptionInput] = useState(false)

  const loadVersions = async () => {
    setLoading(true)
    try {
      const response = await fetch(`/api/projects/${projectId}/versions`)
      const data = await response.json()
      if (data.versions) {
        setVersions(data.versions)
      }
    } catch (error) {
      console.error('Failed to load versions:', error)
    } finally {
      setLoading(false)
    }
  }

  const saveCurrentVersion = async () => {
    if (!currentCode.trim()) return
    
    setSaving(true)
    try {
      const response = await fetch(`/api/projects/${projectId}/versions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: currentCode,
          plot_url: currentPlotUrl,
          description: description || `Version ${versions.length + 1}`
        })
      })

      const data = await response.json()
      if (data.version) {
        setVersions([data.version, ...versions])
        setDescription('')
        setShowDescriptionInput(false)
      }
    } catch (error) {
      console.error('Failed to save version:', error)
    } finally {
      setSaving(false)
    }
  }

  const restoreVersion = async (versionId: string) => {
    try {
      const response = await fetch(`/api/projects/${projectId}/versions/${versionId}/restore`, {
        method: 'POST'
      })

      const data = await response.json()
      if (data.success) {
        onVersionRestore(data.code, data.plot_url)
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
      </div>

      {/* Description Input */}
      {showDescriptionInput && (
        <div className="mt-2 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border">
          <Input
            placeholder="Enter a description for this version..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="mb-2"
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

      {/* Version History Panel */}
      {showHistory && (
        <div className="absolute top-full left-0 right-0 mt-2 z-50">
          <Card className="max-h-96 overflow-y-auto bg-white dark:bg-gray-800 border shadow-lg">
            <div className="p-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold flex items-center">
                  <Clock className="h-5 w-5 mr-2" />
                  Version History
                </h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowHistory(false)}
                >
                  ×
                </Button>
              </div>

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
                      className="p-3 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-2">
                            <span className="font-semibold text-sm">
                              Version {version.version_number}
                            </span>
                            <span className="text-xs text-gray-500">
                              {formatDate(version.created_at)}
                            </span>
                          </div>
                          
                          <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                            {version.description}
                          </p>
                          
                          <div className="bg-gray-100 dark:bg-gray-700 p-2 rounded text-xs font-mono">
                            <code className="text-gray-700 dark:text-gray-300">
                              {truncateCode(version.code)}
                            </code>
                          </div>
                          
                          {version.plot_url && (
                            <div className="mt-2 flex items-center text-xs text-green-600 dark:text-green-400">
                              <Eye className="h-3 w-3 mr-1" />
                              Includes plot
                            </div>
                          )}
                        </div>
                        
                        <div className="flex flex-col space-y-1 ml-4">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => restoreVersion(version.id)}
                            className="flex items-center space-x-1"
                          >
                            <RotateCcw className="h-3 w-3" />
                            <span>Restore</span>
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
      )}
    </div>
  )
}
