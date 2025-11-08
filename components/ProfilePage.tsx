'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { ProfilePictureUpload } from './ProfilePictureUpload'
import { useSessionStore } from '@/store/useSessionStore'
import { Loader2 } from 'lucide-react'

interface Profile {
  id: string
  display_name: string | null
  avatar_url: string | null
  bio: string | null
  location: string | null
  website: string | null
}

export function ProfilePage() {
  const { user } = useSessionStore()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [formData, setFormData] = useState({
    display_name: '',
    bio: '',
    location: '',
    website: ''
  })

  useEffect(() => {
    if (user) {
      loadProfile()
    }
  }, [user])

  const loadProfile = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/profile')
      if (!response.ok) throw new Error('Failed to load profile')
      
      const data = await response.json()
      setProfile(data.profile)
      setFormData({
        display_name: data.profile?.display_name || '',
        bio: data.profile?.bio || '',
        location: data.profile?.location || '',
        website: data.profile?.website || ''
      })
    } catch (error: any) {
      console.error('Failed to load profile:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    try {
      setSaving(true)
      const response = await fetch('/api/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to save profile')
      }

      const data = await response.json()
      setProfile(data.profile)
      alert('Profile updated successfully!')
    } catch (error: any) {
      alert(error.message || 'Failed to save profile')
    } finally {
      setSaving(false)
    }
  }

  const handleAvatarUpload = async (file: File): Promise<string> => {
    const formData = new FormData()
    formData.append('file', file)

    const response = await fetch('/api/profile/upload-avatar', {
      method: 'POST',
      body: formData
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Failed to upload avatar')
    }

    const data = await response.json()
    setProfile(prev => prev ? { ...prev, avatar_url: data.avatar_url } : null)
    return data.avatar_url
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-rstudio" />
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <Card className="shadow-2xl border-2 border-rstudio/10 bg-white dark:bg-gray-900">
        <CardHeader className="bg-gradient-to-r from-rstudio/5 to-purple-500/5 dark:from-rstudio/10 dark:to-purple-500/10 border-b border-rstudio/10">
          <CardTitle className="text-3xl text-darktext dark:text-white">Profile Settings</CardTitle>
          <CardDescription className="text-gray-600 dark:text-gray-400">
            Manage your profile information and preferences
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6 p-6">
          <div className="flex justify-center pb-4">
            <ProfilePictureUpload
              currentAvatarUrl={profile?.avatar_url}
              onUpload={handleAvatarUpload}
            />
          </div>

          <div className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="display_name" className="text-sm font-semibold text-darktext dark:text-white">
                Display Name
              </Label>
              <Input
                id="display_name"
                value={formData.display_name}
                onChange={(e) => setFormData({ ...formData, display_name: e.target.value })}
                placeholder="Your name"
                className="h-11 bg-white dark:bg-gray-800 border-2 border-gray-300 dark:border-gray-600 text-darktext dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:border-rstudio focus:ring-2 focus:ring-rstudio/20"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="bio" className="text-sm font-semibold text-darktext dark:text-white">
                Bio
              </Label>
              <textarea
                id="bio"
                value={formData.bio}
                onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                placeholder="Tell us about yourself"
                rows={4}
                className="w-full px-3 py-2 border-2 border-gray-300 dark:border-gray-600 rounded-md focus:border-rstudio focus:outline-none focus:ring-2 focus:ring-rstudio/20 resize-none bg-white dark:bg-gray-800 text-darktext dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="location" className="text-sm font-semibold text-darktext dark:text-white">
                Location
              </Label>
              <Input
                id="location"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                placeholder="City, Country"
                className="h-11 bg-white dark:bg-gray-800 border-2 border-gray-300 dark:border-gray-600 text-darktext dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:border-rstudio focus:ring-2 focus:ring-rstudio/20"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="website" className="text-sm font-semibold text-darktext dark:text-white">
                Website
              </Label>
              <Input
                id="website"
                type="url"
                value={formData.website}
                onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                placeholder="https://yourwebsite.com"
                className="h-11 bg-white dark:bg-gray-800 border-2 border-gray-300 dark:border-gray-600 text-darktext dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:border-rstudio focus:ring-2 focus:ring-rstudio/20"
              />
            </div>
          </div>

          <div className="flex justify-end space-x-2 pt-4 border-t border-gray-200 dark:border-gray-700">
            <Button
              onClick={handleSave}
              disabled={saving}
              className="min-w-[120px] bg-rstudio hover:bg-rstudio/90 text-white"
            >
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                'Save Changes'
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

