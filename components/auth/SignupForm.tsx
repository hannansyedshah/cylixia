'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { useSessionStore } from '@/lib/stores/sessionStore'
import { supabase } from '@/lib/supabase/client'

export function SignupForm() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [inviteCode, setInviteCode] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [loading, setLoading] = useState(false)
  const [remainingAttempts, setRemainingAttempts] = useState<number | null>(null)
  const [checkingEmail, setCheckingEmail] = useState(false)
  const [emailError, setEmailError] = useState('')
  const router = useRouter()
  const setUser = useSessionStore((state) => state.setUser)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess('')
    setRemainingAttempts(null)

    if (password !== confirmPassword) {
      setError('Passwords do not match')
      return
    }

    // Validate invite code server-side
    if (!inviteCode.trim()) {
      setError('Invite code is required')
      return
    }

    setLoading(true)

    // Check if email is already registered
    setCheckingEmail(true)
    setEmailError('')
    try {
      const emailCheckResponse = await fetch('/api/signup/check-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: email.trim() }),
      })

      const emailCheckData = await emailCheckResponse.json()
      
      if (emailCheckData.exists) {
        setEmailError('This email is already registered. Please use a different email or try logging in.')
        setLoading(false)
        setCheckingEmail(false)
        return
      }
    } catch (err: any) {
      console.error('Error checking email:', err)
      // Continue with signup if email check fails - Supabase will catch duplicates
    } finally {
      setCheckingEmail(false)
    }

    try {
      // Validate invite code via secure API route
      const validateResponse = await fetch('/api/signup/validate-invite', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ inviteCode: inviteCode.trim() }),
      })

      const validateData = await validateResponse.json()

      if (!validateData.valid) {
        // Update remaining attempts
        const remaining = validateData.remainingAttempts
        if (remaining !== undefined && remaining !== null) {
          setRemainingAttempts(remaining)
        }

        setError(validateData.error || 'Invalid invite code')
        setLoading(false)
        return
      } else {
        // Reset remaining attempts on success
        setRemainingAttempts(null)
      }
    } catch (err: any) {
      setError('Failed to validate invite code. Please try again.')
      setLoading(false)
      return
    }

    try {
      // Check if Supabase is configured
      if (!process.env.NEXT_PUBLIC_SUPABASE_URL || 
          process.env.NEXT_PUBLIC_SUPABASE_URL.includes('your-project')) {
        setError('⚠️ Supabase is not configured. Please follow the setup guide in SETUP.md')
        setLoading(false)
        return
      }

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      })

      if (error) throw error

      if (data.user) {
        // Most setups require email confirmation; do not persist user yet
        setSuccess('Check your email for a confirmation link to activate your account. You can log in after confirming.')
        // Redirect to login so user can sign in after confirming email
        setTimeout(() => {
          window.location.href = '/login'
        }, 1200)
      }
    } catch (err: any) {
      if (err.message === 'Failed to fetch') {
        setError('⚠️ Cannot connect to Supabase. Please check your .env.local file and make sure Supabase credentials are correct.')
      } else {
        setError(err.message || 'Failed to sign up')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="w-full max-w-md shadow-2xl border-2 border-rstudio/10 hover:border-rstudio/30 transition-all duration-300">
      <CardHeader className="text-center pb-2">
        <CardTitle className="text-3xl mb-2">Sign up for c<span className="text-rstudio">R</span>eate</CardTitle>
        <CardDescription className="text-base">
          Create an account to start visualizing your data
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-6">
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="inviteCode" className="text-sm font-semibold">Invite Code</Label>
            <Input
              id="inviteCode"
              type="text"
              placeholder="Enter invite code"
              value={inviteCode}
              onChange={(e) => {
                setInviteCode(e.target.value)
                // Reset remaining attempts when user starts typing a new code
                if (e.target.value.trim() === '') {
                  setRemainingAttempts(null)
                }
              }}
              required
              className="h-11 border-2 focus:border-rstudio transition-all text-darktext dark:text-white bg-white dark:bg-gray-800"
            />
            {remainingAttempts !== null && remainingAttempts > 0 && (
              <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                {remainingAttempts} {remainingAttempts === 1 ? 'attempt' : 'attempts'} remaining
              </p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="email" className="text-sm font-semibold">Email</Label>
            <div className="relative">
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value)
                  setEmailError('') // Clear error when user types
                }}
                required
                className={`h-11 border-2 focus:border-rstudio transition-all text-darktext dark:text-white bg-white dark:bg-gray-800 ${
                  emailError ? 'border-red-500 dark:border-red-500' : ''
                }`}
              />
              {checkingEmail && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  <div className="w-4 h-4 border-2 border-rstudio border-t-transparent rounded-full animate-spin"></div>
                </div>
              )}
            </div>
            {emailError && (
              <p className="text-sm text-red-600 dark:text-red-400">{emailError}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="password" className="text-sm font-semibold">Password</Label>
            <Input
              id="password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="h-11 border-2 focus:border-rstudio transition-all text-darktext dark:text-white bg-white dark:bg-gray-800"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirmPassword" className="text-sm font-semibold">Confirm Password</Label>
            <Input
              id="confirmPassword"
              type="password"
              placeholder="••••••••"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              className="h-11 border-2 focus:border-rstudio transition-all text-darktext dark:text-white bg-white dark:bg-gray-800"
            />
          </div>
          {error && (
            <div className="space-y-2">
              <p className="text-sm text-destructive bg-red-50 dark:bg-red-900/20 p-3 rounded-lg">{error}</p>
              {remainingAttempts !== null && remainingAttempts > 0 && (
                <p className="text-sm text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-900/20 p-3 rounded-lg font-semibold">
                  ⚠️ {remainingAttempts} {remainingAttempts === 1 ? 'attempt' : 'attempts'} remaining
                </p>
              )}
              {remainingAttempts === 0 && (
                <p className="text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 p-3 rounded-lg font-semibold">
                  🔒 Account locked. Please wait before trying again.
                </p>
              )}
            </div>
          )}
          {success && (
            <p className="text-sm text-green-700 bg-green-50 dark:bg-green-900/20 p-3 rounded-lg">{success}</p>
          )}
          <Button type="submit" className="w-full h-12 text-base font-semibold" disabled={loading}>
            {loading ? 'Creating account...' : 'Sign Up'}
          </Button>
          <p className="text-center text-sm text-gray-600 dark:text-gray-400">
            Already have an account? <a href="/login" className="text-rstudio hover:underline font-semibold">Login</a>
          </p>
        </form>
      </CardContent>
    </Card>
  )
}

