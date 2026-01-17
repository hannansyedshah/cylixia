'use client'

import { useState } from 'react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { X, Shield, FolderPlus } from 'lucide-react'
import type { Language } from '@/types/database'

interface CreateProjectModalProps {
  onClose: () => void
  onCreate: (name: string, description: string, hipaaCompliant: boolean, language: Language) => void
}

export function CreateProjectModal({ onClose, onCreate }: CreateProjectModalProps) {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [hipaaCompliant, setHipaaCompliant] = useState(false)
  const [language, setLanguage] = useState<Language>('r')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (name.trim()) {
      onCreate(name, description, hipaaCompliant, language)
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
                <FolderPlus className="h-5 w-5 text-emerald-500" />
              </div>
              <h2 className="text-xl font-semibold text-white">Create New Project</h2>
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
              <Label htmlFor="name" className="text-sm font-medium text-zinc-300">
                Project Name
              </Label>
              <Input
                id="name"
                placeholder="My Research Project"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                autoFocus
                className="h-12 bg-zinc-800/50 border-zinc-700 text-white placeholder:text-zinc-500 focus:border-emerald-500 focus:ring-emerald-500/20"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description" className="text-sm font-medium text-zinc-300">
                Description (optional)
              </Label>
              <Input
                id="description"
                placeholder="What is this project about?"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="h-12 bg-zinc-800/50 border-zinc-700 text-white placeholder:text-zinc-500 focus:border-emerald-500 focus:ring-emerald-500/20"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium text-zinc-300">
                Language
              </Label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setLanguage('r')}
                  className={`flex-1 h-11 rounded-lg font-medium transition-all ${
                    language === 'r'
                      ? 'bg-emerald-500 text-black'
                      : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700 hover:text-zinc-300'
                  }`}
                >
                  R
                </button>
                <button
                  type="button"
                  onClick={() => setLanguage('python')}
                  className={`flex-1 h-11 rounded-lg font-medium transition-all ${
                    language === 'python'
                      ? 'bg-emerald-500 text-black'
                      : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700 hover:text-zinc-300'
                  }`}
                >
                  Python
                </button>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-zinc-800/50 border border-teal-500/20">
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={hipaaCompliant}
                  onChange={(e) => setHipaaCompliant(e.target.checked)}
                  className="mt-1 w-4 h-4 rounded border-zinc-600 bg-zinc-700 text-teal-500 focus:ring-teal-500 focus:ring-offset-0"
                />
                <div className="flex-1">
                  <div className="flex items-center gap-2 text-sm font-medium text-white">
                    <Shield className="h-4 w-4 text-teal-400" />
                    NIST Compliant Mode
                  </div>
                  <p className="text-xs text-zinc-500 mt-1">
                    Automatically redacts PHI (names, SSN, DOB, addresses, etc.) from uploaded datasets.
                    Original data is never stored - only redacted versions.
                  </p>
                </div>
              </label>
            </div>

            <div className="flex gap-3 pt-2">
              <Button
                type="submit"
                className="flex-1 h-11 bg-emerald-500 hover:bg-emerald-400 text-black font-medium"
              >
                Create Project
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                className="flex-1 h-11 bg-zinc-800 border-zinc-700 text-zinc-300 hover:bg-zinc-700 hover:text-white"
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
