'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Loader2, X, Mail } from 'lucide-react'

interface InviteCollaboratorModalProps {
  projectId: string
  onClose: () => void
  onSuccess?: () => void
}

export function InviteCollaboratorModal({ projectId, onClose, onSuccess }: InviteCollaboratorModalProps) {
  const [email, setEmail] = useState('')
  const [role, setRole] = useState<'edit' | 'view'>('edit')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  }

  const handleInvite = async () => {
    // Validate email
    if (!email || !email.trim()) {
      setError('Please enter an email address')
      return
    }

    const trimmedEmail = email.trim().toLowerCase()
    if (!validateEmail(trimmedEmail)) {
      setError('Please enter a valid email address')
      return
    }

    setLoading(true)
    setError('')
    setSuccess(false)

    try {
      const response = await fetch(`/api/projects/${projectId}/collaborators/invite`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: trimmedEmail,
          role,
          message: message.trim() || null
        })
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to send invitation')
      }

      setSuccess(true)
      setTimeout(() => {
        if (onSuccess) onSuccess()
        onClose()
      }, 1500)
    } catch (error: any) {
      setError(error.message || 'Failed to send invitation')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-md shadow-2xl border-2 border-rstudio/10">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-2xl">Invite Collaborator</CardTitle>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="w-4 h-4" />
            </Button>
          </div>
          <CardDescription>
            Enter an email address to send a collaboration invitation
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email Address</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="user@example.com"
                className="pl-10 h-11 bg-white dark:bg-gray-800 border-2 border-gray-300 dark:border-gray-600 text-darktext dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:border-rstudio focus:ring-2 focus:ring-rstudio/20"
                disabled={loading}
              />
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-500">
              An invitation email will be sent to this address
            </p>
          </div>

          <div className="space-y-2">
            <Label>Role</Label>
            <div className="flex space-x-4">
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="radio"
                  name="role"
                  value="edit"
                  checked={role === 'edit'}
                  onChange={() => setRole('edit')}
                  className="w-4 h-4 text-rstudio"
                />
                <span>Edit</span>
              </label>
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="radio"
                  name="role"
                  value="view"
                  checked={role === 'view'}
                  onChange={() => setRole('view')}
                  className="w-4 h-4 text-rstudio"
                />
                <span>View</span>
              </label>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="message">Message (Optional)</Label>
            <textarea
              id="message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Add a personal message..."
              rows={3}
              className="w-full px-3 py-2 border-2 border-gray-300 dark:border-gray-600 rounded-md focus:border-rstudio focus:outline-none resize-none bg-white dark:bg-gray-800 text-darktext dark:text-white"
            />
          </div>

          {error && (
            <div className="p-3 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 rounded-md text-sm">
              {error}
            </div>
          )}

          {success && (
            <div className="p-3 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 rounded-md text-sm">
              Invitation sent successfully! The recipient will receive an email with instructions.
            </div>
          )}

          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={onClose} disabled={loading}>
              Cancel
            </Button>
            <Button 
              onClick={handleInvite} 
              disabled={loading || !email.trim()}
              className="bg-rstudio hover:bg-rstudio/90 text-white"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Mail className="w-4 h-4 mr-2" />
                  Send Invitation
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

