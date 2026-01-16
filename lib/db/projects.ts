'use server'

import { createClient } from '@/lib/supabase/server'
import type { Project, Message } from '@/types/database'
import { canAccessProject } from '@/lib/db/collaborators'

export interface ProjectWithData extends Project {
  messages?: Message[]
  stdout?: string
  stderr?: string
  plot_url?: string | null
  is_shared?: boolean
}

interface CreateProjectData {
  name: string
  description?: string
  hipaaCompliant?: boolean
}

interface UpdateProjectData {
  name?: string
  description?: string
  code?: string
  context_window?: string
  stdout?: string
  stderr?: string
  plot_url?: string | null
}

export async function getProjects(): Promise<(Project & { is_shared: boolean })[]> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  // Get owned projects
  const { data: ownedProjects } = await supabase
    .from('projects')
    .select('*')
    .eq('user_id', user.id)
    .order('updated_at', { ascending: false })

  // Get shared project IDs where user is accepted collaborator
  const { data: collabs } = await supabase
    .from('project_collaborators')
    .select('project_id')
    .eq('user_id', user.id)
    .eq('status', 'accepted')

  const sharedProjectIds = collabs?.map(c => c.project_id) || []

  // Get shared projects
  let sharedProjects: Project[] = []
  if (sharedProjectIds.length > 0) {
    const { data } = await supabase
      .from('projects')
      .select('*')
      .in('id', sharedProjectIds)
      .order('updated_at', { ascending: false })
    sharedProjects = data || []
  }

  // Combine and mark
  const owned = (ownedProjects || []).map(p => ({ ...p, is_shared: false }))
  const shared = sharedProjects.map(p => ({ ...p, is_shared: true }))

  return [...owned, ...shared].sort(
    (a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
  )
}

export async function getProject(id: string): Promise<ProjectWithData | null> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data: project, error } = await supabase
    .from('projects')
    .select('*')
    .eq('id', id)
    .single()

  if (error || !project) return null

  // Check if owner or collaborator
  const isOwner = project.user_id === user.id
  const hasAccess = isOwner || await canAccessProject(id)
  if (!hasAccess) return null

  // Get messages
  const { data: messages } = await supabase
    .from('messages')
    .select('*')
    .eq('project_id', id)
    .order('created_at', { ascending: true })

  return { ...project, messages: messages || [], is_shared: !isOwner }
}

export async function createProject(data: CreateProjectData): Promise<Project | null> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const trimmedName = (data.name || '').trim()
  if (!trimmedName) return null

  // Check for duplicate name
  const { data: existing } = await supabase
    .from('projects')
    .select('id')
    .eq('user_id', user.id)
    .ilike('name', trimmedName)
    .maybeSingle()

  if (existing) return null

  const { data: project, error } = await supabase
    .from('projects')
    .insert({
      user_id: user.id,
      name: trimmedName,
      description: data.description,
      code: '# Your R code will appear here\n',
      hipaa_compliant: data.hipaaCompliant || false,
    })
    .select()
    .single()

  if (error) return null
  return project
}

export async function updateProject(projectId: string, data: UpdateProjectData): Promise<Project | null> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  // Check access (owner or collaborator)
  const { data: projectCheck } = await supabase
    .from('projects')
    .select('user_id')
    .eq('id', projectId)
    .single()

  if (!projectCheck) return null

  const isOwner = projectCheck.user_id === user.id
  const hasAccess = isOwner || await canAccessProject(projectId)
  if (!hasAccess) return null

  // Only owner can rename
  if (data.name !== undefined && !isOwner) return null

  // Validate name if being updated
  if (data.name !== undefined) {
    const trimmedName = data.name.trim()
    if (!trimmedName) return null

    const { data: conflict } = await supabase
      .from('projects')
      .select('id')
      .eq('user_id', user.id)
      .ilike('name', trimmedName)
      .neq('id', projectId)
      .maybeSingle()

    if (conflict) return null
    data.name = trimmedName
  }

  const { data: project, error } = await supabase
    .from('projects')
    .update(data)
    .eq('id', projectId)
    .select()
    .single()

  if (error) return null
  return project
}

export async function deleteProject(projectId: string): Promise<boolean> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return false

  // Only owners can delete
  const { data: project } = await supabase
    .from('projects')
    .select('user_id')
    .eq('id', projectId)
    .single()

  if (!project || project.user_id !== user.id) return false

  const { error } = await supabase
    .from('projects')
    .delete()
    .eq('id', projectId)
    .eq('user_id', user.id)

  return !error
}

export async function updateCode(projectId: string, code: string): Promise<void> {
  await updateProject(projectId, { code })
}

export async function saveContext(projectId: string, context: string): Promise<void> {
  await updateProject(projectId, { context_window: context })
}

export async function saveOutput(projectId: string, stdout: string, stderr: string): Promise<void> {
  await updateProject(projectId, { stdout, stderr })
}
