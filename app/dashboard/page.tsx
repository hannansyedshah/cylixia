'use client'

import { Layout } from '@/components/layout/Layout'
import { ProjectCard } from '@/components/dashboard/ProjectCard'
import { CreateProjectModal } from '@/components/dashboard/CreateProjectModal'
import { EditProjectModal } from '@/components/dashboard/EditProjectModal'
import { Button } from '@/components/ui/button'
import { Plus, FolderOpen } from 'lucide-react'
import { useDashboard } from '@/hooks/dashboard/useDashboard'

export default function DashboardPage() {
  const {
    user,
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
    handleCreateProject,
    handleDeleteProject,
    handleEditProject,
    handleUpdateProject
  } = useDashboard()

  if (!user) {
    return null
  }

  return (
    <Layout>
      <div className="min-h-[calc(100vh-80px)] bg-gradient-to-br from-white via-blue-50/30 to-purple-50/30 relative overflow-hidden">
        {/* Animated Background */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none" style={{ contain: 'layout style paint' }}>
          <div className="absolute top-20 left-10 w-96 h-96 bg-rstudio/10 rounded-full blur-3xl animate-pulse will-change-transform" style={{ transform: 'translateZ(0)' }}></div>
          <div className="absolute bottom-20 right-20 w-80 h-80 bg-purple-400/10 rounded-full blur-3xl animate-pulse will-change-transform" style={{ animationDelay: '1000ms', transform: 'translateZ(0)' }}></div>
        </div>

        <div className="container mx-auto px-4 py-12 relative z-10 min-h-[400px]">
          {/* Header */}
          <div className="mb-8 animate-fade-in-up">
            <h1 className="text-4xl font-bold text-darktext mb-2">
              My Projects
            </h1>
            <p className="text-gray-600">
              Manage your data visualization projects
            </p>
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

              {/* Filter Buttons */}
              <div className="flex gap-2 border-l-2 border-gray-200 pl-3">
                <Button
                  onClick={() => setFilterType('all')}
                  size="sm"
                  variant={filterType === 'all' ? 'default' : 'outline'}
                  className={filterType === 'all' ? '' : 'hover:bg-gray-100'}
                >
                  All
                </Button>
                <Button
                  onClick={() => setFilterType('nist')}
                  size="sm"
                  variant={filterType === 'nist' ? 'default' : 'outline'}
                  className={filterType === 'nist' ? 'bg-emerald-600 hover:bg-emerald-700' : 'hover:bg-emerald-50 text-emerald-700 border-emerald-300'}
                >
                  NIST Only
                </Button>
                <Button
                  onClick={() => setFilterType('regular')}
                  size="sm"
                  variant={filterType === 'regular' ? 'default' : 'outline'}
                  className={filterType === 'regular' ? '' : 'hover:bg-gray-100'}
                >
                  Regular Only
                </Button>
              </div>

              <div className="ml-auto w-full md:w-80">
                <input
                  type="text"
                  placeholder="Search projects…"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full h-11 rounded-md border-2 border-gray-200 bg-white px-3 text-darktext focus:outline-none focus:border-rstudio"
                />
              </div>
            </div>
          </div>

          {/* Projects Grid */}
          {loading ? (
            <div className="flex items-center justify-center py-20 min-h-[300px]">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-rstudio"></div>
            </div>
          ) : filteredProjects.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 animate-fade-in-up animation-delay-400">
              <div className="animate-float mb-6">
                <FolderOpen className="h-24 w-24 text-gray-300" />
              </div>
              <h2 className="text-2xl font-semibold text-gray-600 mb-2">
                No projects yet
              </h2>
              <p className="text-gray-500 mb-6">
                Create your first project to get started
              </p>
              <Button onClick={() => setShowCreateModal(true)} size="lg">
                <Plus className="h-5 w-5 mr-2" />
                Create Your First Project
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-fade-in-up animation-delay-400 min-h-[200px]">
              {filteredProjects.map((project, index) => (
                <div
                  key={project.id}
                  style={{ animationDelay: `${index * 0.1}s` }}
                  className="animate-fade-in-up"
                >
                  <ProjectCard
                    id={project.id}
                    name={project.name}
                    description={project.description ?? ''}
                    createdAt={new Date(project.created_at).getTime()}
                    updatedAt={new Date(project.updated_at).getTime()}
                    isShared={project.is_shared || project.user_id !== user?.id}
                    isNistCompliant={project.hipaa_compliant}
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
            currentDescription={editingProject.description ?? ''}
            onClose={() => setEditingProject(null)}
            onUpdate={handleUpdateProject}
          />
        )}
      </div>
    </Layout>
  )
}
