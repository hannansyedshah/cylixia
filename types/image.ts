export type AllowedMimeType = 'image/png' | 'image/jpeg' | 'image/gif' | 'image/webp'

export type AttachedImage = {
  fileName: string
  base64Data: string
  mimeType: AllowedMimeType
}

export type ValidationResult = {
  valid: boolean
  error?: string
}
