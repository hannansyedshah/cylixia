import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabaseServer'

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json()

    if (!email || typeof email !== 'string') {
      return NextResponse.json(
        { error: 'Email is required', exists: false },
        { status: 400 }
      )
    }

    // Normalize email (lowercase, trim)
    const normalizedEmail = email.trim().toLowerCase()

    // Check if email is valid format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(normalizedEmail)) {
      return NextResponse.json(
        { error: 'Invalid email format', exists: false },
        { status: 400 }
      )
    }

    const supabase = await createClient()

    // Use the existing get_user_by_email function to check if email exists
    const { data: userData, error: checkError } = await supabase.rpc('get_user_by_email', {
      user_email: normalizedEmail
    })

    if (checkError) {
      console.error('Error checking email:', checkError)
      // If the function doesn't exist or there's an error, return a safe response
      // We'll let Supabase handle the duplicate check during signup
      return NextResponse.json(
        { exists: false, message: 'Unable to verify email availability' },
        { status: 200 }
      )
    }

    // Check if user exists (function returns array or single object)
    const userExists = Array.isArray(userData) 
      ? userData.length > 0 
      : userData !== null && userData !== undefined && Object.keys(userData).length > 0

    return NextResponse.json({
      exists: userExists,
      message: userExists ? 'This email is already registered' : 'Email is available'
    })
  } catch (error: any) {
    console.error('Error checking email:', error)
    return NextResponse.json(
      { error: 'Failed to check email', exists: false },
      { status: 500 }
    )
  }
}

