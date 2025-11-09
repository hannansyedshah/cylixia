import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabaseServer'

// GET chat messages for a project
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  try {
    const { projectId } = await params
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user has access to this project
    const { data: project } = await supabase
      .from('projects')
      .select('id, user_id')
      .eq('id', projectId)
      .single()

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 })
    }

    // Check if user is owner or collaborator
    const { data: collaborator } = await supabase
      .from('project_collaborators')
      .select('*')
      .eq('project_id', projectId)
      .eq('user_id', user.id)
      .eq('status', 'accepted')
      .single()

    if (project.user_id !== user.id && !collaborator) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Get chat messages
    const { data: messages, error } = await supabase
      .from('project_chat_messages')
      .select('*')
      .eq('project_id', projectId)
      .order('created_at', { ascending: true })

    if (error) throw error

    // Get user IDs from messages
    const userIds = [...new Set((messages || []).map((m: any) => m.user_id))]

    // Get profiles for all users
    let profiles: any[] = []
    if (userIds.length > 0) {
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('id, display_name, avatar_url')
        .in('id', userIds)

      if (!profilesError && profilesData) {
        profiles = profilesData
      }
    }

    // Combine messages with profiles
    const messagesWithProfiles = (messages || []).map((message: any) => {
      const profile = profiles.find((p: any) => p.id === message.user_id)
      return {
        ...message,
        profiles: profile || null
      }
    })

    return NextResponse.json({ messages: messagesWithProfiles })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// POST send chat message
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  try {
    const { projectId } = await params
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { message, code_selection, code_selection_start_line, code_selection_end_line } = body

    if (!message || !message.trim()) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 })
    }

    // Check if user has access to this project
    const { data: project } = await supabase
      .from('projects')
      .select('id, user_id')
      .eq('id', projectId)
      .single()

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 })
    }

    // Check if user is owner or collaborator
    const { data: collaborator } = await supabase
      .from('project_collaborators')
      .select('*')
      .eq('project_id', projectId)
      .eq('user_id', user.id)
      .eq('status', 'accepted')
      .single()

    if (project.user_id !== user.id && !collaborator) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Create chat message
    const { data: chatMessage, error } = await supabase
      .from('project_chat_messages')
      .insert({
        project_id: projectId,
        user_id: user.id,
        message: message.trim(),
        code_selection: code_selection || null,
        code_selection_start_line: code_selection_start_line || null,
        code_selection_end_line: code_selection_end_line || null
      })
      .select('*')
      .single()

    if (error) throw error

    // Get profile for the message sender
    const { data: profile } = await supabase
      .from('profiles')
      .select('id, display_name, avatar_url')
      .eq('id', user.id)
      .single()

    // Combine message with profile
    const messageWithProfile = {
      ...chatMessage,
      profiles: profile || null
    }

    return NextResponse.json({ message: messageWithProfile })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

