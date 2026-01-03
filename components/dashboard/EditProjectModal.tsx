'use client'

import { useState } from 'react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { X, Edit3 } from 'lucide-react'

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
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="relative w-full max-w-lg">
        <div className="absolute -inset-1 bg-gradient-to-r from-emerald-500/20 to-emerald-600/20 rounded-2xl blur-xl" />
        <div className="relative bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-zinc-800">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                <Edit3 className="h-5 w-5 text-emerald-500" />
              </div>
              <h2 className="text-xl font-semibold text-white">Edit Project</h2>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="text-zinc-400 hover:text-white hover:bg-zinc-800"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-6 space-y-5">
            <div className="space-y-2">
              <Label htmlFor="edit-name" className="text-sm font-medium text-zinc-300">
                Project Name
              </Label>
              <Input
                id="edit-name"
                placeholder="My Research Project"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                autoFocus
                className="h-12 bg-zinc-800/50 border-zinc-700 text-white placeholder:text-zinc-500 focus:border-emerald-500 focus:ring-emerald-500/20"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-description" className="text-sm font-medium text-zinc-300">
                Description (optional)
              </Label>
              <Input
                id="edit-description"
                placeholder="What is this project about?"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="h-12 bg-zinc-800/50 border-zinc-700 text-white placeholder:text-zinc-500 focus:border-emerald-500 focus:ring-emerald-500/20"
              />
            </div>

            <div className="flex gap-3 pt-2">
              <Button
                type="submit"
                className="flex-1 h-11 bg-emerald-500 hover:bg-emerald-400 text-black font-medium"
              >
                Save Changes
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                className="flex-1 h-11 border-zinc-700 text-zinc-300 hover:bg-zinc-800 hover:text-white"
              >
                Cancel
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
