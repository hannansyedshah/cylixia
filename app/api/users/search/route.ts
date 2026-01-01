import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// GET search users by name or email
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const query = searchParams.get('q') || ''

    if (!query || query.length < 2) {
      return NextResponse.json({ users: [] })
    }

    // Search profiles by display_name or email
    // We need to join with auth.users to search by email
    // Since we can't directly query auth.users, we'll search profiles and match with emails
    const { data: profiles, error } = await supabase
      .from('profiles')
      .select('id, display_name, avatar_url')
      .or(`display_name.ilike.%${query}%,id.ilike.%${query}%`)
      .limit(20)

    if (error) throw error

    // Get user emails for the found profiles
    // Note: We can't directly query auth.users, so we'll return profile data
    // The client will need to handle displaying user info
    const users = profiles?.map(profile => ({
      id: profile.id,
      display_name: profile.display_name,
      avatar_url: profile.avatar_url,
    })) || []

    return NextResponse.json({ users })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

