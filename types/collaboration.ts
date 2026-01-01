// Collaboration-related types

import type { Profile } from './database'

export type CollaboratorRole = 'owner' | 'edit' | 'view'
export type CollaboratorStatus = 'pending' | 'accepted' | 'rejected'

export interface Collaborator {
  id: string
  project_id: string
  user_id: string
  role: CollaboratorRole
  status: CollaboratorStatus
  created_at: string
  profiles?: Profile | null
}

export interface CollaborationRequest {
  id: string
  project_id: string
  from_user_id: string
  to_user_id: string
  role: 'edit' | 'view'
  status: CollaboratorStatus
  created_at: string
  project?: { name: string } | null
  from_profile?: Profile | null
}

export interface ChatMessage {
  id: string
  project_id: string
  user_id: string
  message: string
  code_selection: string | null
  code_selection_start_line: number | null
  code_selection_end_line: number | null
  created_at: string
  profiles?: Profile | null
}
