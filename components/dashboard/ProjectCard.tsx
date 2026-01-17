'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Trash2, FolderOpen, Edit2, Calendar, Users, Shield, Layers, Code } from 'lucide-react'
import { useRouter } from 'next/navigation'
import type { Language } from '@/templates/openai/languages'
import { getLanguageConfig, getBadgeClasses } from '@/templates/openai/languages'

interface ProjectCardProps {
  id: string
  name: string
  description: string
  createdAt: number
  updatedAt: number
  isShared?: boolean
  isNistCompliant?: boolean
  language?: Language
  onDelete: (id: string) => void
  onEdit: (id: string) => void
}

export function ProjectCard({ id, name, description, createdAt, updatedAt, isShared, isNistCompliant, language = 'r', onDelete, onEdit }: ProjectCardProps) {
  const router = useRouter()
  const [isDeleting, setIsDeleting] = useState(false)

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (confirm(`Are you sure you want to delete "${name}"?`)) {
      setIsDeleting(true)
      onDelete(id)
    }
  }

  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation()
    onEdit(id)
  }

  const handleOpen = () => {
    router.push(`/workspace/${id}`)
  }

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
  }

  return (
    <div
      className="group relative bg-zinc-900/80 border border-zinc-800 rounded-2xl p-6 hover:border-emerald-500/50 transition-all duration-300 cursor-pointer hover:shadow-lg hover:shadow-emerald-500/5"
      onClick={handleOpen}
    >
      <div className="flex items-start justify-between mb-4">
        <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center group-hover:bg-emerald-500/20 transition-colors">
          <FolderOpen className="h-6 w-6 text-emerald-500" />
        </div>
        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <Button
            variant="ghost"
            size="icon"
            onClick={handleEdit}
            className="h-8 w-8 text-zinc-400 hover:text-white hover:bg-zinc-800"
            title="Edit project"
          >
            <Edit2 className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleDelete}
            disabled={isDeleting}
            className="h-8 w-8 text-zinc-400 hover:text-red-400 hover:bg-red-500/10"
            title="Delete project"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <h3 className="text-lg font-semibold text-white mb-1 group-hover:text-emerald-400 transition-colors">
        {name}
      </h3>

      <div className="flex items-center gap-2 mb-3">
        <span className={`text-xs px-2 py-0.5 rounded-full flex items-center gap-1 border ${getBadgeClasses(getLanguageConfig(language).badgeColor)}`}>
          <Code className="w-3 h-3" />
          <span>{getLanguageConfig(language).name}</span>
        </span>
        {isShared && (
          <span className="text-xs bg-purple-500/10 text-purple-400 px-2 py-0.5 rounded-full flex items-center gap-1 border border-purple-500/20">
            <Users className="w-3 h-3" />
            <span>Shared</span>
          </span>
        )}
        {isNistCompliant ? (
          <span className="text-xs bg-teal-500/10 text-teal-400 px-2 py-0.5 rounded-full flex items-center gap-1 border border-teal-500/20">
            <Shield className="w-3 h-3" />
            <span>NIST</span>
          </span>
        ) : (
          <span className="text-xs bg-orange-500/10 text-orange-400 px-2 py-0.5 rounded-full flex items-center gap-1 border border-orange-500/20">
            <Layers className="w-3 h-3" />
            <span>Standard</span>
          </span>
        )}
      </div>

      <p className="text-sm text-zinc-500 line-clamp-2 mb-4">
        {description || 'No description'}
      </p>

      <div className="flex items-center text-xs text-zinc-600">
        <Calendar className="h-3 w-3 mr-1" />
        <span>Updated {formatDate(updatedAt)}</span>
      </div>
    </div>
  )
}
