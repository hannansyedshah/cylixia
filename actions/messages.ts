'use server'

interface CreateMessageData {
  role: 'user' | 'assistant'
  content: string
  code?: string
}

export async function createMessage(projectId: string, data: CreateMessageData): Promise<void> {
  await fetch(`${process.env.NEXT_PUBLIC_APP_URL || ''}/api/projects/${projectId}/messages`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  })
}
