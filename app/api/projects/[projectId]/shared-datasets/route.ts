import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabaseServer'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  try {
    const { projectId } = await params
    const supabase = await createClient()

    // Verify user is authenticated
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Fetch shared datasets for the project
    const { data: sharedDatasets, error: datasetsError } = await supabase
      .from('shared_datasets')
      .select('*')
      .eq('project_id', projectId)
      .order('created_at', { ascending: false })

    if (datasetsError) {
      console.error('Error fetching shared datasets:', datasetsError)
      return NextResponse.json({ error: datasetsError.message }, { status: 500 })
    }

    // Fetch user profiles for each shared dataset
    const userIds = [...new Set(sharedDatasets.map(d => d.user_id).filter(Boolean))]
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

    // Combine datasets with profiles
    const datasetsWithProfiles = sharedDatasets.map(dataset => ({
      ...dataset,
      profiles: profiles.find(p => p.id === dataset.user_id) || null
    }))

    return NextResponse.json({ 
      sharedDatasets: datasetsWithProfiles 
    })
  } catch (error: any) {
    console.error('Error in GET /api/projects/[projectId]/shared-datasets:', error)
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  try {
    const { projectId } = await params
    const supabase = await createClient()

    // Verify user is authenticated
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Parse request body
    const body = await request.json() as {
      file_name?: string
      csv_text?: string
      size_bytes?: number
      include_chat?: boolean
      include_run?: boolean
    }

    if (!body.file_name || !body.csv_text || body.size_bytes === undefined) {
      return NextResponse.json(
        { error: 'Missing required fields: file_name, csv_text, size_bytes' },
        { status: 400 }
      )
    }

    // Verify user has edit permissions (owner or editor)
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select('user_id')
      .eq('id', projectId)
      .single()

    if (projectError || !project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 })
    }

    // Check if user is owner
    const isOwner = project.user_id === user.id

    // Check if user is an accepted collaborator with edit or owner role
    let isEditor = false
    if (!isOwner) {
      const { data: collaborator } = await supabase
        .from('project_collaborators')
        .select('role')
        .eq('project_id', projectId)
        .eq('user_id', user.id)
        .eq('status', 'accepted')
        .single()

      isEditor = collaborator?.role === 'edit' || collaborator?.role === 'owner'
    }

    if (!isOwner && !isEditor) {
      return NextResponse.json(
        { error: 'Only owners and editors can share datasets' },
        { status: 403 }
      )
    }

    // Insert shared dataset
    const { data: newDataset, error: insertError } = await supabase
      .from('shared_datasets')
      .insert({
        project_id: projectId,
        user_id: user.id,
        file_name: body.file_name,
        csv_text: body.csv_text,
        size_bytes: body.size_bytes,
        include_chat: body.include_chat ?? true,
        include_run: body.include_run ?? true
      })
      .select()
      .single()

    if (insertError) {
      console.error('Error inserting shared dataset:', insertError)
      return NextResponse.json({ error: insertError.message }, { status: 500 })
    }

    // Fetch user profile for the response
    const { data: profile } = await supabase
      .from('profiles')
      .select('id, display_name, avatar_url')
      .eq('id', user.id)
      .single()

    return NextResponse.json({
      sharedDataset: {
        ...newDataset,
        profiles: profile || null
      }
    }, { status: 201 })
  } catch (error: any) {
    console.error('Error in POST /api/projects/[projectId]/shared-datasets:', error)
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
  }
}

