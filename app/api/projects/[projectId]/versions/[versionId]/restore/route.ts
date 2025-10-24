import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabaseServer'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ projectId: string; versionId: string }> }
) {
  try {
    const supabase = await createClient()
    const { data: { session } } = await supabase.auth.getSession()
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { projectId, versionId } = await params

    // Get the version to restore
    const { data: version, error: versionError } = await supabase
      .from('code_versions')
      .select('*')
      .eq('id', versionId)
      .eq('project_id', projectId)
      .single()

    if (versionError || !version) {
      return NextResponse.json({ error: 'Version not found' }, { status: 404 })
    }

    // Update the project with the restored code and plot
    const { error: updateError } = await supabase
      .from('projects')
      .update({
        code: version.code,
        plot_url: version.plot_url
      })
      .eq('id', projectId)

    if (updateError) {
      console.error('Error restoring version:', updateError)
      return NextResponse.json({ error: 'Failed to restore version' }, { status: 500 })
    }

    return NextResponse.json({ 
      success: true, 
      code: version.code,
      plot_url: version.plot_url,
      version_number: version.version_number
    })
  } catch (error) {
    console.error('Restore version API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
