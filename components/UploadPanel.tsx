'use client'

import { useState, useRef } from 'react'
import { Upload, X, Maximize2 } from 'lucide-react'
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
  const [showPreview, setShowPreview] = useState<boolean>(false)

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
    <div className="p-3 border-b bg-gradient-to-r from-white to-blue-50/30 dark:from-gray-800 dark:to-blue-950/30">
      {fileName ? (
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center max-w-[60%] truncate px-2 py-1 rounded-full text-xs font-medium bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-300 border border-green-200 dark:border-green-700">
            📊 <span className="ml-1 truncate">{fileName}</span>
          </span>
          <Button size="sm" variant="outline" onClick={() => setShowPreview(true)} className="h-7 px-2">
            <Maximize2 className="h-3.5 w-3.5 mr-1" />
            View data
          </Button>
          <Button variant="ghost" size="icon" onClick={handleClear} className="h-7 w-7 hover:bg-red-100 dark:hover:bg-red-900/20 ml-auto">
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

      {showPreview && csvData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowPreview(false)}></div>
          <div className="relative bg-white dark:bg-gray-900 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 w-[90vw] max-w-6xl h-[80vh] p-4 flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-gray-200 dark:border-gray-700">
              <div className="text-sm font-semibold text-darktext dark:text-white truncate">{fileName}</div>
              <Button variant="ghost" size="icon" onClick={() => setShowPreview(false)}>
                <X className="h-5 w-5" />
              </Button>
            </div>
            <div className="flex-1 min-h-0 overflow-hidden mt-3 grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
                <div className="px-3 py-2 text-xs font-medium bg-blue-50 dark:bg-blue-950/30 border-b border-gray-200 dark:border-gray-700 text-darktext dark:text-white">Randomized (privacy ON)</div>
                <div className="p-2 h-[calc(100%-30px)] overflow-auto">
                  <DataPreview originalData={csvData} fileName={fileName || 'data.csv'} privacyMode={true} />
                </div>
              </div>
              <div className="rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
                <div className="px-3 py-2 text-xs font-medium bg-orange-50 dark:bg-orange-950/20 border-b border-gray-200 dark:border-gray-700 text-darktext dark:text-white">Original (privacy OFF)</div>
                <div className="p-2 h-[calc(100%-30px)] overflow-auto">
                  <DataPreview originalData={csvData} fileName={fileName || 'data.csv'} privacyMode={false} />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

