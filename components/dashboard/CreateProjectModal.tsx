'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { X, Shield } from 'lucide-react'

interface CreateProjectModalProps {
  onClose: () => void
  onCreate: (name: string, description: string, hipaaCompliant: boolean) => void
}

export function CreateProjectModal({ onClose, onCreate }: CreateProjectModalProps) {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [hipaaCompliant, setHipaaCompliant] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (name.trim()) {
      onCreate(name, description, hipaaCompliant)
      onClose()
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in-up">
      <Card className="w-full max-w-lg shadow-2xl border-2 border-rstudio/20 animate-fade-in-up">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-2xl">Create New Project</CardTitle>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="h-5 w-5" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name" className="text-sm font-semibold text-darktext">Project Name</Label>
              <Input
                id="name"
                placeholder="My Research Project"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="h-11 border-2 focus:border-rstudio text-darktext bg-white"
                autoFocus
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description" className="text-sm font-semibold text-darktext">Description (optional)</Label>
              <Input
                id="description"
                placeholder="What is this project about?"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="h-11 border-2 focus:border-rstudio text-darktext bg-white"
              />
            </div>
            <div className="space-y-3 pt-2 pb-2 border-t border-gray-200">
              <div className="flex items-start space-x-3 p-3 rounded-lg bg-blue-50 border border-blue-200">
                <input
                  type="checkbox"
                  id="hipaaCompliant"
                  checked={hipaaCompliant}
                  onChange={(e) => setHipaaCompliant(e.target.checked)}
                  className="mt-1 w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
                />
                <div className="flex-1">
                  <Label htmlFor="hipaaCompliant" className="flex items-center gap-2 text-sm font-semibold text-darktext cursor-pointer">
                    <Shield className="h-4 w-4 text-blue-600" />
                    NIST Compliant Mode
                  </Label>
                  <p className="text-xs text-gray-600 mt-1">
                    Automatically redacts PHI (names, SSN, DOB, addresses, etc.) from uploaded datasets. 
                    Original data is never stored - only redacted versions. You are responsible for compliance verification.
                  </p>
                </div>
              </div>
            </div>
            <div className="flex space-x-3 pt-2">
              <Button type="submit" className="flex-1">
                Create Project
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

