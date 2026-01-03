'use server'

import { createClient } from '@/lib/supabase/server'
import { parsePlotUrls, deletePlots } from '@/lib/db/plots'
import type { Message } from '@/types/database'

interface CreateMessageData {
  role: 'user' | 'assistant'
  content: string
  code?: string
  plot_url?: string
}

export async function getMessages(projectId: string): Promise<Message[]> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  // Only owner can access
  const { data: project } = await supabase
    .from('projects')
    .select('id, user_id')
    .eq('id', projectId)
    .single()

  if (!project || project.user_id !== user.id) return []

  const { data: messages } = await supabase
    .from('messages')
    .select('*')
    .eq('project_id', projectId)
    .order('created_at', { ascending: true })

  return messages || []
}

export async function createMessage(projectId: string, data: CreateMessageData): Promise<Message | null> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  // Only owner can create messages
  const { data: project } = await supabase
    .from('projects')
    .select('id, user_id')
    .eq('id', projectId)
    .single()

  if (!project || project.user_id !== user.id) return null

  const messageData: any = {
    project_id: projectId,
    role: data.role,
    content: data.content,
    code: data.code,
    plot_url: data.plot_url,
  }

  if (data.role === 'user') {
    messageData.user_id = user.id
  }

  const { data: message, error } = await supabase
    .from('messages')
    .insert(messageData)
    .select()
    .single()

  if (error) return null
  return message
}

export async function deleteMessage(messageId: string): Promise<boolean> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return false

  const { data: message } = await supabase
    .from('messages')
    .select('id, plot_url, project_id')
    .eq('id', messageId)
    .single()

  if (!message) return false

  const { data: project } = await supabase
    .from('projects')
    .select('user_id')
    .eq('id', message.project_id)
    .single()

  if (!project || project.user_id !== user.id) return false

  const plotUrls = await parsePlotUrls(message.plot_url)
  if (plotUrls.length > 0) {
    await deletePlots(plotUrls)
  }

  const { error } = await supabase
    .from('messages')
    .delete()
    .eq('id', messageId)

  return !error
}
