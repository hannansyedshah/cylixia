import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabaseServer'

// PATCH accept/decline collaboration request
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ requestId: string }> }
) {
  try {
    const { requestId } = await params
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { status } = body

    if (!status || !['accepted', 'declined'].includes(status)) {
      return NextResponse.json({ error: 'status must be "accepted" or "declined"' }, { status: 400 })
    }

    // Get the collaboration request
    const { data: collaborationRequest, error: requestError } = await supabase
      .from('collaboration_requests')
      .select('*')
      .eq('id', requestId)
      .single()

    if (requestError) throw requestError

    // Check if user is the recipient
    if (collaborationRequest.to_user_id !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Check if request is still pending
    if (collaborationRequest.status !== 'pending') {
      return NextResponse.json({ error: 'Request is no longer pending' }, { status: 400 })
    }

    // Update request status
    const { data: updatedRequest, error: updateError } = await supabase
      .from('collaboration_requests')
      .update({ status })
      .eq('id', requestId)
      .select()
      .single()

    if (updateError) throw updateError

    // If accepted, update collaborator status
    if (status === 'accepted') {
      const { data: collaborator, error: collaboratorError } = await supabase
        .from('project_collaborators')
        .update({ status: 'accepted' })
        .eq('project_id', collaborationRequest.project_id)
        .eq('user_id', user.id)
        .select()
        .single()

      if (collaboratorError) throw collaboratorError

      // Update project is_shared flag
      await supabase
        .from('projects')
        .update({ is_shared: true })
        .eq('id', collaborationRequest.project_id)

      return NextResponse.json({ request: updatedRequest, collaborator })
    } else {
      // If declined, update collaborator status to declined
      await supabase
        .from('project_collaborators')
        .update({ status: 'declined' })
        .eq('project_id', collaborationRequest.project_id)
        .eq('user_id', user.id)

      return NextResponse.json({ request: updatedRequest })
    }
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

