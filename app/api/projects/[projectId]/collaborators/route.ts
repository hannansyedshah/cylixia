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
      .select('id, user_id, created_at, updated_at')
      .eq('id', projectId)
      .single()

    if (projectError) {
      console.error('Error fetching project:', projectError)
      throw projectError
    }

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

    // Get all collaborators (without profile join - we'll fetch profiles separately)
    const { data: collaborators, error } = await supabase
      .from('project_collaborators')
      .select('*')
      .eq('project_id', projectId)
      .eq('status', 'accepted')
      .order('created_at', { ascending: true })

    if (error) {
      console.error('Error fetching collaborators:', error)
      throw error
    }

    // Get all user IDs (owner + collaborators)
    const allUserIds = [
      project.user_id,
      ...(collaborators || []).map((c: any) => c.user_id)
    ]
    const uniqueUserIds = [...new Set(allUserIds)]

    // Fetch all profiles
    let profiles: any[] = []
    if (uniqueUserIds.length > 0) {
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('id, display_name, avatar_url')
        .in('id', uniqueUserIds)

      if (!profilesError && profilesData) {
        profiles = profilesData
      } else if (profilesError) {
        console.error('Error fetching profiles:', profilesError)
      }
    }

    // Get owner's profile
    const ownerProfile = profiles.find((p: any) => p.id === project.user_id)

    // Create owner collaborator entry
    const ownerCollaborator = {
      id: `owner-${project.user_id}`,
      project_id: projectId,
      user_id: project.user_id,
      role: 'owner' as const,
      status: 'accepted',
      created_at: project.created_at || new Date().toISOString(),
      profiles: ownerProfile || null
    }

    // Add profiles to collaborators
    const collaboratorsWithProfiles = (collaborators || []).map((collab: any) => {
      const profile = profiles.find((p: any) => p.id === collab.user_id)
      return {
        ...collab,
        profiles: profile || null
      }
    })

    // Combine owner with other collaborators
    const allCollaborators = [
      ownerCollaborator,
      ...collaboratorsWithProfiles
    ]

    // Remove duplicates (in case owner is also in project_collaborators)
    const uniqueCollaborators = allCollaborators.filter((collab, index, self) =>
      index === self.findIndex((c) => c.user_id === collab.user_id)
    )

    // Sort: owner first, then by created_at
    uniqueCollaborators.sort((a, b) => {
      if (a.role === 'owner') return -1
      if (b.role === 'owner') return 1
      return new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    })

    return NextResponse.json({ collaborators: uniqueCollaborators })
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

    const body = await request.json() as { to_user_id?: string; role?: string; message?: string }
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
    const { data: collaborationRequest, error: requestError } = await supabase
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

    return NextResponse.json({ request: collaborationRequest, collaborator })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

