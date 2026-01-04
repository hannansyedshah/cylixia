export const PLOTS_BUCKET = 'plots'

export function buildPlotStoragePath(userId: string, projectId: string, plotId: string): string {
  return `${userId}/${projectId}/${plotId}.png`
}

export function extractStoragePathFromUrl(publicUrl: string, bucket: string): string | null {
  try {
    const url = new URL(publicUrl)
    const marker = `/storage/v1/object/public/${bucket}/`
    const idx = url.pathname.indexOf(marker)
    if (idx === -1) return null
    return url.pathname.slice(idx + marker.length)
  } catch {
    return null
  }
}
