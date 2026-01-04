export function parsePlotUrls(plotUrl?: string | null): string[] {
  if (!plotUrl) return []

  try {
    const parsed = JSON.parse(plotUrl)
    if (Array.isArray(parsed)) {
      return parsed
    }
    return [plotUrl]
  } catch {
    return [plotUrl]
  }
}
