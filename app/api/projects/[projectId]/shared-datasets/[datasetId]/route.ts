import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ projectId: string; datasetId: string }> }
) {
  try {
    const { projectId, datasetId } = await params
    const supabase = await createClient()

    // Verify user is authenticated
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Fetch the shared dataset to verify ownership
    const { data: sharedDataset, error: fetchError } = await supabase
      .from('shared_datasets')
      .select('user_id, project_id')
      .eq('id', datasetId)
      .eq('project_id', projectId)
      .single()

    if (fetchError || !sharedDataset) {
      return NextResponse.json({ error: 'Shared dataset not found' }, { status: 404 })
    }

    // Verify user owns this dataset or is project owner/editor
    if (sharedDataset.user_id !== user.id) {
      // Check if user is project owner or editor
      const { data: project } = await supabase
        .from('projects')
        .select('user_id')
        .eq('id', projectId)
        .single()

      const isOwner = project?.user_id === user.id

      if (!isOwner) {
        const { data: collaborator } = await supabase
          .from('project_collaborators')
          .select('role')
          .eq('project_id', projectId)
          .eq('user_id', user.id)
          .eq('status', 'accepted')
          .single()

        if (collaborator?.role !== 'edit' && collaborator?.role !== 'owner') {
          return NextResponse.json(
            { error: 'You can only delete datasets you shared' },
            { status: 403 }
          )
        }
      }
    }

    // Delete the shared dataset
    const { error: deleteError } = await supabase
      .from('shared_datasets')
      .delete()
      .eq('id', datasetId)
      .eq('project_id', projectId)

    if (deleteError) {
      console.error('Error deleting shared dataset:', deleteError)
      return NextResponse.json({ error: deleteError.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Error in DELETE /api/projects/[projectId]/shared-datasets/[datasetId]:', error)
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
  }
}

