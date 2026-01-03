'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Mascot } from '@/components/homepage/Mascot'

export function SignupHeader() {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-black/80 backdrop-blur-xl border-b border-zinc-800/30">
      <div className="container mx-auto px-6 py-4 flex items-center justify-between">
        <Link href="/" className="flex items-center w-fit group">
          <Mascot size={36} className="transition-transform group-hover:scale-110" />
        </Link>

        <div className="flex items-center gap-2">
          <Link href="/login">
            <Button variant="ghost" className="text-zinc-400 hover:text-white hover:bg-zinc-800">
              Login
            </Button>
          </Link>
          <Link href="/signup">
            <Button className="bg-emerald-500 hover:bg-emerald-400 text-black">
              Get Started
            </Button>
          </Link>
        </div>
      </div>
    </header>
  )
}
