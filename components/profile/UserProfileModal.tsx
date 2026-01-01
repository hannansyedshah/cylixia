'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { UserAvatar } from './UserAvatar'
import { Loader2, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { Profile } from '@/types/database'

interface UserProfileModalProps {
  userId: string
  isOpen: boolean
  onClose: () => void
}

export function UserProfileModal({ userId, isOpen, onClose }: UserProfileModalProps) {
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (isOpen && userId) {
      loadProfile()
    } else {
      // Reset state when modal closes
      setProfile(null)
      setError(null)
    }
  }, [isOpen, userId])

  const loadProfile = async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await fetch(`/api/users/${userId}/profile`)
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || 'Failed to load profile')
      }
      
      const data = await response.json()
      setProfile(data.profile)
    } catch (error: any) {
      console.error('Failed to load profile:', error)
      setError(error.message || 'Failed to load profile')
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <Card 
        className="w-full max-w-md shadow-2xl border-2 border-rstudio/10 bg-white dark:bg-gray-900" 
        onClick={(e) => e.stopPropagation()}
      >
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-2xl">User Profile</CardTitle>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="w-4 h-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {loading && (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-rstudio" />
            </div>
          )}

          {error && (
            <div className="text-center py-8">
              <p className="text-red-600 dark:text-red-400">{error}</p>
              <Button onClick={loadProfile} variant="outline" className="mt-4">
                Retry
              </Button>
            </div>
          )}

          {!loading && !error && profile && (
            <div className="space-y-6">
              <div className="flex flex-col items-center text-center">
                <UserAvatar
                  userId={profile.id}
                  displayName={profile.display_name || 'User'}
                  avatarUrl={profile.avatar_url}
                  size="lg"
                />
                <h3 className="mt-4 text-xl font-semibold text-darktext dark:text-white">
                  {profile.display_name || 'User'}
                </h3>
              </div>

              <div className="space-y-4">
                {profile.bio && (
                  <div>
                    <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Bio</label>
                    <p className="mt-1 text-sm text-darktext dark:text-white">{profile.bio}</p>
                  </div>
                )}

                {profile.location && (
                  <div>
                    <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Location</label>
                    <p className="mt-1 text-sm text-darktext dark:text-white">{profile.location}</p>
                  </div>
                )}

                {profile.website && (
                  <div>
                    <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Website</label>
                    <a
                      href={profile.website.startsWith('http') ? profile.website : `https://${profile.website}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-1 text-sm text-blue-600 dark:text-blue-400 hover:underline block"
                    >
                      {profile.website}
                    </a>
                  </div>
                )}

                <div>
                  <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Member since</label>
                  <p className="mt-1 text-sm text-darktext dark:text-white">
                    {profile.created_at ? new Date(profile.created_at).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    }) : 'Unknown'}
                  </p>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

