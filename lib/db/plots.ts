'use server'

import { createClient } from '@/lib/supabase/server'
export { parsePlotUrls } from '@/lib/utils/plotUrls'

interface SavePlotParams {
  projectId: string
  plotBase64: string  
}

async function savePlot(params: SavePlotParams): Promise<string | null> {
  const { projectId, plotBase64 } = params
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
  const storagePath = `${user.id}/${projectId}/${id}.png`

  const binaryString = atob(plotBase64)
  const bytes = new Uint8Array(binaryString.length)
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i)
  }

  const { error } = await supabase.storage
    .from('plots')
    .upload(storagePath, bytes, {
      contentType: 'image/png',
      cacheControl: '3600',
      upsert: false
    })

  if (error) return null

  const { data: { publicUrl } } = supabase.storage
    .from('plots')
    .getPublicUrl(storagePath)

  return publicUrl
}

export async function savePlots(projectId: string, plotsBase64: string[]): Promise<string[]> {
  const urls: string[] = []

  for (const plotBase64 of plotsBase64) {
    const url = await savePlot({ projectId, plotBase64 })
    if (url) urls.push(url)
  }

  return urls
}

export async function deletePlot(plotUrl: string): Promise<boolean> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return false

  const match = plotUrl.match(/\/storage\/v1\/object\/public\/plots\/(.+)$/)
  if (!match) return false

  const storagePath = match[1]

  if (!storagePath.startsWith(user.id)) return false

  const { error } = await supabase.storage
    .from('plots')
    .remove([storagePath])

  return !error
}

export async function deletePlots(plotUrls: string[]): Promise<void> {
  for (const url of plotUrls) {
    await deletePlot(url)
  }
}
