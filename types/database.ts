// Core database entity types

export interface Project {
  id: string
  user_id: string
  name: string
  description: string | null
  code: string | null
  hipaa_compliant: boolean
  context_window: string | null
  created_at: string
  updated_at: string
}

export interface Profile {
  id: string
  display_name: string | null
  avatar_url: string | null
  created_at: string
  updated_at: string
}

export interface Message {
  id: string
  project_id: string
  role: 'user' | 'assistant'
  content: string
  code: string | null
  plot_url: string | null
  created_at: string
}

export interface CodeVersion {
  id: string
  project_id: string
  version_number: number
  code: string
  plot_url: string | null
  description: string | null
  user_id: string
  created_at: string
}
