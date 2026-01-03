'use client'

import { DashboardHeader } from './DashboardHeader'

interface DashboardLayoutProps {
  children: React.ReactNode
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  return (
    <div className="min-h-screen bg-black">
      <DashboardHeader />
      <main>{children}</main>
    </div>
  )
}
