import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabaseServer'

export async function GET(
  request: NextRequest,
  { params }: { params: { projectId: string } }
) {
  try {
    const { data: { session } } = await supabase.auth.getSession()
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: versions, error } = await supabase
      .from('code_versions')
      .select('*')
      .eq('project_id', params.projectId)
      .order('version_number', { ascending: false })

    if (error) {
      console.error('Error fetching versions:', error)
      return NextResponse.json({ error: 'Failed to fetch versions' }, { status: 500 })
    }

    return NextResponse.json({ versions })
  } catch (error) {
    console.error('Versions API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { projectId: string } }
) {
  try {
    const { data: { session } } = await supabase.auth.getSession()
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { code, plot_url, description } = await request.json()

    if (!code) {
      return NextResponse.json({ error: 'Code is required' }, { status: 400 })
    }

    // Get the next version number
    const { data: lastVersion } = await supabase
      .from('code_versions')
      .select('version_number')
      .eq('project_id', params.projectId)
      .order('version_number', { ascending: false })
      .limit(1)
      .single()

    const nextVersionNumber = lastVersion ? lastVersion.version_number + 1 : 1

    const { data: version, error } = await supabase
      .from('code_versions')
      .insert({
        project_id: params.projectId,
        version_number: nextVersionNumber,
        code,
        plot_url,
        description: description || `Version ${nextVersionNumber}`
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating version:', error)
      return NextResponse.json({ error: 'Failed to create version' }, { status: 500 })
    }

    return NextResponse.json({ version })
  } catch (error) {
    console.error('Create version API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
