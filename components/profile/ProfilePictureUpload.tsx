'use client'

import { useState, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Upload, X, Loader2 } from 'lucide-react'

interface ProfilePictureUploadProps {
  currentAvatarUrl?: string | null
  onUpload: (file: File) => Promise<string>
  onRemove?: () => Promise<void>
}

export function ProfilePictureUpload({ currentAvatarUrl, onUpload, onRemove }: ProfilePictureUploadProps) {
  const [uploading, setUploading] = useState(false)
  const [preview, setPreview] = useState<string | null>(currentAvatarUrl || null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file')
      return
    }

    // Validate file size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('File size must be less than 5MB')
      return
    }

    // Create preview
    const reader = new FileReader()
    reader.onloadend = () => {
      setPreview(reader.result as string)
    }
    reader.readAsDataURL(file)

    // Upload file
    setUploading(true)
    try {
      const url = await onUpload(file)
      setPreview(url)
    } catch (error: any) {
      alert(error.message || 'Failed to upload image')
      setPreview(currentAvatarUrl || null)
    } finally {
      setUploading(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  const handleRemove = async () => {
    if (!onRemove) return
    
    setUploading(true)
    try {
      await onRemove()
      setPreview(null)
    } catch (error: any) {
      alert(error.message || 'Failed to remove image')
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="flex flex-col items-center space-y-4">
      <div className="relative">
        {preview ? (
          <img
            src={preview}
            alt="Profile"
            className="w-32 h-32 rounded-full object-cover border-4 border-rstudio/20"
          />
        ) : (
          <div className="w-32 h-32 rounded-full bg-rstudio/20 flex items-center justify-center border-4 border-rstudio/20">
            <Upload className="w-12 h-12 text-rstudio/50" />
          </div>
        )}
        {uploading && (
          <div className="absolute inset-0 rounded-full bg-black/50 flex items-center justify-center">
            <Loader2 className="w-8 h-8 text-white animate-spin" />
          </div>
        )}
      </div>
      <div className="flex items-center space-x-2">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileSelect}
          className="hidden"
          id="avatar-upload"
          disabled={uploading}
        />
        <label htmlFor="avatar-upload" className="cursor-pointer">
          <Button
            type="button"
            variant="outline"
            disabled={uploading}
            className="cursor-pointer"
            onClick={() => fileInputRef.current?.click()}
          >
            <Upload className="w-4 h-4 mr-2" />
            {preview ? 'Change' : 'Upload'} Photo
          </Button>
        </label>
        {preview && onRemove && (
          <Button
            type="button"
            variant="outline"
            onClick={handleRemove}
            disabled={uploading}
            className="text-destructive hover:text-destructive"
          >
            <X className="w-4 h-4 mr-2" />
            Remove
          </Button>
        )}
      </div>
    </div>
  )
}

