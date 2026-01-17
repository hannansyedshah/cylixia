'use client'

import { useState, useEffect, useRef, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { useSessionStore } from '@/lib/stores/sessionStore'
import { supabase } from '@/lib/supabase/client'
import { getProjects, createProject, updateProject, deleteProject } from '@/lib/db/projects'
import type { Project, Language } from '@/types/database'

interface DashboardProject extends Project {
  is_shared?: boolean
}

type FilterType = 'all' | 'nist' | 'regular'

export function useDashboard() {
  const router = useRouter()
  const { user, setUser } = useSessionStore()

  // State
  const [projects, setProjects] = useState<DashboardProject[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [filterType, setFilterType] = useState<FilterType>('all')
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [editingProject, setEditingProject] = useState<DashboardProject | null>(null)
  const [loading, setLoading] = useState(true)
  const hasLoadedRef = useRef(false)

  // Auth check
  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession()

      if (!session && !user) {
        router.push('/login')
        return
      }

      if (session && !user) {
        setUser(session.user)
      }
    }

    checkAuth()
  }, [user, setUser, router])

  // Load projects when user becomes available (only once)
  useEffect(() => {
    const loadProjects = async () => {
      if (hasLoadedRef.current) return
      hasLoadedRef.current = true

      try {
        setLoading(true)
        const projects = await getProjects()
        setProjects(projects)
      } catch (error) {
        console.error('Failed to load projects:', error)
      } finally {
        setLoading(false)
      }
    }

    if (user && !hasLoadedRef.current) {
      loadProjects()
    }
  }, [user])

  // Filtered projects
  const filteredProjects = useMemo(() => {
    return projects.filter(p => {
      // Apply type filter first
      if (filterType === 'nist' && !p.hipaa_compliant) return false
      if (filterType === 'regular' && p.hipaa_compliant) return false

      // Then apply search filter
      const q = searchQuery.trim().toLowerCase()
      if (!q) return true
      const name = (p.name || '').toLowerCase()
      const desc = (p.description || '').toLowerCase()
      return name.includes(q) || desc.includes(q)
    })
  }, [projects, filterType, searchQuery])

  // Handlers
  const handleCreateProject = async (name: string, description: string, hipaaCompliant: boolean = false, language: Language = 'r') => {
    try {
      const project = await createProject({ name, description, hipaaCompliant, language })
      if (!project) {
        alert('A project with that name already exists. Please choose a different name.')
        return
      }
      setProjects(prev => [project, ...prev])
      router.push(`/workspace/${project.id}`)
    } catch (error) {
      console.error('Failed to create project:', error)
    }
  }

  const handleDeleteProject = async (projectId: string) => {
    try {
      await deleteProject(projectId)
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
      const project = await updateProject(projectId, { name, description })
      if (!project) {
        alert('A project with that name already exists. Please choose a different name.')
        return
      }
      setProjects(projects.map(p => p.id === projectId ? project : p))
    } catch (error) {
      console.error('Failed to update project:', error)
    }
  }

  const refreshProjects = async () => {
    try {
      const projects = await getProjects()
      setProjects(projects)
    } catch (error) {
      console.error('Failed to refresh projects:', error)
    }
  }

  return {
    // Auth
    user,

    // State
    projects,
    filteredProjects,
    searchQuery,
    setSearchQuery,
    filterType,
    setFilterType,
    showCreateModal,
    setShowCreateModal,
    editingProject,
    setEditingProject,
    loading,

    // Handlers
    handleCreateProject,
    handleDeleteProject,
    handleEditProject,
    handleUpdateProject,
    refreshProjects
  }
}
