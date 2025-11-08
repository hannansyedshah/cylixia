import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabaseServer'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  try {
    const supabase = await createClient()
    const { data: { session } } = await supabase.auth.getSession()
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { projectId } = await params

    // Fetch versions without profile join (we'll fetch profiles separately)
    const { data: versions, error } = await supabase
      .from('code_versions')
      .select('*')
      .eq('project_id', projectId)
      .order('version_number', { ascending: false })

    if (error) {
      console.error('Error fetching versions:', error)
      return NextResponse.json({ error: 'Failed to fetch versions' }, { status: 500 })
    }

    // Get user IDs from versions
    const userIds = [...new Set((versions || []).map((v: any) => v.user_id).filter(Boolean))]

    // Fetch profiles separately
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

    // Combine versions with profiles
    const versionsWithProfiles = (versions || []).map((version: any) => {
      const profile = profiles.find((p: any) => p.id === version.user_id)
      return {
        ...version,
        profiles: profile || null
      }
    })

    return NextResponse.json({ versions: versionsWithProfiles })
  } catch (error) {
    console.error('Versions API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  try {
    const supabase = await createClient()
    const { data: { session } } = await supabase.auth.getSession()
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { projectId } = await params
    const { code, plot_url, description } = await request.json()

    if (!code) {
      return NextResponse.json({ error: 'Code is required' }, { status: 400 })
    }

    // Get the next version number
    const { data: lastVersion } = await supabase
      .from('code_versions')
      .select('version_number')
      .eq('project_id', projectId)
      .order('version_number', { ascending: false })
      .limit(1)
      .single()

    const nextVersionNumber = lastVersion ? lastVersion.version_number + 1 : 1

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: version, error } = await supabase
      .from('code_versions')
      .insert({
        project_id: projectId,
        version_number: nextVersionNumber,
        code,
        plot_url,
        description: description || `Version ${nextVersionNumber}`,
        user_id: user.id
      })
      .select('*')
      .single()

    if (error) {
      console.error('Error creating version:', error)
      return NextResponse.json({ error: 'Failed to create version' }, { status: 500 })
    }

    // Get profile for the version creator
    const { data: profile } = await supabase
      .from('profiles')
      .select('id, display_name, avatar_url')
      .eq('id', user.id)
      .single()

    // Combine version with profile
    const versionWithProfile = {
      ...version,
      profiles: profile || null
    }

    return NextResponse.json({ version: versionWithProfile })
  } catch (error) {
    console.error('Create version API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
