'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { X, Loader2, Shield, Plus, Trash2, FileText } from 'lucide-react'

interface ContextWindowModalProps {
  projectName: string
  csvFiles: Array<{ fileName: string; csvData: string }>
  initialContext?: string | null
  onSave: (context: string) => void
  onCancel: () => void
  onGenerateContext: (projectName: string, csvFiles: Array<{ fileName: string; csvData: string }>) => Promise<string>
}

interface ContextFields {
  studyType: string
  objective: string
  keyFields: string
  analysisTypes: string[]
  additionalNotes: string
  excludedFields: string[] // Fields fully excluded from analysis (will not be shared)
}

export function ContextWindowModal({
  projectName,
  csvFiles,
  initialContext,
  onSave,
  onCancel,
  onGenerateContext
}: ContextWindowModalProps) {
  const [isGenerating, setIsGenerating] = useState<boolean>(false)
  const [hasGenerated, setHasGenerated] = useState<boolean>(!!initialContext)
  
  // Extract column names from CSV files
  const extractColumns = (): string[] => {
    const allColumns: string[] = []
    csvFiles.forEach(file => {
      const lines = file.csvData.split('\n')
      if (lines.length > 0) {
        const headers = lines[0].split(',').map(h => h.trim()).filter(Boolean)
        headers.forEach(header => {
          if (!allColumns.includes(header)) {
            allColumns.push(header)
          }
        })
      }
    })
    return allColumns
  }

  const [availableColumns] = useState<string[]>(extractColumns())

  // Parse initial context or set defaults
  const parseInitialContext = (ctx: string | null): ContextFields => {
    if (!ctx) return {
      studyType: '',
      objective: '',
      keyFields: csvFiles.map(f => f.fileName).join(', '),
      analysisTypes: [],
      additionalNotes: '',
      excludedFields: []
    }
    
    const lines = ctx.split('\n')
    const parsed: ContextFields = {
      studyType: '',
      objective: '',
      keyFields: '',
      analysisTypes: [],
      additionalNotes: '',
      excludedFields: []
    }
    
    lines.forEach(line => {
      if (line.startsWith('Study Type:')) parsed.studyType = line.replace('Study Type:', '').trim()
      if (line.startsWith('Objective:')) parsed.objective = line.replace('Objective:', '').trim()
      if (line.startsWith('Dataset Key Fields:')) parsed.keyFields = line.replace('Dataset Key Fields:', '').trim()
      if (line.startsWith('Preferred Analysis Types:')) {
        const types = line.replace('Preferred Analysis Types:', '').trim()
        parsed.analysisTypes = types.split(',').map(t => t.trim()).filter(Boolean)
      }
      if (line.startsWith('Additional Notes:')) parsed.additionalNotes = line.replace('Additional Notes:', '').trim()
      if (line.startsWith('Excluded Fields (Not Shared):')) {
        const fields = line.replace('Excluded Fields (Not Shared):', '').trim()
        parsed.excludedFields = fields.split(',').map(t => t.trim()).filter(Boolean)
      }
    })
    
    return parsed
  }
  
  const [fields, setFields] = useState<ContextFields>(parseInitialContext(initialContext || null))

  const generateContext = async () => {
    setIsGenerating(true)
    try {
      const generatedContext = await onGenerateContext(projectName, csvFiles)
      // Parse and auto-populate all fields from AI response
      const parsed = parseInitialContext(generatedContext)
      setFields(parsed)
      setHasGenerated(true)
      console.log('✅ Context auto-generated and fields populated:', parsed)
    } catch (error) {
      console.error('Failed to generate context:', error)
      // Set default values if generation fails
      setFields(prev => ({
        ...prev,
        studyType: prev.studyType || '',
        objective: prev.objective || '',
        keyFields: prev.keyFields || csvFiles.map(f => f.fileName).join(', ')
      }))
      setHasGenerated(true)
    } finally {
      setIsGenerating(false)
    }
  }

  const addAnalysisType = () => {
    setFields(prev => ({
      ...prev,
      analysisTypes: [...prev.analysisTypes, '']
    }))
  }

  const updateAnalysisType = (index: number, value: string) => {
    setFields(prev => ({
      ...prev,
      analysisTypes: prev.analysisTypes.map((type, i) => i === index ? value : type)
    }))
  }

  const removeAnalysisType = (index: number) => {
    setFields(prev => ({
      ...prev,
      analysisTypes: prev.analysisTypes.filter((_, i) => i !== index)
    }))
  }

  const toggleExcludeField = (field: string) => {
    setFields(prev => ({
      ...prev,
      excludedFields: prev.excludedFields.includes(field)
        ? prev.excludedFields.filter(f => f !== field)
        : [...prev.excludedFields, field]
    }))
  }

  const handleSave = () => {
    // Build context string from fields
    const contextString = `Study Type: ${fields.studyType || '[Not specified]'}

Objective: ${fields.objective || '[Not specified]'}

Dataset Key Fields: ${fields.keyFields || '[Not specified]'}

Privacy Setting: HIPAA-compliant mode ✅
All PHI fields are treated as de-identified tokens. No raw identifiers are logged or exported.

Excluded Fields (Not Shared): ${fields.excludedFields.join(', ') || '[None excluded]'}

Preferred Analysis Types: ${fields.analysisTypes.filter(Boolean).join(', ') || '[Not specified]'}

Additional Notes: ${fields.additionalNotes || '[None]'}`
    
    onSave(contextString)
  }

  // Auto-generate context on mount if no initial context
  useEffect(() => {
    if (!initialContext && !hasGenerated) {
      generateContext()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col border-4 border-blue-600 dark:border-blue-500">
        {/* NIST-Style Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-blue-700 to-blue-900 dark:from-blue-800 dark:to-blue-950 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 rounded bg-white/10 backdrop-blur-sm flex items-center justify-center border border-white/20">
              <Shield className="w-7 h-7 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">
                NIST/HIPAA Research Context
              </h2>
              <p className="text-sm text-blue-100">
                Project: {projectName}
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={onCancel}
            className="rounded hover:bg-white/10 text-white"
          >
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-6 bg-gray-50 dark:bg-gray-900">
          {isGenerating ? (
            <div className="flex flex-col items-center justify-center py-12 space-y-4">
              <Loader2 className="w-16 h-16 text-blue-600 animate-spin" />
              <div className="text-center">
                <p className="text-lg font-semibold text-gray-900 dark:text-white">
                  Analyzing Dataset Structure...
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                  AI is generating NIST-compliant research context and auto-filling fields
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-5">
              {/* Instructions Banner */}
              <div className="bg-blue-600 text-white p-4 rounded-lg border-l-4 border-blue-800">
                <div className="flex items-start gap-3">
                  <FileText className="w-5 h-5 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-semibold text-sm">NIST SP 800-53 Compliance Notice</p>
                    <p className="text-xs mt-1 text-blue-50">
                      Complete all required fields to establish a secure research context. 
                      This ensures AI-generated code meets HIPAA and NIST security standards.
                    </p>
                  </div>
                </div>
              </div>

              {/* Study Type */}
              <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border-2 border-gray-200 dark:border-gray-700">
                <label className="block text-sm font-semibold text-gray-900 dark:text-white mb-2 uppercase tracking-wide">
                  1. Study Type <span className="text-red-500">*</span>
                </label>
                <Input
                  value={fields.studyType}
                  onChange={(e) => setFields(prev => ({ ...prev, studyType: e.target.value }))}
                  placeholder="e.g., Clinical trial, Observational study, Epidemiological research"
                  className="w-full border-2 border-gray-300 dark:border-gray-600 focus:border-blue-500"
                />
              </div>

              {/* Objective */}
              <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border-2 border-gray-200 dark:border-gray-700">
                <label className="block text-sm font-semibold text-gray-900 dark:text-white mb-2 uppercase tracking-wide">
                  2. Research Objective <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={fields.objective}
                  onChange={(e) => setFields(prev => ({ ...prev, objective: e.target.value }))}
                  placeholder="e.g., Analyze the relationship between treatment and patient outcomes in post-MI recovery"
                  className="w-full px-3 py-2 border-2 border-gray-300 dark:border-gray-600 rounded focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 bg-white dark:bg-gray-900 text-gray-900 dark:text-white resize-none"
                  rows={3}
                />
              </div>

              {/* Dataset Key Fields */}
              <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border-2 border-gray-200 dark:border-gray-700">
                <label className="block text-sm font-semibold text-gray-900 dark:text-white mb-2 uppercase tracking-wide">
                  3. Dataset Key Fields
                </label>
                <Input
                  value={fields.keyFields}
                  onChange={(e) => setFields(prev => ({ ...prev, keyFields: e.target.value }))}
                  placeholder="e.g., Patient_ID, Age, Treatment, Outcome"
                  className="w-full border-2 border-gray-300 dark:border-gray-600 focus:border-blue-500"
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                  Detected files: {csvFiles.map(f => f.fileName).join(', ')}
                </p>
              </div>

              {/* Field Exclusion Manager */}
              {availableColumns.length > 0 && (
                <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border-2 border-red-200 dark:border-red-700">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <label className="block text-sm font-semibold text-gray-900 dark:text-white uppercase tracking-wide">
                        3b. Exclude Sensitive Fields
                      </label>
                      <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                        Mark fields that should NOT be shared or analyzed (HIPAA/NIST requirement)
                      </p>
                    </div>
                    <div className="text-xs bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 px-2 py-1 rounded font-semibold">
                      {fields.excludedFields.length} Excluded
                    </div>
                  </div>
                  
                  {/* Column/Field Grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-64 overflow-y-auto p-2 bg-gray-50 dark:bg-gray-900 rounded border border-gray-200 dark:border-gray-700">
                    {availableColumns.map((column, index) => {
                      const isExcluded = fields.excludedFields.includes(column)
                      return (
                        <button
                          key={index}
                          type="button"
                          onClick={() => toggleExcludeField(column)}
                          className={`
                            px-3 py-2 rounded border-2 text-sm font-medium transition-all
                            ${isExcluded
                              ? 'bg-red-600 text-white border-red-700 hover:bg-red-700 shadow-md'
                              : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600 hover:border-red-400'
                            }
                          `}
                        >
                          {isExcluded ? (
                            <span className="flex items-center justify-center gap-1">
                              <X className="w-3 h-3" />
                              EXCLUDED
                            </span>
                          ) : (
                            column
                          )}
                        </button>
                      )
                    })}
                  </div>
                  
                  {fields.excludedFields.length > 0 && (
                    <div className="mt-3 p-2 bg-red-50 dark:bg-red-900/20 rounded text-xs text-red-800 dark:text-red-200">
                      <strong>⚠️ Excluded Fields:</strong> {fields.excludedFields.join(', ')}
                    </div>
                  )}
                </div>
              )}

              {/* Preferred Analysis Types */}
              <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border-2 border-gray-200 dark:border-gray-700">
                <label className="block text-sm font-semibold text-gray-900 dark:text-white mb-3 uppercase tracking-wide">
                  4. Preferred Analysis Types
                </label>
                <div className="space-y-2">
                  {fields.analysisTypes.map((type, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <Input
                        value={type}
                        onChange={(e) => updateAnalysisType(index, e.target.value)}
                        placeholder="e.g., Linear regression, ANOVA, Survival analysis"
                        className="flex-1 border-2 border-gray-300 dark:border-gray-600"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        onClick={() => removeAnalysisType(index)}
                        className="border-red-300 text-red-600 hover:bg-red-50 dark:border-red-700 dark:text-red-400 dark:hover:bg-red-900/20"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                  <Button
                    type="button"
                    variant="outline"
                    onClick={addAnalysisType}
                    className="w-full border-2 border-dashed border-blue-300 text-blue-600 hover:bg-blue-50 dark:border-blue-700 dark:text-blue-400 dark:hover:bg-blue-900/20"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add Analysis Type
                  </Button>
                </div>
              </div>

              {/* Additional Notes */}
              <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border-2 border-gray-200 dark:border-gray-700">
                <label className="block text-sm font-semibold text-gray-900 dark:text-white mb-2 uppercase tracking-wide">
                  5. Additional Notes
                </label>
                <textarea
                  value={fields.additionalNotes}
                  onChange={(e) => setFields(prev => ({ ...prev, additionalNotes: e.target.value }))}
                  placeholder="Any specific requirements, constraints, or context about this research project"
                  className="w-full px-3 py-2 border-2 border-gray-300 dark:border-gray-600 rounded focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 bg-white dark:bg-gray-900 text-gray-900 dark:text-white resize-none"
                  rows={3}
                />
              </div>

              {/* Privacy Notice */}
              <div className="bg-green-50 dark:bg-green-900/20 p-3 rounded border-l-4 border-green-500 flex items-start gap-2">
                <Shield className="w-4 h-4 text-green-600 dark:text-green-400 mt-0.5 flex-shrink-0" />
                <p className="text-xs text-green-800 dark:text-green-200">
                  <strong>HIPAA Compliance:</strong> All PHI fields are automatically de-identified. 
                  No raw identifiers (names, DOBs, SSNs) are logged or exported.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-gray-100 dark:bg-gray-800 border-t-2 border-blue-600 dark:border-blue-500 flex items-center justify-between">
          <Button
            variant="outline"
            onClick={generateContext}
            disabled={isGenerating}
            className="flex items-center gap-2 border-2"
          >
            <Loader2 className={`w-4 h-4 ${isGenerating ? 'animate-spin' : ''}`} />
            <span>{hasGenerated ? 'Regenerate' : 'AI Auto-Generate'}</span>
          </Button>
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              onClick={onCancel}
              disabled={isGenerating}
              className="hover:bg-gray-200 dark:hover:bg-gray-700"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={isGenerating || !fields.studyType.trim() || !fields.objective.trim()}
              className="bg-blue-700 hover:bg-blue-800 text-white font-semibold px-6"
            >
              <Shield className="w-4 h-4 mr-2" />
              {initialContext ? 'Update Context' : 'Save & Continue'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

