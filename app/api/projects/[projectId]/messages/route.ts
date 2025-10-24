import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabaseServer'

// POST add message to project
export async function POST(
  request: NextRequest,
  { params }: { params: { projectId: string } }
) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Verify user owns this project
    const { data: project } = await supabase
      .from('projects')
      .select('id')
      .eq('id', params.projectId)
      .eq('user_id', user.id)
      .single()

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 })
    }

    const body = await request.json()
    const { role, content, code, plot_url } = body

    const { data: message, error } = await supabase
      .from('messages')
      .insert({
        project_id: params.projectId,
        role,
        content,
        code,
        plot_url,
      })
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ message })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

