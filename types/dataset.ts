// Dataset and CSV-related types

export interface DatasetItem {
  id: string
  fileName: string
  sizeBytes: number
  persisted: boolean
  includeChat: boolean
  includeRun: boolean
  csvText?: string
  excludedColumns?: string[]
}

export interface SharedDataset {
  id: string
  project_id: string
  user_id: string
  file_name: string
  csv_text: string
  size_bytes: number
  include_chat: boolean
  include_run: boolean
  created_at: string
}

export interface ColumnInfo {
  name: string
  type: 'numeric' | 'text' | 'date' | 'boolean'
  min?: number
  max?: number
  uniqueValues?: string[]
}

export interface RedactionResult {
  redactedData: string
  redactedColumns: string[]
}

export interface CsvUpload {
  id: string
  project_id: string
  user_id: string
  file_name: string
  storage_path: string
  created_at: string
}
