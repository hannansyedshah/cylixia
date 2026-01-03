'use client'

import { LoginHeader } from './LoginHeader'

interface LoginLayoutProps {
  children: React.ReactNode
}

export function LoginLayout({ children }: LoginLayoutProps) {
  return (
    <div className="min-h-screen bg-black">
      <LoginHeader />
      <main>{children}</main>
    </div>
  )
}
