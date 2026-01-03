'use client'

import { DashboardLayout } from '@/components/dashboard/DashboardLayout'
import { ProjectCard } from '@/components/dashboard/ProjectCard'
import { CreateProjectModal } from '@/components/dashboard/CreateProjectModal'
import { EditProjectModal } from '@/components/dashboard/EditProjectModal'
import { Button } from '@/components/ui/button'
import { Plus, FolderOpen, Search } from 'lucide-react'
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
    <DashboardLayout>
      <div className="min-h-screen relative overflow-hidden pt-24">
        {/* Background gradient orbs */}
        <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-emerald-500/5 rounded-full blur-[120px]" />
        <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-emerald-600/5 rounded-full blur-[100px]" />

        <div className="container mx-auto px-6 py-8 relative z-10">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">
              My Projects
            </h1>
            <p className="text-zinc-400">
              Manage your data visualization projects
            </p>
          </div>

          {/* Actions + Search */}
          <div className="mb-8">
            <div className="flex flex-wrap gap-4 items-center">
              <Button
                onClick={() => setShowCreateModal(true)}
                className="bg-emerald-500 hover:bg-emerald-400 text-black font-medium h-11 px-5"
              >
                <Plus className="h-5 w-5 mr-2" />
                New Project
              </Button>

              {/* Filter Buttons */}
              <div className="flex gap-2 border-l border-zinc-800 pl-4">
                <Button
                  onClick={() => setFilterType('all')}
                  size="sm"
                  variant={filterType === 'all' ? 'default' : 'outline'}
                  className={filterType === 'all'
                    ? 'bg-zinc-700 hover:bg-zinc-600 text-white scale-105'
                    : 'bg-zinc-800 border-zinc-700 text-zinc-400 hover:bg-zinc-700 hover:text-white hover:scale-105 hover:border-zinc-600 transition-all'
                  }
                >
                  All
                </Button>
                <Button
                  onClick={() => setFilterType('nist')}
                  size="sm"
                  variant={filterType === 'nist' ? 'default' : 'outline'}
                  className={filterType === 'nist'
                    ? 'bg-zinc-700 hover:bg-zinc-600 text-teal-400 scale-105'
                    : 'bg-zinc-800 border-zinc-700 text-teal-400 hover:bg-zinc-700 hover:text-teal-300 hover:scale-105 hover:border-teal-500/50 transition-all'
                  }
                >
                  NIST
                </Button>
                <Button
                  onClick={() => setFilterType('regular')}
                  size="sm"
                  variant={filterType === 'regular' ? 'default' : 'outline'}
                  className={filterType === 'regular'
                    ? 'bg-zinc-700 hover:bg-zinc-600 text-orange-400 scale-105'
                    : 'bg-zinc-800 border-zinc-700 text-orange-400 hover:bg-zinc-700 hover:text-orange-300 hover:scale-105 hover:border-orange-500/50 transition-all'
                  }
                >
                  Standard
                </Button>
              </div>

              <div className="ml-auto w-full md:w-80 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />
                <input
                  type="text"
                  placeholder="Search projects..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full h-11 rounded-xl border border-zinc-800 bg-zinc-900/50 pl-11 pr-4 text-white placeholder:text-zinc-500 focus:outline-none focus:border-emerald-500 transition-colors"
                />
              </div>
            </div>
          </div>

          {/* Projects Grid */}
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500"></div>
            </div>
          ) : filteredProjects.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20">
              <div className="w-20 h-20 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center mb-6">
                <FolderOpen className="h-10 w-10 text-zinc-600" />
              </div>
              <h2 className="text-xl font-semibold text-white mb-2">
                No projects yet
              </h2>
              <p className="text-zinc-500 mb-6">
                Create your first project to get started
              </p>
              <Button
                onClick={() => setShowCreateModal(true)}
                className="bg-emerald-500 hover:bg-emerald-400 text-black font-medium"
              >
                <Plus className="h-5 w-5 mr-2" />
                Create Your First Project
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredProjects.map((project) => (
                <ProjectCard
                  key={project.id}
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
    </DashboardLayout>
  )
}
