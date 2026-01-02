'use client'

import { useState } from 'react'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Trash2, FolderOpen, Edit2, Calendar, Users, Shield } from 'lucide-react'
import { useRouter } from 'next/navigation'

interface ProjectCardProps {
  id: string
  name: string
  description: string
  createdAt: number
  updatedAt: number
  isShared?: boolean
  isNistCompliant?: boolean
  onDelete: (id: string) => void
  onEdit: (id: string) => void
}

export function ProjectCard({ id, name, description, createdAt, updatedAt, isShared, isNistCompliant, onDelete, onEdit }: ProjectCardProps) {
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
    <Card 
      className="group hover:shadow-2xl hover:border-rstudio/50 transition-all duration-300 transform hover:scale-105 cursor-pointer border-2 border-transparent"
      onClick={handleOpen}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <FolderOpen className="h-8 w-8 text-rstudio mb-2 group-hover:animate-bounce" />
          <div className="flex space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <Button
              variant="ghost"
              size="icon"
              onClick={handleEdit}
              className="hover:bg-blue-100"
              title="Edit project"
            >
              <Edit2 className="h-4 w-4 text-rstudio" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleDelete}
              disabled={isDeleting}
              className="hover:bg-red-100"
              title="Delete project"
            >
              <Trash2 className="h-4 w-4 text-red-600" />
            </Button>
          </div>
        </div>
        <CardTitle className="text-xl group-hover:text-rstudio transition-colors flex items-center flex-wrap gap-2">
          <span>{name}</span>
          <div className="flex items-center gap-2">
            {isShared && (
              <span className="text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full flex items-center space-x-1">
                <Users className="w-3 h-3" />
                <span>Shared</span>
              </span>
            )}
            {isNistCompliant && (
              <span className="text-xs bg-gradient-to-r from-emerald-100 to-teal-100 text-emerald-800 px-2 py-0.5 rounded-full flex items-center space-x-1 border border-emerald-300">
                <Shield className="w-3 h-3" />
                <span>NIST</span>
              </span>
            )}
          </div>
        </CardTitle>
        <CardDescription className="line-clamp-2">
          {description || 'No description'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex items-center text-xs text-gray-500">
          <Calendar className="h-3 w-3 mr-1" />
          <span>Updated {formatDate(updatedAt)}</span>
        </div>
      </CardContent>
    </Card>
  )
}

