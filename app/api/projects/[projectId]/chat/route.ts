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

    // Get chat messages with user profiles
    const { data: messages, error } = await supabase
      .from('project_chat_messages')
      .select(`
        *,
        profiles:user_id (
          id,
          display_name,
          avatar_url
        )
      `)
      .eq('project_id', projectId)
      .order('created_at', { ascending: true })

    if (error) throw error

    return NextResponse.json({ messages: messages || [] })
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
    const { message } = body

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
        message: message.trim()
      })
      .select(`
        *,
        profiles:user_id (
          id,
          display_name,
          avatar_url
        )
      `)
      .single()

    if (error) throw error

    return NextResponse.json({ message: chatMessage })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

