'use server'

interface SaveVersionData {
  code: string
  plot_url?: string | null
  description: string
}

export async function saveVersion(projectId: string, data: SaveVersionData): Promise<void> {
  await fetch(`${process.env.NEXT_PUBLIC_APP_URL || ''}/api/projects/${projectId}/versions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  })
}
