'use client'

import { Header } from './Header'

interface LayoutProps {
  children: React.ReactNode
}

export function Layout({ children }: LayoutProps) {
  return (
    <div className="min-h-screen bg-black">
      <Header />
      <main>{children}</main>
    </div>
  )
}

