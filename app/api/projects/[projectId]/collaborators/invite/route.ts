import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabaseServer'

// POST send invitation by email
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

    const body = await request.json() as { email?: string; role?: string; message?: string }
    const { email, role, message } = body

    if (!email || !role) {
      return NextResponse.json({ error: 'email and role are required' }, { status: 400 })
    }

    if (!['edit', 'view'].includes(role)) {
      return NextResponse.json({ error: 'role must be "edit" or "view"' }, { status: 400 })
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json({ error: 'Invalid email address' }, { status: 400 })
    }

    // Check if user is owner or has owner role
    const { data: project } = await supabase
      .from('projects')
      .select('id, user_id, name')
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

    // Look up user by email using a database function
    const { data: userData, error: userLookupError } = await supabase.rpc('get_user_by_email', {
      user_email: email.toLowerCase()
    })

    let to_user_id: string | null = null
    
    if (!userLookupError && userData && Array.isArray(userData) && userData.length > 0) {
      to_user_id = userData[0].id
    } else {
      // User doesn't exist - they need to sign up first
      return NextResponse.json({ 
        error: `User with email "${email}" not found. The user must sign up first before you can invite them.` 
      }, { status: 404 })
    }

    if (!to_user_id) {
      return NextResponse.json({ 
        error: 'Could not find user with this email address' 
      }, { status: 404 })
    }

    // Check if collaboration already exists
    if (to_user_id) {
      const { data: existing } = await supabase
        .from('project_collaborators')
        .select('*')
        .eq('project_id', projectId)
        .eq('user_id', to_user_id)
        .single()

      if (existing && existing.status === 'accepted') {
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
    }

    // Create collaboration request
    const { data: collaborationRequest, error: requestError } = await supabase
      .from('collaboration_requests')
      .insert({
        project_id: projectId,
        from_user_id: user.id,
        to_user_id: to_user_id!,
        role: role,
        message: message || null,
        status: 'pending'
      })
      .select()
      .single()

    if (requestError) {
      console.error('Error creating collaboration request:', requestError)
      throw requestError
    }

    // Also create a pending collaborator entry
    if (to_user_id) {
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

      if (collaboratorError) {
        console.error('Error creating collaborator entry:', collaboratorError)
        // Don't fail the request if this fails
      }
    }

    return NextResponse.json({ 
      success: true,
      message: 'Invitation sent successfully',
      request: collaborationRequest
    })
  } catch (error: any) {
    console.error('Error sending invitation:', error)
    return NextResponse.json({ error: error.message || 'Failed to send invitation' }, { status: 500 })
  }
}

