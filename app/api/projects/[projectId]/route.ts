import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// GET single project with messages
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  const { projectId } = await params
  try {
    console.log('🔍 API: Getting project:', projectId)
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    console.log('👤 API: User:', user?.id ? 'Found' : 'Not found')
    
    if (!user) {
      console.log('❌ API: Unauthorized')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    console.log('📡 API: Fetching project from database...')
    // Get project - check if user is owner or collaborator
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select('*')
      .eq('id', projectId)
      .single()

    if (projectError) {
      console.error('💥 API: Project error:', projectError)
      throw projectError
    }

    // Check if user has access (owner or collaborator)
    const isOwner = project.user_id === user.id
    let hasAccess = isOwner

    if (!isOwner) {
      const { data: collaborator } = await supabase
        .from('project_collaborators')
        .select('*')
        .eq('project_id', projectId)
        .eq('user_id', user.id)
        .eq('status', 'accepted')
        .single()

      hasAccess = !!collaborator
    }

    if (!hasAccess) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    console.log('📡 API: Fetching messages...')
    // Get messages for this project
    const { data: messages, error: messagesError } = await supabase
      .from('messages')
      .select('*')
      .eq('project_id', projectId)
      .order('created_at', { ascending: true })

    if (messagesError) {
      console.error('💥 API: Messages error:', messagesError)
      throw messagesError
    }

    console.log('✅ API: Project loaded successfully:', project.name, 'with', messages?.length || 0, 'messages')
    return NextResponse.json({ project: { ...project, messages: messages || [] } })
  } catch (error: any) {
    console.error('💥 API: Error:', error.message)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// PATCH update project
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  const { projectId } = await params
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const updates = { ...body }
    // If renaming, enforce per-user uniqueness (case-insensitive)
    if (typeof updates.name === 'string') {
      updates.name = updates.name.trim()
      if (!updates.name) {
        return NextResponse.json({ error: 'Project name is required' }, { status: 400 })
      }

      const { data: conflict, error: conflictError } = await supabase
        .from('projects')
        .select('id')
        .eq('user_id', user.id)
        .ilike('name', updates.name)
        .neq('id', projectId)
        .maybeSingle()

      if (conflictError) throw conflictError
      if (conflict) {
        return NextResponse.json({ error: 'You already have a project with this name.' }, { status: 409 })
      }
    }
    delete updates.id
    delete updates.user_id
    delete updates.created_at

    // Check if user has edit access
    const { data: projectCheck } = await supabase
      .from('projects')
      .select('user_id')
      .eq('id', projectId)
      .single()

    if (!projectCheck) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 })
    }

    const isOwner = projectCheck.user_id === user.id
    let canEdit = isOwner

    if (!isOwner) {
      const { data: collaborator } = await supabase
        .from('project_collaborators')
        .select('role')
        .eq('project_id', projectId)
        .eq('user_id', user.id)
        .eq('status', 'accepted')
        .in('role', ['owner', 'edit'])
        .single()

      canEdit = !!collaborator
    }

    if (!canEdit) {
      return NextResponse.json({ error: 'You do not have permission to edit this project' }, { status: 403 })
    }

    const { data: project, error } = await supabase
      .from('projects')
      .update(updates)
      .eq('id', projectId)
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ project })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// DELETE project
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  const { projectId } = await params
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Only owners can delete projects
    const { data: project } = await supabase
      .from('projects')
      .select('user_id')
      .eq('id', projectId)
      .single()

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 })
    }

    if (project.user_id !== user.id) {
      return NextResponse.json({ error: 'Only project owners can delete projects' }, { status: 403 })
    }

    const { error } = await supabase
      .from('projects')
      .delete()
      .eq('id', projectId)
      .eq('user_id', user.id)

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

