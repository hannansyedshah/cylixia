'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { X } from 'lucide-react'

interface EditProjectModalProps {
  projectId: string
  currentName: string
  currentDescription: string
  onClose: () => void
  onUpdate: (projectId: string, name: string, description: string) => void
}

export function EditProjectModal({ 
  projectId, 
  currentName, 
  currentDescription, 
  onClose, 
  onUpdate 
}: EditProjectModalProps) {
  const [name, setName] = useState(currentName)
  const [description, setDescription] = useState(currentDescription)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (name.trim()) {
      onUpdate(projectId, name, description)
      onClose()
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in-up">
      <Card className="w-full max-w-lg shadow-2xl border-2 border-rstudio/20 animate-fade-in-up">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-2xl">Edit Project</CardTitle>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="h-5 w-5" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit-name" className="text-sm font-semibold text-darktext dark:text-white">
                Project Name
              </Label>
              <Input
                id="edit-name"
                placeholder="My Research Project"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="h-11 border-2 focus:border-rstudio text-darktext dark:text-white bg-white dark:bg-gray-800"
                autoFocus
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-description" className="text-sm font-semibold text-darktext dark:text-white">
                Description (optional)
              </Label>
              <Input
                id="edit-description"
                placeholder="What is this project about?"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="h-11 border-2 focus:border-rstudio text-darktext dark:text-white bg-white dark:bg-gray-800"
              />
            </div>
            <div className="flex space-x-3 pt-2">
              <Button type="submit" className="flex-1">
                Save Changes
              </Button>
              <Button type="button" variant="outline" onClick={onClose} className="flex-1">
                Cancel
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

