'use client'

import { Editor } from '@monaco-editor/react'
import { useState, useEffect, useRef } from 'react'
import { useRealtimeProject } from '@/hooks/useRealtimeProject'
import { Wifi, WifiOff } from 'lucide-react'

interface CodeEditorCollaborativeProps {
  value: string
  onChange: (value: string) => void
  projectId: string
  readOnly?: boolean
}

export function CodeEditorCollaborative({ 
  value, 
  onChange, 
  projectId,
  readOnly = false 
}: CodeEditorCollaborativeProps) {
  const [theme, setTheme] = useState<'light' | 'vs-dark'>('light')
  const [localValue, setLocalValue] = useState(value)
  const isLocalChangeRef = useRef(false)

  const { isConnected, broadcastCodeChange } = useRealtimeProject({
    projectId,
    onCodeChange: (code) => {
      // Only update if change came from another user
      if (!isLocalChangeRef.current) {
        setLocalValue(code)
        onChange(code)
      }
      isLocalChangeRef.current = false
    }
  })

  useEffect(() => {
    setLocalValue(value)
  }, [value])

  useEffect(() => {
    const isDark = document.documentElement.classList.contains('dark')
    setTheme(isDark ? 'vs-dark' : 'light')

    const observer = new MutationObserver(() => {
      const isDark = document.documentElement.classList.contains('dark')
      setTheme(isDark ? 'vs-dark' : 'light')
    })

    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class'],
    })

    return () => observer.disconnect()
  }, [])

  const handleChange = (newValue: string | undefined) => {
    const code = newValue || ''
    setLocalValue(code)
    isLocalChangeRef.current = true
    onChange(code)
    
    // Broadcast change to other collaborators
    if (!readOnly) {
      broadcastCodeChange(code)
    }
  }

  return (
    <div className="relative h-full">
      <div className="absolute top-2 right-2 z-10 flex items-center space-x-2 bg-white/90 dark:bg-gray-900/90 px-2 py-1 rounded-md shadow-sm">
        {isConnected ? (
          <>
            <Wifi className="w-4 h-4 text-green-500" />
            <span className="text-xs text-gray-600 dark:text-gray-400">Live</span>
          </>
        ) : (
          <>
            <WifiOff className="w-4 h-4 text-gray-400" />
            <span className="text-xs text-gray-600 dark:text-gray-400">Offline</span>
          </>
        )}
      </div>
      <Editor
        height="100%"
        defaultLanguage="r"
        value={localValue}
        onChange={handleChange}
        theme={theme}
        options={{
          minimap: { enabled: false },
          fontSize: 14,
          lineNumbers: 'on',
          scrollBeyondLastLine: false,
          automaticLayout: true,
          readOnly: readOnly,
        }}
      />
    </div>
  )
}

