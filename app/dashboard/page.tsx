'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { Layout } from '@/components/Layout'
import { ProjectCard } from '@/components/ProjectCard'
import { CreateProjectModal } from '@/components/CreateProjectModal'
import { EditProjectModal } from '@/components/EditProjectModal'
import { CollaborationRequests } from '@/components/CollaborationRequests'
import { Button } from '@/components/ui/button'
import { useSessionStore } from '@/store/useSessionStore'
import { supabase } from '@/lib/supabaseClient'
import { Plus, FolderOpen, RefreshCw } from 'lucide-react'

interface Project {
  id: string
  name: string
  description: string
  created_at: string
  updated_at: string
  is_shared?: boolean
  user_id?: string
}

export default function DashboardPage() {
  const router = useRouter()
  const pathname = usePathname()
  const { user, setUser } = useSessionStore()
  const [projects, setProjects] = useState<Project[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [editingProject, setEditingProject] = useState<Project | null>(null)
  const [loading, setLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const hasLoadedRef = useRef(false)
  const refreshAttemptsRef = useRef(0)
  const intervalRef = useRef<any>(null)
  const inFlightRef = useRef(false)
  const mountedRef = useRef(true)
  const visibilityTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  const loadProjects = useCallback(async () => {
    // Avoid spamming requests due to rapid remounts/back nav or render loops
    if (hasLoadedRef.current || inFlightRef.current) return

    inFlightRef.current = true
    hasLoadedRef.current = true // mark early; allow manual/interval refresh to reset
    try {
      setLoading(true)
      console.log('Loading projects...')

      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 10000)
      const response = await fetch('/api/projects', {
        cache: 'no-store',
        signal: controller.signal,
      })
      clearTimeout(timeoutId)
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`)
      }
      
      const data = await response.json()
      console.log('Projects loaded:', data.projects?.length || 0)
      
      if (mountedRef.current && data.projects) {
        setProjects(data.projects)
      }
    } catch (error) {
      console.error('Failed to load projects:', error)
    } finally {
      if (mountedRef.current) {
        setLoading(false)
      }
      // Always reset inFlight, even on error
      inFlightRef.current = false
    }
  }, [])

  // Handle authentication state changes
  useEffect(() => {
    let mounted = true
    
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!mounted) return
      
      if (!session && !user) {
        router.push('/login')
        return
      }
      
      if (session && !user) {
        setUser(session.user)
      }
    }
    
    checkAuth()
    
    return () => {
      mounted = false
    }
  }, [user, setUser, router])

  // Load projects when user becomes available (only once)
  useEffect(() => {
    if (user && !hasLoadedRef.current) {
      loadProjects()
    }
  }, [user, loadProjects])

  // Auto-refresh will be set up after refreshProjects is defined

  const handleCreateProject = async (name: string, description: string, hipaaCompliant: boolean = false) => {
    try {
      const response = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, description, hipaaCompliant }),
      })
      if (response.status === 409) {
        alert('A project with that name already exists. Please choose a different name.')
        return
      }
      const data = await response.json()
      if (mountedRef.current && data.project) {
        // Add to local state immediately
        setProjects(prev => [data.project, ...prev])
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
      if (mountedRef.current) {
        setProjects(projects.filter(p => p.id !== projectId))
      }
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
      if (response.status === 409) {
        alert('A project with that name already exists. Please choose a different name.')
        return
      }
      const data = await response.json()
      if (mountedRef.current && data.project) {
        setProjects(projects.map(p => p.id === projectId ? data.project : p))
      }
    } catch (error) {
      console.error('Failed to update project:', error)
    }
  }

  const refreshProjects = useCallback(async () => {
    try {
      if (mountedRef.current) {
        setIsRefreshing(true)
        hasLoadedRef.current = false
        setProjects([]) // Clear existing projects
      }
      await loadProjects()
    } finally {
      if (mountedRef.current) {
        setIsRefreshing(false)
      }
    }
  }, [loadProjects])

  // Auto-refresh with a hard cap of 5 times; cleans up on unmount/navigation
  useEffect(() => {
    if (!user) return
    // Only auto-refresh on dashboard route
    if (pathname !== '/dashboard') return
    // Clear any existing interval before starting a new one
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }
    refreshAttemptsRef.current = 0
    intervalRef.current = setInterval(() => {
      // Stop if navigated away
      if (pathname !== '/dashboard') {
        clearInterval(intervalRef.current)
        intervalRef.current = null
        return
      }
      // Stop once we've hit the cap
      if (refreshAttemptsRef.current >= 5) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
        return
      }
      // Only refresh when tab is visible
      if (typeof document !== 'undefined' && document.visibilityState !== 'visible') {
        return
      }
      refreshProjects()
      refreshAttemptsRef.current += 1
    }, 15000) // 15s cadence; adjust if needed

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
    }
  }, [user, pathname, refreshProjects])

  // Handle visibility changes to reset stuck states
  // Use refs to access current state values to avoid recreating listener
  const loadingRef = useRef(loading)
  const isRefreshingRef = useRef(isRefreshing)
  
  useEffect(() => {
    loadingRef.current = loading
    isRefreshingRef.current = isRefreshing
  }, [loading, isRefreshing])

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && mountedRef.current) {
        // Clear any existing timeout first
        if (visibilityTimeoutRef.current) {
          clearTimeout(visibilityTimeoutRef.current)
          visibilityTimeoutRef.current = null
        }

        // Reset stuck states when tab becomes visible again
        // Use refs to get current values without causing dependency issues
        const currentLoading = loadingRef.current
        const currentIsRefreshing = isRefreshingRef.current

        // If in-flight flag is set but not actually loading/refreshing, reset it
        if (inFlightRef.current && !currentLoading && !currentIsRefreshing) {
          inFlightRef.current = false
        }
        // If refreshing flag is stuck without an active request
        if (currentIsRefreshing && !inFlightRef.current) {
          setIsRefreshing(false)
        }
        // If loading is stuck (no active request), reset it after a delay
        // This ensures buttons become clickable again
        if (currentLoading && !inFlightRef.current) {
          // Loading state is stuck - reset it
          visibilityTimeoutRef.current = setTimeout(() => {
            if (mountedRef.current && loadingRef.current && !inFlightRef.current) {
              setLoading(false)
            }
            visibilityTimeoutRef.current = null
          }, 1000)
        }
      } else if (document.visibilityState === 'hidden') {
        // Clear timeout when tab becomes hidden
        if (visibilityTimeoutRef.current) {
          clearTimeout(visibilityTimeoutRef.current)
          visibilityTimeoutRef.current = null
        }
      }
    }

    if (typeof document !== 'undefined') {
      document.addEventListener('visibilitychange', handleVisibilityChange)
      return () => {
        document.removeEventListener('visibilitychange', handleVisibilityChange)
        // Clean up any pending timeout
        if (visibilityTimeoutRef.current) {
          clearTimeout(visibilityTimeoutRef.current)
          visibilityTimeoutRef.current = null
        }
      }
    }
  }, []) // Empty deps - use refs to access current state

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      mountedRef.current = false
    }
  }, [])

  if (!user) {
    return null
  }

  return (
    <Layout>
      <div className="min-h-[calc(100vh-80px)] bg-gradient-to-br from-white via-blue-50/30 to-purple-50/30 dark:from-gray-900 dark:via-blue-950/30 dark:to-purple-950/30 relative overflow-hidden">
        {/* Animated Background */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none" style={{ contain: 'layout style paint' }}>
          <div className="absolute top-20 left-10 w-96 h-96 bg-rstudio/10 rounded-full blur-3xl animate-pulse will-change-transform" style={{ transform: 'translateZ(0)' }}></div>
          <div className="absolute bottom-20 right-20 w-80 h-80 bg-purple-400/10 rounded-full blur-3xl animate-pulse will-change-transform" style={{ animationDelay: '1000ms', transform: 'translateZ(0)' }}></div>
        </div>

        <div className="container mx-auto px-4 py-12 relative z-10 min-h-[400px]">
          {/* Header */}
          <div className="mb-8 animate-fade-in-up">
            <h1 className="text-4xl font-bold text-darktext dark:text-white mb-2">
              My Projects
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Manage your data visualization projects
            </p>
          </div>

          {/* Collaboration Requests */}
          <div className="mb-8 animate-fade-in-up animation-delay-200">
            <CollaborationRequests />
          </div>

          {/* Actions + Search */}
          <div className="mb-8 animate-fade-in-up animation-delay-200">
            <div className="flex gap-3 flex-wrap items-center">
              <Button
                onClick={() => setShowCreateModal(true)}
                size="lg"
                className="shadow-xl"
              >
                <Plus className="h-5 w-5 mr-2" />
                New Project
              </Button>
              <Button
                onClick={refreshProjects}
                size="lg"
                variant="outline"
                disabled={isRefreshing}
              >
                <RefreshCw className={isRefreshing ? 'h-5 w-5 mr-2 animate-spin' : 'h-5 w-5 mr-2'} />
                {isRefreshing ? 'Refreshing' : 'Refresh'}
              </Button>
              <div className="ml-auto w-full md:w-80">
                <input
                  type="text"
                  placeholder="Search projects…"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full h-11 rounded-md border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 text-darktext dark:text-white focus:outline-none focus:border-rstudio"
                />
              </div>
            </div>
          </div>

          {/* Projects Grid */}
          {loading ? (
            <div className="flex items-center justify-center py-20 min-h-[300px]">
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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-fade-in-up animation-delay-400 min-h-[200px]">
              {projects
                .filter(p => {
                  const q = searchQuery.trim().toLowerCase()
                  if (!q) return true
                  const name = (p.name || '').toLowerCase()
                  const desc = (p.description || '').toLowerCase()
                  return name.includes(q) || desc.includes(q)
                })
                .map((project, index) => (
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
                    isShared={project.is_shared || project.user_id !== user?.id}
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

