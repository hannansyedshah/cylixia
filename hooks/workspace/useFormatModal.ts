import { useState, useCallback } from 'react'
import { formatData } from '@/actions/chat'
import { executeScript } from '@/actions/executeScript'
import { saveDataset } from '@/lib/db/csvUpload'
import type { FormatMessage, FormatModalState } from '@/types/format'
import type { DatasetItem } from '@/types/dataset'

interface UseFormatModalProps {
  dataset: DatasetItem | null
  projectId: string
  onSaveComplete?: () => void
}

export function useFormatModal({ dataset, projectId, onSaveComplete }: UseFormatModalProps) {
  const [state, setState] = useState<FormatModalState>({
    messages: [],
    generatedCode: '',
    previewCsv: null,
    loading: false,
    executing: false,
    saving: false,
    error: null
  })

  const sendPrompt = useCallback(async (prompt: string) => {
    if (!dataset?.csvText) return

    // Add user message
    const userMessage: FormatMessage = {
      id: crypto.randomUUID(),
      role: 'user',
      content: prompt,
      timestamp: new Date()
    }

    setState(prev => ({
      ...prev,
      messages: [...prev.messages, userMessage],
      loading: true,
      error: null
    }))

    try {
      const response = await formatData({
        prompt,
        csvSample: dataset.csvText,
        fileName: dataset.fileName
      })

      // Add assistant message
      const assistantMessage: FormatMessage = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: response.explanation,
        timestamp: new Date()
      }

      setState(prev => ({
        ...prev,
        messages: [...prev.messages, assistantMessage],
        generatedCode: response.code,
        loading: false
      }))
    } catch (error) {
      setState(prev => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : 'Failed to generate script'
      }))
    }
  }, [dataset])

  const runScript = useCallback(async () => {
    if (!dataset?.csvText || !state.generatedCode) return

    setState(prev => ({ ...prev, executing: true, error: null }))

    try {
      // Convert CSV text to base64
      const csvBase64 = btoa(unescape(encodeURIComponent(dataset.csvText)))

      const response = await executeScript({
        code: state.generatedCode,
        csv_file: {
          filename: 'input.csv',
          data_base64: csvBase64
        }
      })

      if (!response.success) {
        setState(prev => ({
          ...prev,
          executing: false,
          error: response.stderr || 'Script execution failed'
        }))
        return
      }

      if (response.csv_output) {
        // Decode base64 output
        const decodedCsv = decodeURIComponent(escape(atob(response.csv_output.data_base64)))
        setState(prev => ({
          ...prev,
          previewCsv: decodedCsv,
          executing: false
        }))
      } else {
        setState(prev => ({
          ...prev,
          executing: false,
          error: 'No output CSV generated'
        }))
      }
    } catch (error) {
      setState(prev => ({
        ...prev,
        executing: false,
        error: error instanceof Error ? error.message : 'Script execution failed'
      }))
    }
  }, [dataset, state.generatedCode])

  const saveResult = useCallback(async () => {
    if (!state.previewCsv || !dataset) return

    setState(prev => ({ ...prev, saving: true, error: null }))

    try {
      // Generate new filename with _formatted suffix
      const baseName = dataset.fileName.replace(/\.csv$/i, '')
      const newFileName = `${baseName}_formatted.csv`

      await saveDataset({
        projectId,
        fileName: newFileName,
        csvText: state.previewCsv
      })

      setState(prev => ({ ...prev, saving: false }))
      onSaveComplete?.()
    } catch (error) {
      setState(prev => ({
        ...prev,
        saving: false,
        error: error instanceof Error ? error.message : 'Failed to save dataset'
      }))
    }
  }, [state.previewCsv, dataset, projectId, onSaveComplete])

  const updateCode = useCallback((code: string) => {
    setState(prev => ({ ...prev, generatedCode: code, previewCsv: null }))
  }, [])

  const clearPreview = useCallback(() => {
    setState(prev => ({ ...prev, previewCsv: null }))
  }, [])

  const reset = useCallback(() => {
    setState({
      messages: [],
      generatedCode: '',
      previewCsv: null,
      loading: false,
      executing: false,
      saving: false,
      error: null
    })
  }, [])

  return {
    ...state,
    sendPrompt,
    runScript,
    saveResult,
    updateCode,
    clearPreview,
    reset
  }
}
