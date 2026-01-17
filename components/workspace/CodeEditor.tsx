'use client'

import { Editor } from '@monaco-editor/react'
import type { Language } from '@/types/database'

interface CodeEditorProps {
  value: string
  onChange: (value: string) => void
  readOnly?: boolean
  language?: Language
}

export function CodeEditor({ value, onChange, readOnly = false, language = 'r' }: CodeEditorProps) {
  return (
    <Editor
      height="100%"
      defaultLanguage={language}
      language={language}
      value={value}
      onChange={(value) => onChange(value || '')}
      theme="vs-dark"
      options={{
        minimap: { enabled: false },
        fontSize: 14,
        lineNumbers: 'on',
        scrollBeyondLastLine: false,
        automaticLayout: true,
        readOnly: readOnly,
        padding: { top: 16, bottom: 16 },
      }}
    />
  )
}
