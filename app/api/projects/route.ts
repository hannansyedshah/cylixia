import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabaseServer'

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

    if (ownedError) throw ownedError

    // Get projects where user is a collaborator
    const { data: collaboratorProjects, error: collabError } = await supabase
      .from('project_collaborators')
      .select(`
        projects:project_id (*)
      `)
      .eq('user_id', user.id)
      .eq('status', 'accepted')
      .order('created_at', { ascending: false })

    if (collabError) throw collabError

    // Combine and deduplicate projects
    const allProjects = [
      ...(ownedProjects || []),
      ...(collaboratorProjects?.map((cp: any) => cp.projects).filter(Boolean) || [])
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
    return NextResponse.json({ error: error.message }, { status: 500 })
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
    const { name, description } = body

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
      })
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ project })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

