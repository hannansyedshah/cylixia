// Workspace and editor-related types

export type ViewMode = 'plot' | 'plot-terminal' | 'plot-data'

export interface ProjectUpdate {
  id: string
  code: string
  updated_at: string
}

export interface TypingUser {
  userId: string
  displayName: string
  avatarUrl?: string | null
}

export interface ActiveUser {
  userId: string
  displayName: string
  avatarUrl?: string | null
  activity: 'typing' | 'editing' | 'active'
  lastSeen: number
}

export interface ContextFields {
  studyType: string
  objective: string
  keyFields: string
  analysisTypes: string[]
  additionalNotes: string
  excludedFields: string[]
}
