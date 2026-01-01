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

    return NextResponse.json({ projects: ownedProjects || [] })
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

