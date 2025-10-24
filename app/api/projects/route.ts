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

    const { data: projects, error } = await supabase
      .from('projects')
      .select('*')
      .eq('user_id', user.id)
      .order('updated_at', { ascending: false })

    if (error) throw error

    return NextResponse.json({ projects })
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

    const { data: project, error } = await supabase
      .from('projects')
      .insert({
        user_id: user.id,
        name,
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

