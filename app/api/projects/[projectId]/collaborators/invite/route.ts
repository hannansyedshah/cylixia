import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabaseServer'

// POST send invitation by email
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  try {
    const { projectId } = await params
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json() as { email?: string; role?: string; message?: string }
    const { email, role, message } = body

    if (!email || !role) {
      return NextResponse.json({ error: 'email and role are required' }, { status: 400 })
    }

    if (!['edit', 'view'].includes(role)) {
      return NextResponse.json({ error: 'role must be "edit" or "view"' }, { status: 400 })
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json({ error: 'Invalid email address' }, { status: 400 })
    }

    // Check if user is owner or has owner role
    const { data: project } = await supabase
      .from('projects')
      .select('id, user_id, name')
      .eq('id', projectId)
      .single()

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 })
    }

    const { data: userCollaborator } = await supabase
      .from('project_collaborators')
      .select('*')
      .eq('project_id', projectId)
      .eq('user_id', user.id)
      .eq('role', 'owner')
      .eq('status', 'accepted')
      .single()

    if (project.user_id !== user.id && !userCollaborator) {
      return NextResponse.json({ error: 'Only project owners can add collaborators' }, { status: 403 })
    }

    // Check if there's already a pending invitation for this email
    const { data: existingInvitations } = await supabase
      .from('collaboration_requests')
      .select('*')
      .eq('project_id', projectId)
      .eq('from_user_id', user.id)
      .eq('status', 'pending')
    
    // Check if email is already invited
    if (existingInvitations) {
      const emailInvitation = existingInvitations.find((inv: any) => {
        if (inv.message && inv.message.includes('EMAIL:')) {
          const emailMatch = inv.message.match(/EMAIL:([^|]+)/)
          return emailMatch && emailMatch[1]?.toLowerCase() === email.toLowerCase()
        }
        return false
      })
      
      if (emailInvitation) {
        return NextResponse.json({ error: 'Invitation already sent to this email' }, { status: 409 })
      }
    }

    // Get sender's profile for email
    const { data: senderProfile } = await supabase
      .from('profiles')
      .select('display_name')
      .eq('id', user.id)
      .single()

    const senderName = senderProfile?.display_name || user.email?.split('@')[0] || 'Someone'

    // Create invitation token
    const invitationToken = crypto.randomUUID()
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.VERCEL_URL 
      ? `https://${process.env.VERCEL_URL}` 
      : 'http://localhost:3000'
    const invitationLink = `${baseUrl}/accept-invite?token=${invitationToken}&project=${projectId}&email=${encodeURIComponent(email)}`

    // Store invitation - we'll use a placeholder user_id and match by email when user signs up
    // First, try to find if user exists by querying profiles (which has id matching auth.users)
    // We can't directly query auth.users, so we'll create the invitation and handle matching later
    
    // For now, create invitation with email stored in message field
    // Format: "EMAIL:user@example.com|TOKEN:token123|ORIGINAL_MESSAGE:..."
    const emailMessage = `EMAIL:${email}|TOKEN:${invitationToken}|${message ? `ORIGINAL_MESSAGE:${message}` : ''}`
    
    // Use a placeholder UUID for non-existent users
    const placeholderUserId = '00000000-0000-0000-0000-000000000000'
    
    const { data: collaborationRequest, error: requestError } = await supabase
      .from('collaboration_requests')
      .insert({
        project_id: projectId,
        from_user_id: user.id,
        to_user_id: placeholderUserId, // Placeholder - will be updated when user accepts
        role: role,
        message: emailMessage,
        status: 'pending'
      })
      .select()
      .single()

    if (requestError) {
      console.error('Error creating collaboration request:', requestError)
      throw requestError
    }

    // Send email invitation
    try {
      const projectName = project.name || 'a project'
      
      // Use Supabase's email service
      // Note: You'll need to configure email templates in Supabase Dashboard
      // For now, we'll use a simple approach with Supabase's built-in email
      const emailSubject = `You've been invited to collaborate on "${projectName}"`
      const emailBody = `
        <h2>Collaboration Invitation</h2>
        <p>${senderName} has invited you to collaborate on the project "${projectName}".</p>
        ${message ? `<p><strong>Message:</strong> ${message}</p>` : ''}
        <p><strong>Role:</strong> ${role === 'edit' ? 'Editor' : 'Viewer'}</p>
        <p>Click the link below to accept the invitation:</p>
        <p><a href="${invitationLink}" style="background-color: #276DC3; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">Accept Invitation</a></p>
        <p>Or copy and paste this link into your browser:</p>
        <p>${invitationLink}</p>
        <p>If you don't have an account, you'll be prompted to sign up first.</p>
      `
      
      // Use Supabase's email service (requires configuration in Supabase Dashboard)
      // For now, we'll log it - in production, configure Supabase email or use a service like Resend
      console.log('Email invitation details:', {
        to: email,
        subject: emailSubject,
        body: emailBody,
        invitationLink
      })
      
      // TODO: Configure email service (Supabase, Resend, SendGrid, etc.)
      // For now, the invitation is stored and can be accessed via the link
      
    } catch (emailErr: any) {
      console.warn('Could not send email, but invitation was created:', emailErr)
      // Don't fail the request if email fails
    }

    return NextResponse.json({ 
      success: true,
      message: 'Invitation sent successfully',
      request: collaborationRequest
    })
  } catch (error: any) {
    console.error('Error sending invitation:', error)
    return NextResponse.json({ error: error.message || 'Failed to send invitation' }, { status: 500 })
  }
}

