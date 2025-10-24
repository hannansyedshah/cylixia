import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabaseServer'

// GET single project with messages
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  const { projectId } = await params
  try {
    console.log('🔍 API: Getting project:', projectId)
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    console.log('👤 API: User:', user?.id ? 'Found' : 'Not found')
    
    if (!user) {
      console.log('❌ API: Unauthorized')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    console.log('📡 API: Fetching project from database...')
    // Get project
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select('*')
      .eq('id', projectId)
      .eq('user_id', user.id)
      .single()

    if (projectError) {
      console.error('💥 API: Project error:', projectError)
      throw projectError
    }

    console.log('📡 API: Fetching messages...')
    // Get messages for this project
    const { data: messages, error: messagesError } = await supabase
      .from('messages')
      .select('*')
      .eq('project_id', projectId)
      .order('created_at', { ascending: true })

    if (messagesError) {
      console.error('💥 API: Messages error:', messagesError)
      throw messagesError
    }

    console.log('✅ API: Project loaded successfully:', project.name, 'with', messages?.length || 0, 'messages')
    return NextResponse.json({ project: { ...project, messages: messages || [] } })
  } catch (error: any) {
    console.error('💥 API: Error:', error.message)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// PATCH update project
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  const { projectId } = await params
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const updates = { ...body }
    delete updates.id
    delete updates.user_id
    delete updates.created_at

    const { data: project, error } = await supabase
      .from('projects')
      .update(updates)
      .eq('id', projectId)
      .eq('user_id', user.id)
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ project })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// DELETE project
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  const { projectId } = await params
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { error } = await supabase
      .from('projects')
      .delete()
      .eq('id', projectId)
      .eq('user_id', user.id)

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

