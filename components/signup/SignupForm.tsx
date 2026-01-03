'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { useSessionStore } from '@/lib/stores/sessionStore'
import { supabase } from '@/lib/supabase/client'
import { ArrowRight, Mail, Lock, KeyRound } from 'lucide-react'

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
    } finally {
      setCheckingEmail(false)
    }

    try {
      const validateResponse = await fetch('/api/signup/validate-invite', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ inviteCode: inviteCode.trim() }),
      })

      const validateData = await validateResponse.json()

      if (!validateData.valid) {
        const remaining = validateData.remainingAttempts
        if (remaining !== undefined && remaining !== null) {
          setRemainingAttempts(remaining)
        }
        setError(validateData.error || 'Invalid invite code')
        setLoading(false)
        return
      } else {
        setRemainingAttempts(null)
      }
    } catch (err: any) {
      setError('Failed to validate invite code. Please try again.')
      setLoading(false)
      return
    }

    try {
      if (!process.env.NEXT_PUBLIC_SUPABASE_URL ||
          process.env.NEXT_PUBLIC_SUPABASE_URL.includes('your-project')) {
        setError('Supabase is not configured. Please follow the setup guide.')
        setLoading(false)
        return
      }

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      })

      if (error) throw error

      if (data.user) {
        setSuccess('Check your email for a confirmation link to activate your account.')
        setTimeout(() => {
          window.location.href = '/login'
        }, 1200)
      }
    } catch (err: any) {
      if (err.message === 'Failed to fetch') {
        setError('Cannot connect to Supabase. Please check your configuration.')
      } else {
        setError(err.message || 'Failed to sign up')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="w-full max-w-md">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-3xl md:text-4xl font-bold text-white mb-3">
          Sign up for Cylixia
        </h1>
        <p className="text-zinc-400">
          Create an account to start visualizing your data
        </p>
      </div>

      {/* Form Card */}
      <div className="relative">
        <div className="absolute -inset-1 bg-gradient-to-r from-emerald-500/20 to-emerald-600/20 rounded-2xl blur-xl" />
        <div className="relative bg-zinc-900/80 border border-zinc-800 rounded-2xl p-8">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="inviteCode" className="text-sm font-medium text-zinc-300">
                Invite Code
              </Label>
              <div className="relative">
                <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />
                <Input
                  id="inviteCode"
                  type="text"
                  placeholder="Enter invite code"
                  value={inviteCode}
                  onChange={(e) => {
                    setInviteCode(e.target.value)
                    if (e.target.value.trim() === '') {
                      setRemainingAttempts(null)
                    }
                  }}
                  required
                  className="h-12 pl-11 bg-zinc-800/50 border-zinc-700 text-white placeholder:text-zinc-500 focus:border-emerald-500 focus:ring-emerald-500/20"
                />
              </div>
              {remainingAttempts !== null && remainingAttempts > 0 && (
                <p className="text-xs text-zinc-400">
                  {remainingAttempts} {remainingAttempts === 1 ? 'attempt' : 'attempts'} remaining
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium text-zinc-300">
                Email
              </Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value)
                    setEmailError('')
                  }}
                  required
                  className={`h-12 pl-11 bg-zinc-800/50 border-zinc-700 text-white placeholder:text-zinc-500 focus:border-emerald-500 focus:ring-emerald-500/20 ${
                    emailError ? 'border-red-500' : ''
                  }`}
                />
                {checkingEmail && (
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    <div className="w-4 h-4 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
                  </div>
                )}
              </div>
              {emailError && (
                <p className="text-sm text-red-400">{emailError}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm font-medium text-zinc-300">
                Password
              </Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="h-12 pl-11 bg-zinc-800/50 border-zinc-700 text-white placeholder:text-zinc-500 focus:border-emerald-500 focus:ring-emerald-500/20"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword" className="text-sm font-medium text-zinc-300">
                Confirm Password
              </Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  className="h-12 pl-11 bg-zinc-800/50 border-zinc-700 text-white placeholder:text-zinc-500 focus:border-emerald-500 focus:ring-emerald-500/20"
                />
              </div>
            </div>

            {error && (
              <div className="space-y-2">
                <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20">
                  <p className="text-sm text-red-400">{error}</p>
                </div>
                {remainingAttempts !== null && remainingAttempts > 0 && (
                  <div className="p-3 rounded-lg bg-orange-500/10 border border-orange-500/20">
                    <p className="text-sm text-orange-400 font-medium">
                      {remainingAttempts} {remainingAttempts === 1 ? 'attempt' : 'attempts'} remaining
                    </p>
                  </div>
                )}
                {remainingAttempts === 0 && (
                  <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20">
                    <p className="text-sm text-red-400 font-medium">
                      Account locked. Please wait before trying again.
                    </p>
                  </div>
                )}
              </div>
            )}

            {success && (
              <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                <p className="text-sm text-emerald-400">{success}</p>
              </div>
            )}

            <Button
              type="submit"
              className="w-full h-12 bg-emerald-500 hover:bg-emerald-400 text-black font-medium rounded-xl"
              disabled={loading}
            >
              {loading ? (
                'Creating account...'
              ) : (
                <>
                  Sign up
                  <ArrowRight className="w-4 h-4 ml-2" />
                </>
              )}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-zinc-500">
              Already have an account?{' '}
              <Link href="/login" className="text-emerald-400 hover:text-emerald-300 font-medium">
                Login
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
