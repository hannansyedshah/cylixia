'use server'

import { createClient } from '@/lib/supabase/server'
import type { Collaborator } from '@/types/database'

export interface CollaboratorWithProject extends Collaborator {
  project_name: string
}

export async function canAccessProject(projectId: string): Promise<boolean> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return false

  // Check if owner
  const { data: project } = await supabase
    .from('projects')
    .select('user_id')
    .eq('id', projectId)
    .single()

  if (project?.user_id === user.id) return true

  // Check if accepted collaborator
  const { data: collab } = await supabase
    .from('project_collaborators')
    .select('id')
    .eq('project_id', projectId)
    .eq('user_id', user.id)
    .eq('status', 'accepted')
    .single()

  return !!collab
}

// Invite collaborator by email (owner only)
export async function inviteCollaborator(projectId: string, email: string): Promise<Collaborator | null> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const normalizedEmail = email.toLowerCase().trim()
  if (!normalizedEmail) return null

  // Verify caller owns the project
  const { data: project } = await supabase
    .from('projects')
    .select('user_id')
    .eq('id', projectId)
    .single()

  if (!project || project.user_id !== user.id) return null

  // Create invite as pending - user accepts when they log in
  const { data: collab, error } = await supabase
    .from('project_collaborators')
    .insert({
      project_id: projectId,
      email: normalizedEmail,
      user_id: null,
      status: 'pending',
      invited_by: user.id,
    })
    .select()
    .single()

  if (error) return null
  return collab
}

// Get collaborators for a project
export async function getCollaborators(projectId: string): Promise<Collaborator[]> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  // Verify user has access to project
  const hasAccess = await canAccessProject(projectId)
  if (!hasAccess) return []

  const { data } = await supabase
    .from('project_collaborators')
    .select('*')
    .eq('project_id', projectId)
    .order('created_at', { ascending: true })

  return data || []
}

// Remove collaborator (owner only)
export async function removeCollaborator(collaboratorId: string): Promise<boolean> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return false

  // Get collaborator to find project
  const { data: collab } = await supabase
    .from('project_collaborators')
    .select('project_id')
    .eq('id', collaboratorId)
    .single()

  if (!collab) return false

  // Verify caller owns the project
  const { data: project } = await supabase
    .from('projects')
    .select('user_id')
    .eq('id', collab.project_id)
    .single()

  if (!project || project.user_id !== user.id) return false

  const { error } = await supabase
    .from('project_collaborators')
    .delete()
    .eq('id', collaboratorId)

  return !error
}

// Get pending invitations for current user
export async function getPendingInvitations(): Promise<CollaboratorWithProject[]> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user || !user.email) return []

  const { data } = await supabase
    .from('project_collaborators')
    .select(`
      *,
      projects!inner(name)
    `)
    .eq('email', user.email.toLowerCase())
    .eq('status', 'pending')

  if (!data) return []

  return data.map(d => ({
    ...d,
    project_name: (d.projects as { name: string }).name,
    projects: undefined,
  })) as CollaboratorWithProject[]
}

// Accept invitation
export async function acceptInvitation(collaboratorId: string): Promise<boolean> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user || !user.email) return false

  const { error } = await supabase
    .from('project_collaborators')
    .update({
      user_id: user.id,
      status: 'accepted',
    })
    .eq('id', collaboratorId)
    .eq('email', user.email.toLowerCase())
    .eq('status', 'pending')

  return !error
}
