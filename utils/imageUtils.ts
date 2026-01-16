import type { AllowedMimeType, AttachedImage, ValidationResult } from '@/types/image'

export const MAX_IMAGE_SIZE = 4 * 1024 * 1024 // 4MB
export const MAX_IMAGE_COUNT = 3
export const ALLOWED_TYPES: AllowedMimeType[] = ['image/png', 'image/jpeg', 'image/gif', 'image/webp']

export function validateImageFile(file: File): ValidationResult {
  if (!ALLOWED_TYPES.includes(file.type as AllowedMimeType)) {
    return {
      valid: false,
      error: `Invalid file type: ${file.type}. Allowed types: PNG, JPEG, GIF, WebP`
    }
  }

  if (file.size > MAX_IMAGE_SIZE) {
    const sizeMB = (file.size / (1024 * 1024)).toFixed(1)
    return {
      valid: false,
      error: `File too large: ${sizeMB}MB. Maximum size is 4MB`
    }
  }

  return { valid: true }
}

export function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      const result = reader.result as string
      const base64 = result.split(',')[1]
      resolve(base64)
    }
    reader.onerror = () => reject(new Error('Failed to read file'))
    reader.readAsDataURL(file)
  })
}

export async function processImageFile(file: File): Promise<AttachedImage | { error: string }> {
  const validation = validateImageFile(file)
  if (!validation.valid) {
    return { error: validation.error! }
  }

  try {
    const base64Data = await fileToBase64(file)
    return {
      fileName: file.name,
      base64Data,
      mimeType: file.type as AllowedMimeType
    }
  } catch {
    return { error: 'Failed to process image file' }
  }
}
