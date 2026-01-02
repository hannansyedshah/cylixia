'use client'

import { Editor } from '@monaco-editor/react'

interface CodeEditorProps {
  value: string
  onChange: (value: string) => void
  readOnly?: boolean
}

export function CodeEditor({ value, onChange, readOnly = false }: CodeEditorProps) {
  return (
    <Editor
      height="100%"
      defaultLanguage="r"
      value={value}
      onChange={(value) => onChange(value || '')}
      theme="light"
      options={{
        minimap: { enabled: false },
        fontSize: 14,
        lineNumbers: 'on',
        scrollBeyondLastLine: false,
        automaticLayout: true,
        readOnly: readOnly,
      }}
    />
  )
}

