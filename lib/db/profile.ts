'use server'

import { createClient } from '@/lib/supabase/server'
import type { Profile } from '@/types/database'

interface UpdateProfileData {
  display_name?: string
  bio?: string
  location?: string
  website?: string
  avatar_url?: string
}

export async function getProfile(): Promise<Profile | null> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data: profile, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  if (error && error.code !== 'PGRST116') return null

  // Create profile if doesn't exist
  if (!profile) {
    const { data: newProfile, error: createError } = await supabase
      .from('profiles')
      .insert({
        id: user.id,
        display_name: user.email?.split('@')[0] || 'User',
      })
      .select()
      .single()

    if (createError) return null
    return newProfile
  }

  return profile
}

export async function updateProfile(data: UpdateProfileData): Promise<Profile | null> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const updates: any = {}
  if (data.display_name !== undefined) updates.display_name = data.display_name
  if (data.bio !== undefined) updates.bio = data.bio
  if (data.location !== undefined) updates.location = data.location
  if (data.website !== undefined) updates.website = data.website
  if (data.avatar_url !== undefined) updates.avatar_url = data.avatar_url

  const { data: profile, error } = await supabase
    .from('profiles')
    .update(updates)
    .eq('id', user.id)
    .select()
    .single()

  if (error) return null
  return profile
}
