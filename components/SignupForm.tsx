'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { useSessionStore } from '@/store/useSessionStore'
import { supabase } from '@/lib/supabaseClient'

export function SignupForm() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [inviteCode, setInviteCode] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const setUser = useSessionStore((state) => state.setUser)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    // Enforce invite code if configured
    const expectedCode = process.env.NEXT_PUBLIC_SIGNUP_CODE
    if (!expectedCode) {
      setError('⚠️ Signup invite code not configured. Set NEXT_PUBLIC_SIGNUP_CODE in .env.local')
      return
    }
    if (inviteCode.trim() !== expectedCode) {
      setError('Invalid invite code')
      return
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match')
      return
    }

    setLoading(true)

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
        setUser(data.user)
        // Force a hard navigation to ensure cookies are set
        window.location.href = '/dashboard'
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
              onChange={(e) => setInviteCode(e.target.value)}
              required
              className="h-11 border-2 focus:border-rstudio transition-all text-darktext dark:text-white bg-white dark:bg-gray-800"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email" className="text-sm font-semibold">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="h-11 border-2 focus:border-rstudio transition-all text-darktext dark:text-white bg-white dark:bg-gray-800"
            />
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
            <p className="text-sm text-destructive bg-red-50 dark:bg-red-900/20 p-3 rounded-lg">{error}</p>
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

