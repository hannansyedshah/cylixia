'use client'

import { useState, useRef } from 'react'
import { Upload, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { DataPreview } from '@/components/DataPreview'

interface UploadPanelProps {
  onDatasetUpload?: (csvData: string, fileName: string) => void
  privacyMode?: boolean
}

export function UploadPanel({ onDatasetUpload, privacyMode = true }: UploadPanelProps) {
  const [fileName, setFileName] = useState<string | null>(null)
  const [csvData, setCsvData] = useState<string | null>(null)
  const [datasetId, setDatasetId] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setFileName(file.name)
    
    // Read CSV content
    const reader = new FileReader()
    reader.onload = async (event) => {
      const csvData = event.target?.result as string
      
      // Store CSV data locally for preview
      setCsvData(csvData)
      
      // Store dataset ID for potential future use
      setDatasetId(file.name)
      
      // Pass CSV data to parent component immediately
      if (onDatasetUpload && csvData) {
        onDatasetUpload(csvData, file.name)
        console.log('✅ CSV data passed to workspace:', file.name, csvData.length, 'chars')
      }
    }
    
    reader.readAsText(file)
  }

  const handleClear = () => {
    setFileName(null)
    setCsvData(null)
    setDatasetId(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
    // Notify parent component that CSV data should be cleared
    if (onDatasetUpload) {
      onDatasetUpload('', '')
    }
  }

  return (
    <div className="p-4 border-b bg-gradient-to-r from-white to-blue-50/30 dark:from-gray-800 dark:to-blue-950/30">
      {fileName ? (
        <div className="space-y-2">
          <div className="flex items-center justify-between bg-gradient-to-r from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 p-3 rounded-xl shadow-md border border-green-200 dark:border-green-700 animate-fade-in-up">
            <span className="text-sm font-medium text-green-700 dark:text-green-300">
              📊 {fileName}
            </span>
            <Button variant="ghost" size="icon" onClick={handleClear} className="hover:bg-red-100 dark:hover:bg-red-900/20">
              <X className="h-4 w-4 text-red-600" />
            </Button>
          </div>
          <div className={`px-3 py-2 rounded-lg text-xs font-medium ${
            privacyMode 
              ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' 
              : 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400'
          }`}>
            {privacyMode ? '🔒 Privacy Protected: AI will receive randomized data' : '⚠️ Privacy Warning: AI will receive original data'}
          </div>
          
          {/* Data Preview */}
          {csvData && (
            <DataPreview 
              originalData={csvData}
              fileName={fileName}
              privacyMode={privacyMode}
            />
          )}
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

