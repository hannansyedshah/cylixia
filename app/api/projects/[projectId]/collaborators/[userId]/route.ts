import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// PATCH update collaborator role
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ projectId: string; userId: string }> }
) {
  try {
    const { projectId, userId } = await params
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { role } = body

    if (!role || !['owner', 'edit', 'view'].includes(role)) {
      return NextResponse.json({ error: 'role must be "owner", "edit", or "view"' }, { status: 400 })
    }

    // Check if user is owner
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
      return NextResponse.json({ error: 'Only project owners can update collaborator roles' }, { status: 403 })
    }

    // Update collaborator role
    const { data: collaborator, error } = await supabase
      .from('project_collaborators')
      .update({ role })
      .eq('project_id', projectId)
      .eq('user_id', userId)
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ collaborator })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// DELETE remove collaborator
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ projectId: string; userId: string }> }
) {
  try {
    const { projectId, userId } = await params
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user is owner
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
      return NextResponse.json({ error: 'Only project owners can remove collaborators' }, { status: 403 })
    }

    // Don't allow removing the project owner
    if (userId === project.user_id) {
      return NextResponse.json({ error: 'Cannot remove project owner' }, { status: 400 })
    }

    // Delete collaborator (all statuses - accepted, pending, declined)
    const { error } = await supabase
      .from('project_collaborators')
      .delete()
      .eq('project_id', projectId)
      .eq('user_id', userId)

    if (error) throw error

    // Also cancel any pending or accepted requests
    await supabase
      .from('collaboration_requests')
      .update({ status: 'cancelled' })
      .eq('project_id', projectId)
      .eq('to_user_id', userId)
      .in('status', ['pending', 'accepted'])

    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

