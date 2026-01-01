'use server'

export async function updateProject(projectId: string, data: Record<string, unknown>): Promise<void> {
  await fetch(`${process.env.NEXT_PUBLIC_APP_URL || ''}/api/projects/${projectId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  })
}

export async function updateCode(projectId: string, code: string): Promise<void> {
  await updateProject(projectId, { code })
}

export async function saveContext(projectId: string, context: string): Promise<void> {
  await updateProject(projectId, { context_window: context })
}

export async function saveOutput(projectId: string, stdout: string, stderr: string): Promise<void> {
  await updateProject(projectId, { stdout, stderr })
}
