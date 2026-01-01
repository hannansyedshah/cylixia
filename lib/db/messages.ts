'use server'

import { createClient } from '@/lib/supabase/server'
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

  // Check access
  const { data: project } = await supabase
    .from('projects')
    .select('id, user_id')
    .eq('id', projectId)
    .single()

  if (!project) return []

  if (project.user_id !== user.id) {
    const { data: collaborator } = await supabase
      .from('project_collaborators')
      .select('*')
      .eq('project_id', projectId)
      .eq('user_id', user.id)
      .eq('status', 'accepted')
      .single()

    if (!collaborator) return []
  }

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

  // Check access
  const { data: project } = await supabase
    .from('projects')
    .select('id, user_id')
    .eq('id', projectId)
    .single()

  if (!project) return null

  if (project.user_id !== user.id) {
    const { data: collaborator } = await supabase
      .from('project_collaborators')
      .select('*')
      .eq('project_id', projectId)
      .eq('user_id', user.id)
      .eq('status', 'accepted')
      .single()

    if (!collaborator) return null
  }

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
