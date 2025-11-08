'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { UserSearch } from './UserSearch'
import { Loader2, X } from 'lucide-react'

interface InviteCollaboratorModalProps {
  projectId: string
  onClose: () => void
  onSuccess?: () => void
}

interface User {
  id: string
  display_name: string | null
  avatar_url: string | null
}

export function InviteCollaboratorModal({ projectId, onClose, onSuccess }: InviteCollaboratorModalProps) {
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [role, setRole] = useState<'edit' | 'view'>('edit')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleInvite = async () => {
    if (!selectedUser) {
      setError('Please select a user')
      return
    }

    setLoading(true)
    setError('')

    try {
      const response = await fetch(`/api/projects/${projectId}/collaborators`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to_user_id: selectedUser.id,
          role,
          message: message.trim() || null
        })
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to send invitation')
      }

      if (onSuccess) onSuccess()
      onClose()
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
            Search for a user and invite them to collaborate on this project
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Search User</Label>
            <UserSearch
              onSelect={setSelectedUser}
              excludeUserIds={[]}
            />
            {selectedUser && (
              <div className="p-2 bg-gray-100 dark:bg-gray-800 rounded-md flex items-center space-x-2">
                <span className="text-sm">Selected: {selectedUser.display_name || 'User'}</span>
              </div>
            )}
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

          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={onClose} disabled={loading}>
              Cancel
            </Button>
            <Button onClick={handleInvite} disabled={loading || !selectedUser}>
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Sending...
                </>
              ) : (
                'Send Invitation'
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

