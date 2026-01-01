import type { Project, Message } from '@/types/database'
import type { SharedDataset } from '@/types/dataset'

export interface ProjectWithData extends Project {
  messages?: Message[]
  stdout?: string
  stderr?: string
  plot_url?: string | null
}

export async function getProject(id: string): Promise<ProjectWithData | null> {
  const res = await fetch(`/api/projects/${id}`)
  if (!res.ok) return null
  const { project } = await res.json()
  return project
}

export async function getMessages(projectId: string): Promise<Message[]> {
  const res = await fetch(`/api/projects/${projectId}/messages`)
  if (!res.ok) return []
  const { messages } = await res.json()
  return messages || []
}

export async function getSharedDatasets(projectId: string): Promise<SharedDataset[]> {
  const res = await fetch(`/api/projects/${projectId}/shared-datasets`)
  if (!res.ok) return []
  const { datasets } = await res.json()
  return datasets || []
}
