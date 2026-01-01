'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase/client'

interface UserAvatarProps {
  userId: string
  displayName?: string | null
  avatarUrl?: string | null
  size?: 'xs' | 'sm' | 'md' | 'lg'
  className?: string
}

export function UserAvatar({ userId, displayName, avatarUrl, size = 'md', className = '' }: UserAvatarProps) {
  const [profile, setProfile] = useState<{ display_name?: string | null; avatar_url?: string | null } | null>(null)

  useEffect(() => {
    // If avatarUrl or displayName not provided, fetch profile
    if (!avatarUrl && !displayName) {
      const fetchProfile = async () => {
        const { data } = await supabase
          .from('profiles')
          .select('display_name, avatar_url')
          .eq('id', userId)
          .single()
        
        if (data) {
          setProfile(data)
        }
      }
      fetchProfile()
    }
  }, [userId, avatarUrl, displayName])

  const name = displayName || profile?.display_name || 'User'
  const avatar = avatarUrl || profile?.avatar_url
  const initials = name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)

  const sizeClasses = {
    xs: 'w-4 h-4 text-[10px]',
    sm: 'w-8 h-8 text-xs',
    md: 'w-10 h-10 text-sm',
    lg: 'w-16 h-16 text-lg'
  }

  if (avatar) {
    return (
      <img
        src={avatar}
        alt={name}
        className={`${sizeClasses[size]} rounded-full object-cover ${className}`}
      />
    )
  }

  return (
    <div
      className={`${sizeClasses[size]} rounded-full bg-rstudio/20 text-rstudio flex items-center justify-center font-semibold ${className}`}
      title={name}
    >
      {initials}
    </div>
  )
}

