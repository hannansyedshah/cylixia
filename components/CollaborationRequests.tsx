'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { UserAvatar } from './UserAvatar'
import { Loader2, Check, X } from 'lucide-react'

interface CollaborationRequest {
  id: string
  project_id: string
  from_user_id: string
  to_user_id: string
  role: 'edit' | 'view'
  message: string | null
  status: 'pending' | 'accepted' | 'declined' | 'cancelled'
  created_at: string
  project?: {
    id: string
    name: string
    description: string | null
  }
  from_user?: {
    id: string
    display_name: string | null
    avatar_url: string | null
  }
}

export function CollaborationRequests() {
  const [requests, setRequests] = useState<CollaborationRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState<string | null>(null)

  useEffect(() => {
    loadRequests()
  }, [])

  const loadRequests = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/collaboration-requests?type=received')
      if (!response.ok) throw new Error('Failed to load requests')
      
      const data = await response.json()
      setRequests(data.requests || [])
    } catch (error) {
      console.error('Failed to load requests:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleResponse = async (requestId: string, status: 'accepted' | 'declined') => {
    setProcessing(requestId)
    try {
      const response = await fetch(`/api/collaboration-requests/${requestId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to respond to request')
      }

      // Reload requests
      await loadRequests()
    } catch (error: any) {
      alert(error.message || 'Failed to respond to request')
    } finally {
      setProcessing(null)
    }
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Collaboration Requests</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-8 h-8 animate-spin text-rstudio" />
          </div>
        </CardContent>
      </Card>
    )
  }

  const pendingRequests = requests.filter(r => r.status === 'pending')

  if (pendingRequests.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Collaboration Requests</CardTitle>
          <CardDescription>You have no pending requests</CardDescription>
        </CardHeader>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Collaboration Requests</CardTitle>
        <CardDescription>
          {pendingRequests.length} pending request{pendingRequests.length !== 1 ? 's' : ''}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {pendingRequests.map((request) => (
          <div
            key={request.id}
            className="p-4 border-2 border-gray-200 dark:border-gray-700 rounded-md space-y-3"
          >
            <div className="flex items-start space-x-3">
              <UserAvatar
                userId={request.from_user_id}
                displayName={request.from_user?.display_name}
                avatarUrl={request.from_user?.avatar_url}
                size="md"
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-center space-x-2">
                  <span className="font-semibold">
                    {request.from_user?.display_name || 'User'}
                  </span>
                  <span className="text-sm text-gray-500">invited you to collaborate</span>
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  Project: <span className="font-medium">{request.project?.name || 'Unnamed Project'}</span>
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  Role: <span className="font-medium capitalize">{request.role}</span>
                </div>
                {request.message && (
                  <div className="mt-2 p-2 bg-gray-100 dark:bg-gray-800 rounded-md text-sm">
                    {request.message}
                  </div>
                )}
              </div>
            </div>
            <div className="flex justify-end space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleResponse(request.id, 'declined')}
                disabled={processing === request.id}
                className="text-destructive hover:text-destructive"
              >
                {processing === request.id ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <X className="w-4 h-4 mr-1" />
                    Decline
                  </>
                )}
              </Button>
              <Button
                size="sm"
                onClick={() => handleResponse(request.id, 'accepted')}
                disabled={processing === request.id}
              >
                {processing === request.id ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <Check className="w-4 h-4 mr-1" />
                    Accept
                  </>
                )}
              </Button>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}

