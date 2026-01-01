// Workspace and editor-related types

export interface ProjectUpdate {
  id: string
  code: string
  updated_at: string
}

export interface TypingUser {
  id: string
  displayName: string
  avatarUrl?: string | null
}

export interface ActiveUser {
  userId: string
  displayName: string
  avatarUrl?: string | null
  lastSeen: number
}

export interface ContextFields {
  researchQuestion: string
  dataDescription: string
  methodology: string
  expectedOutcome: string
}
