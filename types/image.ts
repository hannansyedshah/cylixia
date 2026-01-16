export const ALLOWED_MIME_TYPES = ['image/png', 'image/jpeg', 'image/gif', 'image/webp'] as const

export type AllowedMimeType = (typeof ALLOWED_MIME_TYPES)[number]

export type AttachedImage = {
  fileName: string
  base64Data: string
  mimeType: AllowedMimeType
}

export type ValidationResult = {
  valid: boolean
  error?: string
}
