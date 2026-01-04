import { useState, useEffect, useCallback } from 'react'

interface UsePlotViewerProps {
  plotUrl?: string | null
  plotUrls?: string[]
  projectName?: string
  onDeletePlot?: (index: number) => void
}

export function usePlotViewer({
  plotUrl = null,
  plotUrls,
  projectName = 'plot',
  onDeletePlot
}: UsePlotViewerProps) {
  const [currentIndex, setCurrentIndex] = useState(0)

  const images: string[] = Array.isArray(plotUrls) && plotUrls.length > 0
    ? plotUrls
    : (plotUrl ? [plotUrl] : [])

  const currentUrl = images[currentIndex]
  const hasMultiple = images.length > 1
  const isEmpty = images.length === 0

  useEffect(() => {
    setCurrentIndex(0)
  }, [images.length])

  useEffect(() => {
    if (currentIndex >= images.length && images.length > 0) {
      setCurrentIndex(images.length - 1)
    }
  }, [currentIndex, images.length])

  const goToPrevious = useCallback(() => {
    setCurrentIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1))
  }, [images.length])

  const goToNext = useCallback(() => {
    setCurrentIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1))
  }, [images.length])

  const goToIndex = useCallback((index: number) => {
    setCurrentIndex(index)
  }, [])

  const handleDownload = useCallback(async () => {
    if (!currentUrl) return

    try {
      const response = await fetch(currentUrl)
      const blob = await response.blob()
      const blobUrl = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = blobUrl
      link.download = `plot-${projectName}-${currentIndex + 1}-${new Date().toISOString().split('T')[0]}.png`
      link.click()
      URL.revokeObjectURL(blobUrl)
    } catch {
      window.open(currentUrl, '_blank')
    }
  }, [currentUrl, currentIndex, projectName])

  const handleDelete = useCallback(() => {
    if (!onDeletePlot) return

    if (confirm('Delete this plot? This action cannot be undone.')) {
      onDeletePlot(currentIndex)
    }
  }, [onDeletePlot, currentIndex])

  return {
    images,
    currentIndex,
    currentUrl,
    hasMultiple,
    isEmpty,
    canDelete: !!onDeletePlot,
    goToPrevious,
    goToNext,
    goToIndex,
    handleDownload,
    handleDelete
  }
}
