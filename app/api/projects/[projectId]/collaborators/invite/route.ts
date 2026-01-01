import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// GET - just to verify the route exists
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  return NextResponse.json({ message: 'Invite endpoint is working' })
}

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

    // Look up user by email using a database function
    let to_user_id: string | null = null
    const normalizedEmail = email.toLowerCase().trim()
    
    try {
      // Try the RPC function first
      const { data: userData, error: rpcError } = await supabase.rpc('get_user_by_email', {
        user_email: normalizedEmail
      })

      console.log('User lookup result:', { 
        userData, 
        rpcError, 
        email: normalizedEmail,
        userDataType: typeof userData,
        isArray: Array.isArray(userData),
        length: Array.isArray(userData) ? userData.length : 'N/A'
      })

      if (rpcError) {
        console.error('RPC error details:', {
          code: rpcError.code,
          message: rpcError.message,
          details: rpcError.details,
          hint: rpcError.hint
        })
        
        // Check if function doesn't exist
        if (rpcError.code === '42883' || rpcError.message?.includes('does not exist') || rpcError.message?.includes('function')) {
          return NextResponse.json({ 
            error: `Database function 'get_user_by_email' not found. Please run this SQL in Supabase SQL Editor:\n\nCREATE OR REPLACE FUNCTION public.get_user_by_email(user_email TEXT)\nRETURNS TABLE(id UUID, email TEXT) AS $$\nBEGIN\n  RETURN QUERY\n  SELECT au.id, au.email\n  FROM auth.users au\n  WHERE LOWER(au.email) = LOWER(user_email);\nEND;\n$$ LANGUAGE plpgsql SECURITY DEFINER;\n\nGRANT EXECUTE ON FUNCTION public.get_user_by_email(TEXT) TO authenticated;` 
          }, { status: 500 })
        }
      }

      // Handle different response formats
      if (userData) {
        if (Array.isArray(userData)) {
          if (userData.length > 0) {
            to_user_id = userData[0].id
            console.log('Found user via array:', to_user_id)
          } else {
            console.log('User not found - empty array returned')
          }
        } else if (userData && typeof userData === 'object' && 'id' in userData) {
          // Single object returned
          to_user_id = userData.id
          console.log('Found user via object:', to_user_id)
        }
      }

      // If still not found, provide helpful debugging info
      if (!to_user_id) {
        console.log('User not found. Debugging info:', {
          email: normalizedEmail,
          functionResult: userData,
          functionError: rpcError,
          isArray: Array.isArray(userData),
          arrayLength: Array.isArray(userData) ? userData.length : 'N/A'
        })
        
        // Return helpful error with instructions
        return NextResponse.json({ 
          error: `User with email "${email}" not found in the system.\n\nPossible reasons:\n1. The user hasn't signed up yet\n2. The email is different (check for typos, spaces, or case differences)\n3. The user signed up with a different email address\n\nTo verify:\n1. Ask the user to check their account email\n2. Try searching for them by display name instead\n3. Test the function in Supabase SQL Editor:\n   SELECT * FROM get_user_by_email('${normalizedEmail}');\n\nIf the function returns empty, the user doesn't exist in auth.users.` 
        }, { status: 404 })
      }
    } catch (err: any) {
      console.error('Error looking up user:', err)
      return NextResponse.json({ 
        error: `Error looking up user: ${err.message || 'Unknown error'}\n\nStack: ${err.stack || 'N/A'}` 
      }, { status: 500 })
    }

    // Check if collaboration already exists
    if (to_user_id) {
      // Check if user is already an accepted collaborator
      const { data: existingAccepted } = await supabase
        .from('project_collaborators')
        .select('*')
        .eq('project_id', projectId)
        .eq('user_id', to_user_id)
        .eq('status', 'accepted')
        .single()

      if (existingAccepted) {
        return NextResponse.json({ error: 'User is already a collaborator' }, { status: 409 })
      }

      // Check if there's a pending collaborator entry
      const { data: existingPending } = await supabase
        .from('project_collaborators')
        .select('*')
        .eq('project_id', projectId)
        .eq('user_id', to_user_id)
        .eq('status', 'pending')
        .single()

      if (existingPending) {
        return NextResponse.json({ error: 'Collaboration request already pending' }, { status: 409 })
      }

      // Clean up any declined records for this user
      await supabase
        .from('project_collaborators')
        .delete()
        .eq('project_id', projectId)
        .eq('user_id', to_user_id)
        .in('status', ['declined'])

      // Check if there's any existing request (any status)
      const { data: existingRequest } = await supabase
        .from('collaboration_requests')
        .select('*')
        .eq('project_id', projectId)
        .eq('from_user_id', user.id)
        .eq('to_user_id', to_user_id)
        .single()

      if (existingRequest) {
        if (existingRequest.status === 'pending') {
          return NextResponse.json({ error: 'Collaboration request already pending' }, { status: 409 })
        } else if (existingRequest.status === 'accepted') {
          return NextResponse.json({ error: 'User is already a collaborator' }, { status: 409 })
        } else {
          // If declined or cancelled, update it to pending
          const { data: updatedRequest, error: updateError } = await supabase
            .from('collaboration_requests')
            .update({
              role: role,
              message: message || null,
              status: 'pending'
            })
            .eq('id', existingRequest.id)
            .select()
            .single()

          if (updateError) {
            console.error('Error updating collaboration request:', updateError)
            throw updateError
          }

          // Update the collaborator entry too
          if (to_user_id) {
            const { data: collaborator, error: collaboratorError } = await supabase
              .from('project_collaborators')
              .upsert({
                project_id: projectId,
                user_id: to_user_id,
                role: role,
                invited_by: user.id,
                status: 'pending'
              }, {
                onConflict: 'project_id,user_id'
              })
              .select()
              .single()

            if (collaboratorError) {
              console.error('Error updating collaborator entry:', collaboratorError)
            }
          }

          return NextResponse.json({ 
            success: true,
            message: 'Invitation sent successfully',
            request: updatedRequest
          })
        }
      }
    }

    // Create collaboration request
    const { data: collaborationRequest, error: requestError } = await supabase
      .from('collaboration_requests')
      .insert({
        project_id: projectId,
        from_user_id: user.id,
        to_user_id: to_user_id!,
        role: role,
        message: message || null,
        status: 'pending'
      })
      .select()
      .single()

    if (requestError) {
      console.error('Error creating collaboration request:', requestError)
      // Check if it's a duplicate key error
      if (requestError.code === '23505' || requestError.message?.includes('duplicate key') || requestError.message?.includes('unique constraint')) {
        // Try to get the existing request
        const { data: existingRequest } = await supabase
          .from('collaboration_requests')
          .select('*')
          .eq('project_id', projectId)
          .eq('from_user_id', user.id)
          .eq('to_user_id', to_user_id!)
          .single()

        if (existingRequest) {
          if (existingRequest.status === 'pending') {
            return NextResponse.json({ error: 'Collaboration request already pending' }, { status: 409 })
          } else {
            // Update existing request
            const { data: updatedRequest, error: updateError } = await supabase
              .from('collaboration_requests')
              .update({
                role: role,
                message: message || null,
                status: 'pending'
              })
              .eq('id', existingRequest.id)
              .select()
              .single()

            if (updateError) {
              throw updateError
            }

            return NextResponse.json({ 
              success: true,
              message: 'Invitation sent successfully',
              request: updatedRequest
            })
          }
        }
      }
      throw requestError
    }

    // Also create a pending collaborator entry
    if (to_user_id) {
      const { data: collaborator, error: collaboratorError } = await supabase
        .from('project_collaborators')
        .insert({
          project_id: projectId,
          user_id: to_user_id,
          role: role,
          invited_by: user.id,
          status: 'pending'
        })
        .select()
        .single()

      if (collaboratorError) {
        console.error('Error creating collaborator entry:', collaboratorError)
        // Don't fail the request if this fails
      }
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

