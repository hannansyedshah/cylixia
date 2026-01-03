'use client'

import { ProfileHeader } from './ProfileHeader'

interface ProfileLayoutProps {
  children: React.ReactNode
}

export function ProfileLayout({ children }: ProfileLayoutProps) {
  return (
    <div className="min-h-screen bg-black">
      <ProfileHeader />
      <main>{children}</main>
    </div>
  )
}
