'use client'

import { useState, useEffect } from 'react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { ProfilePictureUpload } from './ProfilePictureUpload'
import { useSessionStore } from '@/lib/stores/sessionStore'
import { getProfile, updateProfile } from '@/lib/db/profile'
import { Loader2, User, MapPin, Globe, FileText, Mail } from 'lucide-react'
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
      window.location.reload()
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
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
      </div>
    )
  }

  return (
    <div className="min-h-screen relative overflow-hidden pt-24">
      {/* Background gradient orbs */}
      <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-emerald-500/5 rounded-full blur-[120px]" />
      <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-emerald-600/5 rounded-full blur-[100px]" />

      <div className="container mx-auto px-6 py-8 max-w-2xl relative z-10">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">
            Profile Settings
          </h1>
          <p className="text-zinc-400">
            Manage your profile information and preferences
          </p>
        </div>

        {/* Profile Card */}
        <div className="relative">
          <div className="absolute -inset-1 bg-gradient-to-r from-emerald-500/20 to-emerald-600/20 rounded-2xl blur-xl" />
          <div className="relative bg-zinc-900/80 border border-zinc-800 rounded-2xl overflow-hidden">
            {/* Avatar Section */}
            <div className="p-8 border-b border-zinc-800 flex justify-center">
              <ProfilePictureUpload
                currentAvatarUrl={profile?.avatar_url}
                onUpload={handleAvatarUpload}
              />
            </div>

            {/* Form Section */}
            <div className="p-8 space-y-6">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium text-zinc-300 flex items-center gap-2">
                  <Mail className="w-4 h-4 text-zinc-500" />
                  Email
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={user?.email || ''}
                  disabled
                  className="h-12 bg-zinc-800/30 border-zinc-700 text-zinc-500 cursor-not-allowed"
                />
                <p className="text-xs text-zinc-600">Email cannot be changed</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="display_name" className="text-sm font-medium text-zinc-300 flex items-center gap-2">
                  <User className="w-4 h-4 text-zinc-500" />
                  Display Name
                </Label>
                <Input
                  id="display_name"
                  value={formData.display_name}
                  onChange={(e) => setFormData({ ...formData, display_name: e.target.value })}
                  placeholder="Your name"
                  className="h-12 bg-zinc-800/50 border-zinc-700 text-white placeholder:text-zinc-500 focus:border-emerald-500 focus:ring-emerald-500/20"
                />
                <p className="text-xs text-zinc-600">This name will appear in the header instead of your email</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="bio" className="text-sm font-medium text-zinc-300 flex items-center gap-2">
                  <FileText className="w-4 h-4 text-zinc-500" />
                  Bio
                </Label>
                <textarea
                  id="bio"
                  value={formData.bio}
                  onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                  placeholder="Tell us about yourself"
                  rows={4}
                  className="w-full px-4 py-3 bg-zinc-800/50 border border-zinc-700 rounded-xl text-white placeholder:text-zinc-500 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 resize-none"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="location" className="text-sm font-medium text-zinc-300 flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-zinc-500" />
                  Location
                </Label>
                <Input
                  id="location"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  placeholder="City, Country"
                  className="h-12 bg-zinc-800/50 border-zinc-700 text-white placeholder:text-zinc-500 focus:border-emerald-500 focus:ring-emerald-500/20"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="website" className="text-sm font-medium text-zinc-300 flex items-center gap-2">
                  <Globe className="w-4 h-4 text-zinc-500" />
                  Website
                </Label>
                <Input
                  id="website"
                  type="url"
                  value={formData.website}
                  onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                  placeholder="https://yourwebsite.com"
                  className="h-12 bg-zinc-800/50 border-zinc-700 text-white placeholder:text-zinc-500 focus:border-emerald-500 focus:ring-emerald-500/20"
                />
              </div>

              <div className="flex justify-end pt-4 border-t border-zinc-800">
                <Button
                  onClick={handleSave}
                  disabled={saving}
                  className="min-w-[140px] h-11 bg-emerald-500 hover:bg-emerald-400 text-black font-medium"
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
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
