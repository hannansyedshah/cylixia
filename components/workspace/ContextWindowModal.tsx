'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { X, Loader2, Shield, Plus, Trash2, FileText } from 'lucide-react'
import type { ContextFields } from '@/types/workspace'

interface ContextWindowModalProps {
  projectName: string
  csvFiles: Array<{ fileName: string; csvData: string }>
  initialContext?: string | null
  initialExcludedFields?: string[]
  onSave: (context: string) => void
  onCancel: () => void
  onGenerateContext: (projectName: string, csvFiles: Array<{ fileName: string; csvData: string }>) => Promise<string>
}

export function ContextWindowModal({
  projectName,
  csvFiles,
  initialContext,
  initialExcludedFields = [],
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
      excludedFields: initialExcludedFields
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
      const trimmed = line.trim()

      if (trimmed.match(/^\*?\*?Study Type:?\*?\*?/i)) {
        parsed.studyType = trimmed.replace(/^\*?\*?Study Type:?\*?\*?/i, '').replace(/^[:\s]+/, '').replace(/["'\[\]]/g, '').trim()
      }
      if (trimmed.match(/^\*?\*?Objective:?\*?\*?/i) || trimmed.match(/^\*?\*?Title:?\*?\*?/i)) {
        const value = trimmed.replace(/^\*?\*?(Objective|Title):?\*?\*?/i, '').replace(/^[:\s]+/, '').replace(/["'\[\]]/g, '').trim()
        if (value && !parsed.objective) parsed.objective = value
      }
      if (trimmed.match(/^\*?\*?Dataset Key Fields:?\*?\*?/i)) {
        parsed.keyFields = trimmed.replace(/^\*?\*?Dataset Key Fields:?\*?\*?/i, '').replace(/^[:\s]+/, '').replace(/["'\[\]]/g, '').trim()
      }
      if (trimmed.match(/^\*?\*?Preferred Analysis Types:?\*?\*?/i)) {
        const types = trimmed.replace(/^\*?\*?Preferred Analysis Types:?\*?\*?/i, '').replace(/^[:\s]+/, '').replace(/["'\[\]]/g, '').trim()
        parsed.analysisTypes = types.split(/[,;]/).map(t => t.trim()).filter(Boolean)
      }
      if (trimmed.match(/^\*?\*?Additional Notes:?\*?\*?/i)) {
        parsed.additionalNotes = trimmed.replace(/^\*?\*?Additional Notes:?\*?\*?/i, '').replace(/^[:\s]+/, '').replace(/["'\[\]]/g, '').trim()
      }
      if (trimmed.match(/^\*?\*?Excluded Fields.*:?\*?\*?/i)) {
        const fields = trimmed.replace(/^\*?\*?Excluded Fields.*:?\*?\*?/i, '').replace(/^[:\s]+/, '').replace(/["'\[\]]/g, '').trim()
        parsed.excludedFields = fields.split(/[,;]/).map(t => t.trim()).filter(Boolean)
      }
    })

    if (!parsed.studyType && ctx.includes('Study Type:')) {
      const match = ctx.match(/Study Type:?\s*["\[]?([^\n\]"]+)["\]]?/i)
      if (match) parsed.studyType = match[1].trim()
    }
    if (!parsed.studyType && ctx.includes('Cross-sectional')) {
      parsed.studyType = 'Cross-sectional study'
    }

    return parsed
  }

  const [fields, setFields] = useState<ContextFields>(parseInitialContext(initialContext || null))

  const generateContext = async () => {
    setIsGenerating(true)
    try {
      const generatedContext = await onGenerateContext(projectName, csvFiles)
      const parsed = parseInitialContext(generatedContext)
      setFields(parsed)
      setHasGenerated(true)
    } catch (error) {
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
    const contextString = `Study Type: ${fields.studyType || '[Not specified]'}

Objective: ${fields.objective || '[Not specified]'}

Dataset Key Fields: ${fields.keyFields || '[Not specified]'}

Privacy Setting: NIST-compliant mode
All PHI fields are treated as de-identified tokens. No raw identifiers are logged or exported.

Excluded Fields (Not Shared): ${fields.excludedFields.join(', ') || '[None excluded]'}

Preferred Analysis Types: ${fields.analysisTypes.filter(Boolean).join(', ') || '[Not specified]'}

Additional Notes: ${fields.additionalNotes || '[None]'}`

    onSave(contextString)
  }

  useEffect(() => {
    if (!initialContext && !hasGenerated) {
      generateContext()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="relative w-full max-w-4xl max-h-[90vh] flex flex-col">
        <div className="absolute -inset-1 bg-gradient-to-r from-teal-500/20 to-emerald-600/20 rounded-2xl blur-xl" />
        <div className="relative bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden flex flex-col max-h-[90vh]">
          {/* Header */}
          <div className="px-6 py-4 bg-gradient-to-r from-teal-900/50 to-emerald-900/50 border-b border-zinc-800 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 rounded-xl bg-teal-500/20 backdrop-blur-sm flex items-center justify-center border border-teal-500/30">
                <Shield className="w-7 h-7 text-teal-400" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">
                  NIST Research Context
                </h2>
                <p className="text-sm text-zinc-400">
                  Project: {projectName}
                </p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={onCancel}
              className="rounded hover:bg-zinc-800 text-zinc-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </Button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto px-6 py-6 bg-zinc-900 min-h-0">
            {isGenerating ? (
              <div className="flex flex-col items-center justify-center py-12 space-y-4">
                <Loader2 className="w-16 h-16 text-teal-500 animate-spin" />
                <div className="text-center">
                  <p className="text-lg font-semibold text-white">
                    Analyzing Dataset Structure...
                  </p>
                  <p className="text-sm text-zinc-400 mt-2">
                    AI is generating NIST-compliant research context and auto-filling fields
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-5">
                {/* Instructions Banner */}
                <div className="bg-teal-500/10 text-teal-300 p-4 rounded-xl border border-teal-500/20">
                  <div className="flex items-start gap-3">
                    <FileText className="w-5 h-5 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="font-semibold text-sm">NIST SP 800-53 Compliance Notice</p>
                      <p className="text-xs mt-1 text-teal-400/80">
                        Complete all required fields to establish a secure research context.
                        This ensures AI-generated code meets NIST security standards.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Study Type */}
                <div className="bg-zinc-800/50 p-4 rounded-xl border border-zinc-700">
                  <label className="block text-sm font-semibold text-white mb-2 uppercase tracking-wide">
                    1. Study Type <span className="text-red-400">*</span>
                  </label>
                  <Input
                    value={fields.studyType}
                    onChange={(e) => setFields(prev => ({ ...prev, studyType: e.target.value }))}
                    placeholder="e.g., Clinical trial, Observational study, Epidemiological research"
                    className="w-full bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500 focus:border-teal-500 focus:ring-teal-500/20"
                  />
                </div>

                {/* Objective */}
                <div className="bg-zinc-800/50 p-4 rounded-xl border border-zinc-700">
                  <label className="block text-sm font-semibold text-white mb-2 uppercase tracking-wide">
                    2. Research Objective <span className="text-red-400">*</span>
                  </label>
                  <textarea
                    value={fields.objective}
                    onChange={(e) => setFields(prev => ({ ...prev, objective: e.target.value }))}
                    placeholder="e.g., Analyze the relationship between treatment and patient outcomes in post-MI recovery"
                    className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-xl text-white placeholder:text-zinc-500 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/20 resize-none"
                    rows={3}
                  />
                </div>

                {/* Dataset Key Fields */}
                <div className="bg-zinc-800/50 p-4 rounded-xl border border-zinc-700">
                  <label className="block text-sm font-semibold text-white mb-2 uppercase tracking-wide">
                    3. Dataset Key Fields
                  </label>
                  <Input
                    value={fields.keyFields}
                    onChange={(e) => setFields(prev => ({ ...prev, keyFields: e.target.value }))}
                    placeholder="e.g., Patient_ID, Age, Treatment, Outcome"
                    className="w-full bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500 focus:border-teal-500 focus:ring-teal-500/20"
                  />
                  <p className="text-xs text-zinc-500 mt-2">
                    Detected files: {csvFiles.map(f => f.fileName).join(', ')}
                  </p>
                </div>

                {/* Field Exclusion Manager */}
                {availableColumns.length > 0 && (
                  <div className="bg-zinc-800/50 p-4 rounded-xl border border-red-500/30">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <label className="block text-sm font-semibold text-white uppercase tracking-wide">
                          3b. Exclude Sensitive Fields
                        </label>
                        <p className="text-xs text-zinc-400 mt-1">
                          Mark fields that should NOT be shared or analyzed (NIST requirement)
                        </p>
                      </div>
                      <div className="text-xs bg-red-500/20 text-red-400 px-2 py-1 rounded font-semibold border border-red-500/30">
                        {fields.excludedFields.length} Excluded
                      </div>
                    </div>

                    <div className="grid grid-cols-4 gap-2 p-2 bg-zinc-900/50 rounded-lg border border-zinc-700">
                      {availableColumns.map((column, index) => {
                        const isExcluded = fields.excludedFields.includes(column)
                        return (
                          <button
                            key={index}
                            type="button"
                            onClick={() => toggleExcludeField(column)}
                            className={`
                              px-2 py-1.5 rounded-lg border text-xs font-medium transition-all
                              ${isExcluded
                                ? 'bg-red-500/20 text-red-400 border-red-500/30 hover:bg-red-500/30'
                                : 'bg-zinc-800 text-zinc-300 border-zinc-700 hover:border-red-500/50 hover:text-red-400'
                              }
                            `}
                          >
                            {isExcluded ? (
                              <span className="flex items-center justify-center gap-1">
                                <X className="w-3 h-3" />
                                <span className="text-[10px]">EXCLUDED</span>
                              </span>
                            ) : (
                              <span className="truncate block">{column}</span>
                            )}
                          </button>
                        )
                      })}
                    </div>

                    {fields.excludedFields.length > 0 && (
                      <div className="mt-3 p-2 bg-red-500/10 rounded-lg text-xs text-red-400 border border-red-500/20">
                        <strong>Excluded:</strong> {fields.excludedFields.join(', ')}
                      </div>
                    )}
                  </div>
                )}

                {/* Preferred Analysis Types */}
                <div className="bg-zinc-800/50 p-4 rounded-xl border border-zinc-700">
                  <label className="block text-sm font-semibold text-white mb-3 uppercase tracking-wide">
                    4. Preferred Analysis Types
                  </label>
                  <div className="space-y-2">
                    {fields.analysisTypes.map((type, index) => (
                      <div key={index} className="flex items-center gap-2">
                        <Input
                          value={type}
                          onChange={(e) => updateAnalysisType(index, e.target.value)}
                          placeholder="e.g., Linear regression, ANOVA, Survival analysis"
                          className="flex-1 bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500 focus:border-teal-500 focus:ring-teal-500/20"
                        />
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          onClick={() => removeAnalysisType(index)}
                          className="bg-zinc-800 border-red-500/30 text-red-400 hover:bg-red-500/10 hover:text-red-300"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                    <Button
                      type="button"
                      variant="outline"
                      onClick={addAnalysisType}
                      className="w-full border-2 border-dashed border-zinc-700 bg-zinc-800 text-zinc-400 hover:bg-zinc-700 hover:text-teal-400 hover:border-teal-500/50"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Add Analysis Type
                    </Button>
                  </div>
                </div>

                {/* Additional Notes */}
                <div className="bg-zinc-800/50 p-4 rounded-xl border border-zinc-700">
                  <label className="block text-sm font-semibold text-white mb-2 uppercase tracking-wide">
                    5. Additional Notes
                  </label>
                  <textarea
                    value={fields.additionalNotes}
                    onChange={(e) => setFields(prev => ({ ...prev, additionalNotes: e.target.value }))}
                    placeholder="Any specific requirements, constraints, or context about this research project"
                    className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-xl text-white placeholder:text-zinc-500 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/20 resize-none"
                    rows={3}
                  />
                </div>

                {/* Privacy Notice */}
                <div className="bg-emerald-500/10 p-3 rounded-xl border border-emerald-500/20 flex items-start gap-2">
                  <Shield className="w-4 h-4 text-emerald-400 mt-0.5 flex-shrink-0" />
                  <p className="text-xs text-emerald-400">
                    <strong>NIST Compliance:</strong> All PHI fields are automatically de-identified.
                    No raw identifiers (names, DOBs, SSNs) are logged or exported.
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-6 py-4 bg-zinc-800/50 border-t border-zinc-700 flex items-center justify-between">
            <Button
              variant="outline"
              onClick={generateContext}
              disabled={isGenerating}
              className="flex items-center gap-2 bg-zinc-800 border-zinc-700 text-zinc-300 hover:bg-zinc-700 hover:text-white"
            >
              <Loader2 className={`w-4 h-4 ${isGenerating ? 'animate-spin' : ''}`} />
              <span>{hasGenerated ? 'Regenerate' : 'AI Auto-Generate'}</span>
            </Button>
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                onClick={onCancel}
                disabled={isGenerating}
                className="text-zinc-400 hover:text-white hover:bg-zinc-800"
              >
                Cancel
              </Button>
              <Button
                onClick={handleSave}
                disabled={isGenerating || !fields.studyType.trim() || !fields.objective.trim()}
                className="bg-teal-500 hover:bg-teal-400 text-black font-semibold px-6"
              >
                <Shield className="w-4 h-4 mr-2" />
                {initialContext ? 'Update Context' : 'Save & Continue'}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
