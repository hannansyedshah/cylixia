'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { X, Loader2, Sparkles } from 'lucide-react'

interface ContextWindowModalProps {
  projectName: string
  csvFiles: Array<{ fileName: string; csvData: string }>
  initialContext?: string | null
  onSave: (context: string) => void
  onCancel: () => void
  onGenerateContext: (projectName: string, csvFiles: Array<{ fileName: string; csvData: string }>) => Promise<string>
}

export function ContextWindowModal({
  projectName,
  csvFiles,
  initialContext,
  onSave,
  onCancel,
  onGenerateContext
}: ContextWindowModalProps) {
  const [context, setContext] = useState<string>(initialContext || '')
  const [isGenerating, setIsGenerating] = useState<boolean>(false)
  const [hasGenerated, setHasGenerated] = useState<boolean>(!!initialContext)

  // Auto-generate context on mount if no initial context
  useEffect(() => {
    if (!initialContext && !hasGenerated) {
      generateContext()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const generateContext = async () => {
    setIsGenerating(true)
    try {
      const generatedContext = await onGenerateContext(projectName, csvFiles)
      setContext(generatedContext)
      setHasGenerated(true)
    } catch (error) {
      console.error('Failed to generate context:', error)
      // Set a default template if generation fails
      setContext(generateDefaultContext())
      setHasGenerated(true)
    } finally {
      setIsGenerating(false)
    }
  }

  const generateDefaultContext = () => {
    const fileNames = csvFiles.map(f => f.fileName).join(', ')
    return `Study Type: [e.g., Clinical trial, Observational study]

Objective: [e.g., Analyze the relationship between treatment and outcomes]

Dataset Key Fields: ${fileNames || '[Describe your dataset variables]'}

Privacy Setting: HIPAA-compliant mode ✅

Preferred Analysis Types: [e.g., Linear regression, ANOVA, survival curves, descriptive statistics]

Additional Notes: [Any specific requirements or constraints]`
  }

  const handleSave = () => {
    if (context.trim()) {
      onSave(context)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                Research Context Window
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                HIPAA-Compliant Mode • {projectName}
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={onCancel}
            className="rounded-full"
          >
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {isGenerating ? (
            <div className="flex flex-col items-center justify-center py-12 space-y-4">
              <Loader2 className="w-12 h-12 text-blue-600 animate-spin" />
              <div className="text-center">
                <p className="text-lg font-medium text-gray-900 dark:text-white">
                  Analyzing your dataset...
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  AI is generating a research context based on your data
                </p>
              </div>
            </div>
          ) : (
            <>
              <div className="mb-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                <p className="text-sm text-blue-900 dark:text-blue-100">
                  <strong>📋 Instructions:</strong> Review and edit the AI-generated context below. 
                  This context will be used for all AI code generation in this project to ensure 
                  accurate, HIPAA-compliant analysis tailored to your research needs.
                </p>
              </div>

              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Research Context
              </label>
              <textarea
                value={context}
                onChange={(e) => setContext(e.target.value)}
                className="w-full h-96 px-4 py-3 border-2 border-gray-300 dark:border-gray-600 rounded-lg 
                         bg-white dark:bg-gray-900 text-gray-900 dark:text-white
                         focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20
                         font-mono text-sm resize-none"
                placeholder="Enter your research context..."
              />

              <div className="mt-4 flex items-start space-x-2 text-xs text-gray-500 dark:text-gray-400">
                <span className="flex-shrink-0">💡</span>
                <p>
                  This context helps the AI understand your research goals, dataset structure, 
                  and preferred analysis methods. You can edit this anytime by clicking &quot;Edit Context&quot; 
                  in the project header.
                </p>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between">
          <Button
            variant="outline"
            onClick={generateContext}
            disabled={isGenerating}
            className="flex items-center space-x-2"
          >
            <Sparkles className="w-4 h-4" />
            <span>Regenerate</span>
          </Button>
          <div className="flex items-center space-x-3">
            <Button
              variant="ghost"
              onClick={onCancel}
              disabled={isGenerating}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={isGenerating || !context.trim()}
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
            >
              {initialContext ? 'Save Changes' : 'Save & Continue'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

