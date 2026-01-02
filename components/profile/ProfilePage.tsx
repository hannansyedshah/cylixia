'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { ProfilePictureUpload } from './ProfilePictureUpload'
import { useSessionStore } from '@/lib/stores/sessionStore'
import { getProfile, updateProfile } from '@/lib/db/profile'
import { Loader2 } from 'lucide-react'
import type { Profile } from '@/types/database'

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
      const profileData = await getProfile()
      setProfile(profileData)
      setFormData({
        display_name: profileData?.display_name || '',
        bio: profileData?.bio || '',
        location: profileData?.location || '',
        website: profileData?.website || ''
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
      const profileData = await updateProfile(formData)
      if (!profileData) {
        throw new Error('Failed to save profile')
      }
      setProfile(profileData)
      // Trigger a page refresh to update the header with new display name
      window.location.reload()
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
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-gray-50 via-blue-50/30 to-purple-50/30">
      {/* Animated Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-96 h-96 bg-rstudio/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-20 right-20 w-80 h-80 bg-purple-400/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1000ms' }}></div>
        <div className="absolute top-1/2 left-1/2 w-96 h-96 bg-blue-400/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2000ms' }}></div>
        <div className="absolute top-1/3 right-1/3 w-64 h-64 bg-rstudio/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '500ms' }}></div>
        <div className="absolute bottom-1/4 left-1/4 w-72 h-72 bg-indigo-400/15 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1500ms' }}></div>
      </div>

      <div className="container mx-auto px-4 py-8 max-w-2xl relative z-10">
        <Card className="shadow-2xl border-2 border-rstudio/20 bg-white/80 backdrop-blur-md">
          <CardHeader className="bg-gradient-to-r from-rstudio/10 via-purple-500/10 to-blue-500/10 border-b border-rstudio/20">
            <CardTitle className="text-3xl text-darktext">Profile Settings</CardTitle>
            <CardDescription className="text-gray-700">
              Manage your profile information and preferences
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6 p-6 bg-gradient-to-b from-white/50 to-white/30">
            <div className="flex justify-center pb-4">
              <ProfilePictureUpload
                currentAvatarUrl={profile?.avatar_url}
                onUpload={handleAvatarUpload}
              />
            </div>

            <div className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-semibold text-darktext">
                  Email
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={user?.email || ''}
                  disabled
                  className="h-11 bg-gray-100 border-2 border-gray-300 text-gray-600 cursor-not-allowed"
                />
                <p className="text-xs text-gray-500">Email cannot be changed</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="display_name" className="text-sm font-semibold text-darktext">
                  Display Name
                </Label>
                <Input
                  id="display_name"
                  value={formData.display_name}
                  onChange={(e) => setFormData({ ...formData, display_name: e.target.value })}
                  placeholder="Your name"
                  className="h-11 bg-white border-2 border-gray-300 text-darktext placeholder:text-gray-400 focus:border-rstudio focus:ring-2 focus:ring-rstudio/20"
                />
                <p className="text-xs text-gray-500">This name will appear in the header instead of your email</p>
              </div>

            <div className="space-y-2">
              <Label htmlFor="bio" className="text-sm font-semibold text-darktext">
                Bio
              </Label>
              <textarea
                id="bio"
                value={formData.bio}
                onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                placeholder="Tell us about yourself"
                rows={4}
                className="w-full px-3 py-2 border-2 border-gray-300 rounded-md focus:border-rstudio focus:outline-none focus:ring-2 focus:ring-rstudio/20 resize-none bg-white text-darktext placeholder:text-gray-400"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="location" className="text-sm font-semibold text-darktext">
                Location
              </Label>
              <Input
                id="location"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                placeholder="City, Country"
                className="h-11 bg-white border-2 border-gray-300 text-darktext placeholder:text-gray-400 focus:border-rstudio focus:ring-2 focus:ring-rstudio/20"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="website" className="text-sm font-semibold text-darktext">
                Website
              </Label>
              <Input
                id="website"
                type="url"
                value={formData.website}
                onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                placeholder="https://yourwebsite.com"
                className="h-11 bg-white border-2 border-gray-300 text-darktext placeholder:text-gray-400 focus:border-rstudio focus:ring-2 focus:ring-rstudio/20"
              />
            </div>
          </div>

          <div className="flex justify-end space-x-2 pt-4 border-t border-gray-200">
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
    </div>
  )
}

