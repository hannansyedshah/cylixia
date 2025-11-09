import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabaseServer'

// GET list collaboration requests
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type') || 'received' // 'sent' or 'received'

    // First, get the collaboration requests
    let baseQuery = supabase
      .from('collaboration_requests')
      .select('*')

    if (type === 'received') {
      baseQuery = baseQuery.eq('to_user_id', user.id).eq('status', 'pending')
    } else {
      baseQuery = baseQuery.eq('from_user_id', user.id)
    }

    const { data: requests, error: requestsError } = await baseQuery.order('created_at', { ascending: false })

    if (requestsError) {
      console.error('Error fetching collaboration requests:', requestsError)
      throw requestsError
    }

    if (!requests || requests.length === 0) {
      return NextResponse.json({ requests: [] })
    }

    // Get project IDs
    const projectIds = [...new Set(requests.map((r: any) => r.project_id).filter(Boolean))]
    
    // Get projects
    let projects: any[] = []
    if (projectIds.length > 0) {
      const { data: projectsData, error: projectsError } = await supabase
        .from('projects')
        .select('id, name, description')
        .in('id', projectIds)

      if (projectsError) {
        console.error('Error fetching projects:', projectsError)
      } else if (projectsData) {
        projects = projectsData
      }
    }

    // Get user IDs
    const userIds = [...new Set([
      ...requests.map((r: any) => r.from_user_id),
      ...requests.map((r: any) => r.to_user_id)
    ])]

    // Get profiles
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('id, display_name, avatar_url')
      .in('id', userIds)

    if (profilesError) {
      console.error('Error fetching profiles:', profilesError)
    }

    // Map requests with related data
    const formattedRequests = (requests || []).map((req: any) => {
      const project = projects.find((p: any) => p.id === req.project_id)
      const fromUserProfile = profiles?.find((p: any) => p.id === req.from_user_id)
      const toUserProfile = profiles?.find((p: any) => p.id === req.to_user_id)

      return {
        ...req,
        project: project ? {
          id: project.id,
          name: project.name || 'Unnamed Project',
          description: project.description
        } : null,
        from_user: fromUserProfile || null,
        to_user: toUserProfile || null
      }
    })

    return NextResponse.json({ requests: formattedRequests })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// POST create collaboration request
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json() as { project_id?: string; to_user_id?: string; role?: string; message?: string }
    const { project_id, to_user_id, role, message } = body

    if (!project_id || !to_user_id || !role) {
      return NextResponse.json({ error: 'project_id, to_user_id, and role are required' }, { status: 400 })
    }

    if (!['edit', 'view'].includes(role)) {
      return NextResponse.json({ error: 'role must be "edit" or "view"' }, { status: 400 })
    }

    // Check if user is owner or has owner role
    const { data: project } = await supabase
      .from('projects')
      .select('id, user_id')
      .eq('id', project_id)
      .single()

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 })
    }

    const { data: userCollaborator } = await supabase
      .from('project_collaborators')
      .select('*')
      .eq('project_id', project_id)
      .eq('user_id', user.id)
      .eq('role', 'owner')
      .eq('status', 'accepted')
      .single()

    if (project.user_id !== user.id && !userCollaborator) {
      return NextResponse.json({ error: 'Only project owners can send collaboration requests' }, { status: 403 })
    }

    // Check if collaboration already exists
    const { data: existing } = await supabase
      .from('project_collaborators')
      .select('*')
      .eq('project_id', project_id)
      .eq('user_id', to_user_id)
      .single()

    if (existing && existing.status === 'accepted') {
      return NextResponse.json({ error: 'User is already a collaborator' }, { status: 409 })
    }

    // Check if there's a pending request
    const { data: pendingRequest } = await supabase
      .from('collaboration_requests')
      .select('*')
      .eq('project_id', project_id)
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
        project_id,
        from_user_id: user.id,
        to_user_id,
        role,
        message: message || null,
        status: 'pending'
      })
      .select()
      .single()

    if (requestError) throw requestError

    // Also create a pending collaborator entry
    const { data: collaborator, error: collaboratorError } = await supabase
      .from('project_collaborators')
      .upsert({
        project_id,
        user_id: to_user_id,
        role,
        invited_by: user.id,
        status: 'pending'
      }, {
        onConflict: 'project_id,user_id'
      })
      .select()
      .single()

    if (collaboratorError) throw collaboratorError

    return NextResponse.json({ request: collaborationRequest, collaborator })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

