'use server'

import { createClient } from '@/lib/supabase/server'
import type { SharedDataset } from '@/types/dataset'

interface ShareDatasetData {
  file_name: string
  csv_text: string
  size_bytes: number
  include_chat?: boolean
  include_run?: boolean
}

export async function getSharedDatasets(projectId: string): Promise<SharedDataset[]> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  const { data: datasets } = await supabase
    .from('shared_datasets')
    .select('*')
    .eq('project_id', projectId)
    .order('created_at', { ascending: false })

  if (!datasets?.length) return []

  // Get profiles for dataset sharers
  const userIds = [...new Set(datasets.map(d => d.user_id).filter(Boolean))]
  let profiles: any[] = []

  if (userIds.length > 0) {
    const { data: profilesData } = await supabase
      .from('profiles')
      .select('id, display_name, avatar_url')
      .in('id', userIds)

    if (profilesData) profiles = profilesData
  }

  return datasets.map(dataset => ({
    ...dataset,
    profiles: profiles.find(p => p.id === dataset.user_id) || null
  }))
}

export async function shareDataset(projectId: string, data: ShareDatasetData): Promise<SharedDataset | null> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  // Check user has edit access
  const { data: project } = await supabase
    .from('projects')
    .select('user_id')
    .eq('id', projectId)
    .single()

  if (!project) return null

  let canShare = project.user_id === user.id

  if (!canShare) {
    const { data: collaborator } = await supabase
      .from('project_collaborators')
      .select('role')
      .eq('project_id', projectId)
      .eq('user_id', user.id)
      .eq('status', 'accepted')
      .single()

    canShare = collaborator?.role === 'owner' || collaborator?.role === 'edit'
  }

  if (!canShare) return null

  const { data: dataset, error } = await supabase
    .from('shared_datasets')
    .insert({
      project_id: projectId,
      user_id: user.id,
      file_name: data.file_name,
      csv_text: data.csv_text,
      size_bytes: data.size_bytes,
      include_chat: data.include_chat ?? true,
      include_run: data.include_run ?? true
    })
    .select()
    .single()

  if (error) return null

  // Get profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('id, display_name, avatar_url')
    .eq('id', user.id)
    .single()

  return { ...dataset, profiles: profile || null }
}

export async function deleteDataset(projectId: string, datasetId: string): Promise<boolean> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return false

  const { error } = await supabase
    .from('shared_datasets')
    .delete()
    .eq('id', datasetId)
    .eq('project_id', projectId)

  return !error
}
