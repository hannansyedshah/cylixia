'use client'

import { HomeHeader } from './HomeHeader'

interface HomeLayoutProps {
  children: React.ReactNode
}

export function HomeLayout({ children }: HomeLayoutProps) {
  return (
    <div className="min-h-screen bg-black">
      <HomeHeader />
      <main>{children}</main>
    </div>
  )
}
