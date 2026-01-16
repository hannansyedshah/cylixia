'use server'

import { createClient } from '@/lib/supabase/server'
import type { CsvUpload } from '@/types/dataset'
import { canAccessProject } from './collaborators'

interface SaveDatasetParams {
  projectId: string
  fileName: string
  csvText: string
}

export async function saveDataset(params: SaveDatasetParams): Promise<CsvUpload | null> {
  const { projectId, fileName, csvText } = params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return null

  const { data: project } = await supabase
    .from('projects')
    .select('user_id')
    .eq('id', projectId)
    .single()

  if (!project || project.user_id !== user.id) return null

  const id = crypto.randomUUID()
  const storagePath = `${user.id}/${projectId}/${id}.csv`

  const blob = new Blob([csvText], { type: 'text/csv' })
  const { error: uploadError } = await supabase.storage
    .from('csvupload')
    .upload(storagePath, blob, {
      cacheControl: '3600',
      upsert: false
    })

  if (uploadError) throw new Error(uploadError.message)

  const { data: upload, error: dbError } = await supabase
    .from('csv_uploads')
    .insert({
      id,
      project_id: projectId,
      user_id: user.id,
      file_name: fileName,
      storage_path: storagePath
    })
    .select()
    .single()

  if (dbError) {
    await supabase.storage.from('csvupload').remove([storagePath])
    throw new Error(dbError.message)
  }

  return upload
}

export async function getDatasets(projectId: string): Promise<CsvUpload[]> {
  const hasAccess = await canAccessProject(projectId)
  if (!hasAccess) return []

  const supabase = await createClient()
  const { data } = await supabase
    .from('csv_uploads')
    .select('*')
    .eq('project_id', projectId)
    .order('created_at', { ascending: false })

  return data || []
}

export async function deleteDataset(id: string): Promise<boolean> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return false

  const { data: upload } = await supabase
    .from('csv_uploads')
    .select('storage_path')
    .eq('id', id)
    .eq('user_id', user.id)
    .single()

  if (!upload) return false

  await supabase.storage.from('csvupload').remove([upload.storage_path])

  const { error } = await supabase
    .from('csv_uploads')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id)

  return !error
}

export async function getDatasetContent(id: string): Promise<string | null> {
  const supabase = await createClient()

  const { data: upload } = await supabase
    .from('csv_uploads')
    .select('storage_path, project_id')
    .eq('id', id)
    .single()

  if (!upload) return null

  const hasAccess = await canAccessProject(upload.project_id)
  if (!hasAccess) return null

  const { data, error } = await supabase.storage
    .from('csvupload')
    .download(upload.storage_path)

  if (error || !data) return null

  return await data.text()
}
