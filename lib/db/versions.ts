'use server'

import { createClient } from '@/lib/supabase/server'
import { parsePlotUrls, deletePlots } from '@/lib/db/plots'

interface CodeVersion {
  id: string
  project_id: string
  version_number: number
  code: string
  plot_url?: string | null
  description: string
  user_id: string
  created_at: string
  profiles?: {
    id: string
    display_name: string
    avatar_url?: string
  } | null
}

interface SaveVersionData {
  code: string
  plot_url?: string | null
  description: string
}

export async function getVersions(projectId: string): Promise<CodeVersion[]> {
  const supabase = await createClient()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) return []

  const { data: versions } = await supabase
    .from('code_versions')
    .select('*')
    .eq('project_id', projectId)
    .order('version_number', { ascending: false })

  if (!versions?.length) return []

  // Get profiles for version creators
  const userIds = [...new Set(versions.map(v => v.user_id).filter(Boolean))]
  let profiles: any[] = []

  if (userIds.length > 0) {
    const { data: profilesData } = await supabase
      .from('profiles')
      .select('id, display_name, avatar_url')
      .in('id', userIds)

    if (profilesData) profiles = profilesData
  }

  return versions.map(version => ({
    ...version,
    profiles: profiles.find(p => p.id === version.user_id) || null
  }))
}

export async function saveVersion(projectId: string, data: SaveVersionData): Promise<CodeVersion | null> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  // Get next version number
  const { data: lastVersion } = await supabase
    .from('code_versions')
    .select('version_number')
    .eq('project_id', projectId)
    .order('version_number', { ascending: false })
    .limit(1)
    .single()

  const nextVersionNumber = lastVersion ? lastVersion.version_number + 1 : 1

  const { data: version, error } = await supabase
    .from('code_versions')
    .insert({
      project_id: projectId,
      version_number: nextVersionNumber,
      code: data.code,
      plot_url: data.plot_url,
      description: data.description || `Version ${nextVersionNumber}`,
      user_id: user.id
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

  return { ...version, profiles: profile || null }
}

export async function restoreVersion(projectId: string, versionId: string): Promise<{ code: string; plot_url?: string | null } | null> {
  const supabase = await createClient()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) return null

  const { data: version } = await supabase
    .from('code_versions')
    .select('*')
    .eq('id', versionId)
    .eq('project_id', projectId)
    .single()

  if (!version) return null

  const { error } = await supabase
    .from('projects')
    .update({
      code: version.code,
      plot_url: version.plot_url
    })
    .eq('id', projectId)

  if (error) return null

  return { code: version.code, plot_url: version.plot_url }
}

export async function deleteVersion(versionId: string): Promise<boolean> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return false

  const { data: version } = await supabase
    .from('code_versions')
    .select('id, plot_url, user_id')
    .eq('id', versionId)
    .single()

  if (!version || version.user_id !== user.id) return false

  const plotUrls = await parsePlotUrls(version.plot_url)
  if (plotUrls.length > 0) {
    await deletePlots(plotUrls)
  }

  const { error } = await supabase
    .from('code_versions')
    .delete()
    .eq('id', versionId)
    .eq('user_id', user.id)

  return !error
}
