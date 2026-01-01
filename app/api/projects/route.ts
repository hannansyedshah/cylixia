import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// GET all projects for the current user
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get projects where user is owner
    const { data: ownedProjects, error: ownedError } = await supabase
      .from('projects')
      .select('*')
      .eq('user_id', user.id)
      .order('updated_at', { ascending: false })

    if (ownedError) {
      console.error('Error fetching owned projects:', ownedError)
      throw ownedError
    }

    // Get projects where user is a collaborator (if table exists)
    let collaboratorProjects: any[] = []
    try {
      // First, get the project IDs where user is a collaborator
      const { data: collabData, error: collabError } = await supabase
        .from('project_collaborators')
        .select('project_id')
        .eq('user_id', user.id)
        .eq('status', 'accepted')

      if (!collabError && collabData && collabData.length > 0) {
        // Extract project IDs
        const projectIds = collabData.map((cp: any) => cp.project_id).filter(Boolean)
        
        // Then fetch the actual projects
        if (projectIds.length > 0) {
          const { data: projects, error: projectsError } = await supabase
            .from('projects')
            .select('*')
            .in('id', projectIds)
            .order('updated_at', { ascending: false })

          if (!projectsError && projects) {
            collaboratorProjects = projects
          }
        }
      }
    } catch (error) {
      // If table doesn't exist or query fails, just use owned projects
      console.warn('Could not fetch collaborator projects:', error)
    }

    // Combine and deduplicate projects
    const allProjects = [
      ...(ownedProjects || []),
      ...collaboratorProjects
    ]

    // Remove duplicates (in case user is both owner and collaborator)
    const uniqueProjects = allProjects.filter((project, index, self) =>
      index === self.findIndex((p) => p.id === project.id)
    )

    // Sort by updated_at
    uniqueProjects.sort((a, b) => 
      new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
    )

    return NextResponse.json({ projects: uniqueProjects })
  } catch (error: any) {
    console.error('Error fetching projects:', error)
    return NextResponse.json({ 
      error: error.message || 'Failed to load projects',
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    }, { status: 500 })
  }
}

// POST create a new project
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { name, description, hipaaCompliant } = body

    // Basic validation
    const trimmedName = (name || '').trim()
    if (!trimmedName) {
      return NextResponse.json({ error: 'Project name is required' }, { status: 400 })
    }

    // Enforce unique project name per user (case-insensitive)
    const { data: existing, error: existingError } = await supabase
      .from('projects')
      .select('id')
      .eq('user_id', user.id)
      .ilike('name', trimmedName)
      .maybeSingle()

    if (existingError) throw existingError
    if (existing) {
      return NextResponse.json({ error: 'You already have a project with this name.' }, { status: 409 })
    }

    const { data: project, error } = await supabase
      .from('projects')
      .insert({
        user_id: user.id,
        name: trimmedName,
        description,
        code: '# Your R code will appear here\n',
        hipaa_compliant: hipaaCompliant || false,
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating project:', error)
      throw error
    }

    return NextResponse.json({ project })
  } catch (error: any) {
    console.error('Project creation error:', error)
    return NextResponse.json({ 
      error: error.message || 'Failed to create project',
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    }, { status: 500 })
  }
}

