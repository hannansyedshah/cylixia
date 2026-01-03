'use client'

import { SignupHeader } from './SignupHeader'

interface SignupLayoutProps {
  children: React.ReactNode
}

export function SignupLayout({ children }: SignupLayoutProps) {
  return (
    <div className="min-h-screen bg-black">
      <SignupHeader />
      <main>{children}</main>
    </div>
  )
}
