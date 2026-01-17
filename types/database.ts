// Core database entity types

export type Language = 'r' | 'python'

export interface Project {
  id: string
  user_id: string
  name: string
  description: string | null
  code: string | null
  hipaa_compliant: boolean
  context_window: string | null
  language: Language
  created_at: string
  updated_at: string
}

export interface Profile {
  id: string
  display_name: string | null
  avatar_url: string | null
  bio?: string | null
  location?: string | null
  website?: string | null
  created_at?: string
  updated_at?: string
}

export interface PartialProfile {
  id: string
  display_name: string | null
  avatar_url: string | null
}

export interface Message {
  id: string
  project_id?: string
  role: 'user' | 'assistant'
  content: string
  code?: string | null
  plot_url?: string | null
  created_at: string
  user_id?: string
  profiles?: Profile | PartialProfile | null
}

export interface CodeVersion {
  id: string
  project_id: string
  version_number: number
  code: string
  plot_url: string | null
  description: string | null
  user_id: string
  language: Language
  created_at: string
}

export interface SavePlotParams {
  projectId: string
  plotBase64: string
}

export interface Collaborator {
  id: string
  project_id: string
  email: string
  user_id: string | null
  status: 'pending' | 'accepted'
  role: 'editor' | 'viewer'
  invited_by: string
  created_at: string
}
