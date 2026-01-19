import { useState, useCallback, useEffect } from 'react'
import { formatData } from '@/actions/chat'
import { executeScript } from '@/actions/executeScript'
import { saveDataset } from '@/lib/db/csvUpload'
import type { FormatMessage, FormatModalState } from '@/types/format'
import type { DatasetItem } from '@/types/dataset'

interface UseFormatModalProps {
  isOpen: boolean
  dataset: DatasetItem | null
  projectId: string
  onSaveComplete?: () => void
}

const initialState: FormatModalState = {
  messages: [], generatedCode: '', previewCsv: null,
  loading: false, executing: false, saving: false, error: null
}

const toBase64 = (str: string) => btoa(unescape(encodeURIComponent(str)))
const fromBase64 = (str: string) => decodeURIComponent(escape(atob(str)))
const createMessage = (role: 'user' | 'assistant', content: string): FormatMessage => ({
  id: crypto.randomUUID(), role, content, timestamp: new Date()
})

export function useFormatModal({ isOpen, dataset, projectId, onSaveComplete }: UseFormatModalProps) {
  const [state, setState] = useState<FormatModalState>(initialState)
  const update = (partial: Partial<FormatModalState>) => setState(prev => ({ ...prev, ...partial }))

  useEffect(() => { if (!isOpen) setState(initialState) }, [isOpen])

  const sendPrompt = useCallback(async (prompt: string) => {
    if (!dataset?.csvText) return
    update({ messages: [...state.messages, createMessage('user', prompt)], loading: true, error: null })

    try {
      const { code, explanation } = await formatData({ prompt, csvSample: dataset.csvText, fileName: dataset.fileName })
      update({ messages: [...state.messages, createMessage('user', prompt), createMessage('assistant', explanation)], generatedCode: code, loading: false })
    } catch (e) {
      update({ loading: false, error: e instanceof Error ? e.message : 'Failed to generate script' })
    }
  }, [dataset, state.messages])

  const runScript = useCallback(async () => {
    if (!dataset?.csvText || !state.generatedCode) return
    update({ executing: true, error: null })

    try {
      const response = await executeScript({
        code: state.generatedCode,
        csv_file: { filename: 'input.csv', data_base64: toBase64(dataset.csvText) }
      })
      if (!response.success) return update({ executing: false, error: response.stderr || 'Execution failed' })
      if (!response.csv_output) return update({ executing: false, error: 'No output generated' })
      update({ previewCsv: fromBase64(response.csv_output.data_base64), executing: false })
    } catch (e) {
      update({ executing: false, error: e instanceof Error ? e.message : 'Execution failed' })
    }
  }, [dataset, state.generatedCode])

  const saveResult = useCallback(async () => {
    if (!state.previewCsv || !dataset) return
    update({ saving: true, error: null })

    try {
      const newFileName = `${dataset.fileName.replace(/\.csv$/i, '')}_formatted.csv`
      await saveDataset({ projectId, fileName: newFileName, csvText: state.previewCsv })
      update({ saving: false })
      onSaveComplete?.()
    } catch (e) {
      update({ saving: false, error: e instanceof Error ? e.message : 'Failed to save' })
    }
  }, [state.previewCsv, dataset, projectId, onSaveComplete])

  const updateCode = useCallback((code: string) => update({ generatedCode: code, previewCsv: null }), [])

  return { ...state, sendPrompt, runScript, saveResult, updateCode }
}
