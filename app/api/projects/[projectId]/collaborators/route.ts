import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabaseServer'

// GET list collaborators for a project
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
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select('id, user_id')
      .eq('id', projectId)
      .single()

    if (projectError) throw projectError

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

    // Get all collaborators with their profiles
    const { data: collaborators, error } = await supabase
      .from('project_collaborators')
      .select(`
        *,
        profiles:user_id (
          id,
          display_name,
          avatar_url
        )
      `)
      .eq('project_id', projectId)
      .eq('status', 'accepted')
      .order('created_at', { ascending: true })

    if (error) throw error

    return NextResponse.json({ collaborators: collaborators || [] })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// POST add collaborator (creates collaboration request)
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
    const { to_user_id, role, message } = body

    if (!to_user_id || !role) {
      return NextResponse.json({ error: 'to_user_id and role are required' }, { status: 400 })
    }

    if (!['edit', 'view'].includes(role)) {
      return NextResponse.json({ error: 'role must be "edit" or "view"' }, { status: 400 })
    }

    // Check if user is owner or has owner role
    const { data: project } = await supabase
      .from('projects')
      .select('id, user_id')
      .eq('id', projectId)
      .single()

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 })
    }

    const { data: userCollaborator } = await supabase
      .from('project_collaborators')
      .select('*')
      .eq('project_id', projectId)
      .eq('user_id', user.id)
      .eq('role', 'owner')
      .eq('status', 'accepted')
      .single()

    if (project.user_id !== user.id && !userCollaborator) {
      return NextResponse.json({ error: 'Only project owners can add collaborators' }, { status: 403 })
    }

    // Check if collaboration already exists
    const { data: existing } = await supabase
      .from('project_collaborators')
      .select('*')
      .eq('project_id', projectId)
      .eq('user_id', to_user_id)
      .single()

    if (existing) {
      return NextResponse.json({ error: 'User is already a collaborator' }, { status: 409 })
    }

    // Check if there's a pending request
    const { data: pendingRequest } = await supabase
      .from('collaboration_requests')
      .select('*')
      .eq('project_id', projectId)
      .eq('from_user_id', user.id)
      .eq('to_user_id', to_user_id)
      .eq('status', 'pending')
      .single()

    if (pendingRequest) {
      return NextResponse.json({ error: 'Collaboration request already pending' }, { status: 409 })
    }

    // Create collaboration request
    const { data: request, error: requestError } = await supabase
      .from('collaboration_requests')
      .insert({
        project_id: projectId,
        from_user_id: user.id,
        to_user_id: to_user_id,
        role: role,
        message: message || null,
        status: 'pending'
      })
      .select()
      .single()

    if (requestError) throw requestError

    // Also create a pending collaborator entry
    const { data: collaborator, error: collaboratorError } = await supabase
      .from('project_collaborators')
      .insert({
        project_id: projectId,
        user_id: to_user_id,
        role: role,
        invited_by: user.id,
        status: 'pending'
      })
      .select()
      .single()

    if (collaboratorError) throw collaboratorError

    return NextResponse.json({ request, collaborator })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

