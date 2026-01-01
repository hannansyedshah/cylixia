// User and profile-related types

import type { User as SupabaseUser } from '@supabase/supabase-js'

export interface SessionUser extends SupabaseUser {
  id: string
  email?: string
}

export interface UserSearchResult {
  id: string
  display_name: string | null
  avatar_url: string | null
}

export interface SessionStore {
  user: SessionUser | null
  setUser: (user: SessionUser | null) => void
}
