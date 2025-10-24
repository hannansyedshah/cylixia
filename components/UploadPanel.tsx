'use client'

import { useState, useRef } from 'react'
import { Upload, X } from 'lucide-react'
import { Button } from '@/components/ui/button'

export function UploadPanel() {
  const [fileName, setFileName] = useState<string | null>(null)
  const [datasetId, setDatasetId] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setFileName(file.name)
    
    const formData = new FormData()
    formData.append('file', file)

    try {
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      })

      const data = await response.json()
      setDatasetId(data.datasetId)
    } catch (error) {
      console.error('Upload failed:', error)
    }
  }

  const handleClear = () => {
    setFileName(null)
    setDatasetId(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  return (
    <div className="p-4 border-b bg-gradient-to-r from-white to-blue-50/30 dark:from-gray-800 dark:to-blue-950/30">
      {fileName ? (
        <div className="flex items-center justify-between bg-gradient-to-r from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 p-3 rounded-xl shadow-md border border-green-200 dark:border-green-700 animate-fade-in-up">
          <span className="text-sm font-medium text-green-700 dark:text-green-300">
            📊 {fileName}
          </span>
          <Button variant="ghost" size="icon" onClick={handleClear} className="hover:bg-red-100 dark:hover:bg-red-900/20">
            <X className="h-4 w-4 text-red-600" />
          </Button>
        </div>
      ) : (
        <div className="flex items-center space-x-2">
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv"
            onChange={handleFileSelect}
            className="hidden"
            id="file-upload"
          />
          <label htmlFor="file-upload" className="flex-1 cursor-pointer">
            <div className="w-full inline-flex items-center justify-center whitespace-nowrap rounded-xl text-sm font-medium transition-all duration-200 border-2 border-dashed border-rstudio/30 bg-white dark:bg-gray-700 hover:bg-rstudio/5 dark:hover:bg-rstudio/10 text-rstudio dark:text-white h-12 px-4 py-2 transform hover:scale-105 active:scale-95 shadow-md hover:shadow-lg">
              <Upload className="h-5 w-5 mr-2 animate-bounce" />
              <span className="font-semibold">Upload CSV Dataset</span>
            </div>
          </label>
        </div>
      )}
    </div>
  )
}

