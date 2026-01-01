'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { useSessionStore } from '@/lib/stores/sessionStore'

export function HeroCTA() {
  const { user } = useSessionStore()

  if (user) {
    return (
      <Link href="/dashboard">
        <Button size="lg" className="text-lg px-8 py-6">
          Go to Dashboard
        </Button>
      </Link>
    )
  }

  return (
    <div className="flex justify-center space-x-4 animate-fade-in-up animation-delay-600">
      <Link href="/signup">
        <Button size="lg" className="text-lg px-8 py-6">
          Get Started
        </Button>
      </Link>
      <Link href="/login">
        <Button size="lg" variant="outline" className="text-lg px-8 py-6">
          Login
        </Button>
      </Link>
    </div>
  )
}


