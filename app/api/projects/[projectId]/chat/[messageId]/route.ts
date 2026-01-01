import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// DELETE chat message (only by sender)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ projectId: string; messageId: string }> }
) {
  try {
    const { projectId, messageId } = await params
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get the message to check ownership
    const { data: message, error: messageError } = await supabase
      .from('project_chat_messages')
      .select('user_id')
      .eq('id', messageId)
      .eq('project_id', projectId)
      .single()

    if (messageError || !message) {
      return NextResponse.json({ error: 'Message not found' }, { status: 404 })
    }

    // Only allow deletion by the message sender
    if (message.user_id !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Delete the message
    const { error: deleteError } = await supabase
      .from('project_chat_messages')
      .delete()
      .eq('id', messageId)
      .eq('user_id', user.id)

    if (deleteError) throw deleteError

    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

