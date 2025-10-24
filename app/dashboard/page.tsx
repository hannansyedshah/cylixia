'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Layout } from '@/components/Layout'
import { ProjectCard } from '@/components/ProjectCard'
import { CreateProjectModal } from '@/components/CreateProjectModal'
import { EditProjectModal } from '@/components/EditProjectModal'
import { Button } from '@/components/ui/button'
import { useSessionStore } from '@/store/useSessionStore'
import { supabase } from '@/lib/supabaseClient'
import { Plus, FolderOpen } from 'lucide-react'

interface Project {
  id: string
  name: string
  description: string
  created_at: string
  updated_at: string
}

export default function DashboardPage() {
  const router = useRouter()
  const { user, setUser } = useSessionStore()
  const [projects, setProjects] = useState<Project[]>([])
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [editingProject, setEditingProject] = useState<Project | null>(null)
  const [loading, setLoading] = useState(true)

  const loadProjects = useCallback(async () => {
    try {
      const response = await fetch('/api/projects')
      const data = await response.json()
      if (data.projects) {
        setProjects(data.projects)
      }
    } catch (error) {
      console.error('Failed to load projects:', error)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    let mounted = true
    
    // Don't redirect immediately, give auth time to load
    const checkAuth = async () => {
      // Check if we have a Supabase session
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!mounted) return
      
      if (!session && !user) {
        router.push('/login')
        return
      }
      
      if (session && !user) {
        // Update local state with session user
        setUser(session.user)
      }
      
      // Only load once
      if (mounted) {
        loadProjects()
      }
    }
    
    checkAuth()
    
    return () => {
      mounted = false
    }
    // Remove loadProjects from dependencies to stop infinite loop!
  }, [user, router, setUser])

  const handleCreateProject = async (name: string, description: string) => {
    try {
      const response = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, description }),
      })
      const data = await response.json()
      if (data.project) {
        router.push(`/workspace/${data.project.id}`)
      }
    } catch (error) {
      console.error('Failed to create project:', error)
    }
  }

  const handleDeleteProject = async (projectId: string) => {
    try {
      await fetch(`/api/projects/${projectId}`, {
        method: 'DELETE',
      })
      setProjects(projects.filter(p => p.id !== projectId))
    } catch (error) {
      console.error('Failed to delete project:', error)
    }
  }

  const handleEditProject = (projectId: string) => {
    const project = projects.find(p => p.id === projectId)
    if (project) {
      setEditingProject(project)
    }
  }

  const handleUpdateProject = async (projectId: string, name: string, description: string) => {
    try {
      const response = await fetch(`/api/projects/${projectId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, description }),
      })
      const data = await response.json()
      if (data.project) {
        setProjects(projects.map(p => p.id === projectId ? data.project : p))
      }
    } catch (error) {
      console.error('Failed to update project:', error)
    }
  }

  if (!user) {
    return null
  }

  return (
    <Layout>
      <div className="min-h-[calc(100vh-80px)] bg-gradient-to-br from-white via-blue-50/30 to-purple-50/30 dark:from-gray-900 dark:via-blue-950/30 dark:to-purple-950/30 relative overflow-hidden">
        {/* Animated Background */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-20 left-10 w-96 h-96 bg-rstudio/10 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-20 right-20 w-80 h-80 bg-purple-400/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
        </div>

        <div className="container mx-auto px-4 py-12 relative z-10">
          {/* Header */}
          <div className="mb-8 animate-fade-in-up">
            <h1 className="text-4xl font-bold text-darktext dark:text-white mb-2">
              My Projects
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Manage your data visualization projects
            </p>
          </div>

          {/* Create Project Button */}
          <div className="mb-8 animate-fade-in-up animation-delay-200">
            <Button
              onClick={() => setShowCreateModal(true)}
              size="lg"
              className="shadow-xl"
            >
              <Plus className="h-5 w-5 mr-2" />
              New Project
            </Button>
          </div>

          {/* Projects Grid */}
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-rstudio"></div>
            </div>
          ) : projects.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 animate-fade-in-up animation-delay-400">
              <div className="animate-float mb-6">
                <FolderOpen className="h-24 w-24 text-gray-300 dark:text-gray-600" />
              </div>
              <h2 className="text-2xl font-semibold text-gray-600 dark:text-gray-400 mb-2">
                No projects yet
              </h2>
              <p className="text-gray-500 dark:text-gray-500 mb-6">
                Create your first project to get started
              </p>
              <Button onClick={() => setShowCreateModal(true)} size="lg">
                <Plus className="h-5 w-5 mr-2" />
                Create Your First Project
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-fade-in-up animation-delay-400">
              {projects.map((project, index) => (
                <div
                  key={project.id}
                  style={{ animationDelay: `${index * 0.1}s` }}
                  className="animate-fade-in-up"
                >
                  <ProjectCard
                    id={project.id}
                    name={project.name}
                    description={project.description}
                    createdAt={new Date(project.created_at).getTime()}
                    updatedAt={new Date(project.updated_at).getTime()}
                    onDelete={handleDeleteProject}
                    onEdit={handleEditProject}
                  />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Create Project Modal */}
        {showCreateModal && (
          <CreateProjectModal
            onClose={() => setShowCreateModal(false)}
            onCreate={handleCreateProject}
          />
        )}

        {/* Edit Project Modal */}
        {editingProject && (
          <EditProjectModal
            projectId={editingProject.id}
            currentName={editingProject.name}
            currentDescription={editingProject.description}
            onClose={() => setEditingProject(null)}
            onUpdate={handleUpdateProject}
          />
        )}
      </div>
    </Layout>
  )
}

