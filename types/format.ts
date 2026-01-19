// Format Modal UI State Types

export interface FormatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
}

export interface FormatModalState {
  messages: FormatMessage[]
  generatedCode: string
  previewCsv: string | null
  loading: boolean
  executing: boolean
  saving: boolean
  error: string | null
}
