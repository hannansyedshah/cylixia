'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useSessionStore } from '@/lib/stores/sessionStore'
import { supabase } from '@/lib/supabase/client'
import { encodeBase64 } from '@/utils/base64'
import { getProject, updateCode, saveContext, saveOutput } from '@/lib/db/projects'
import { getMessages, createMessage } from '@/lib/db/messages'
import { getDatasets, getDatasetContent } from '@/lib/db/csvUpload'
import { deletePlot } from '@/lib/db/plots'
import { updateProject } from '@/lib/db/projects'
import { saveVersion } from '@/lib/db/versions'
import { sendChat } from '@/actions/chat'
import { executeCode } from '@/actions/execute'
import { useElapsedTimer } from '@/hooks/workspace/useElapsedTimer'
import { useRealtimeMessages } from '@/hooks/workspace/useRealtimeMessages'
import type { Message } from '@/types/database'
import type { DatasetItem } from '@/types/dataset'
import type { OpenAIMode } from '@/types/openai'

export function useWorkspace(projectId: string) {
  const router = useRouter()
  const { user, setUser } = useSessionStore()

  // Project state
  const [project, setProject] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [loadingProject, setLoadingProject] = useState(true)

  // UI state
  const [mode, setMode] = useState<OpenAIMode>('generate')
  const [showDatasetsPanel, setShowDatasetsPanel] = useState(false)
  const [privacyMode, setPrivacyMode] = useState(true)
  const [focusMode, setFocusMode] = useState(false)

  // Output state
  const [stdoutText, setStdoutText] = useState('')
  const [stderrText, setStderrText] = useState('')
  const [galleryPlots, setGalleryPlots] = useState<string[]>([])

  // Datasets
  const [datasets, setDatasets] = useState<DatasetItem[]>([])

  // NIST/Context
  const [contextWindow, setContextWindow] = useState<string | null>(null)
  const [showContextModal, setShowContextModal] = useState(false)
  const [showNistModal, setShowNistModal] = useState(false)
  const [pendingPrompt, setPendingPrompt] = useState('')

  // Refs
  const hasLoadedRef = useRef(false)

  // Hooks
  const elapsedSeconds = useElapsedTimer(loading)
  const estimatedSeconds = mode === 'ask' ? 60 : 40

  // Real-time messages handler
  const handleNewMessage = useCallback((newMsg: Message) => {
    setProject((prev: any) => {
      if (!prev || prev.messages?.some((m: Message) => m.id === newMsg.id)) return prev
      return { ...prev, messages: [...(prev.messages || []), newMsg] }
    })
  }, [])

  useRealtimeMessages({ projectId, onNewMessage: handleNewMessage })

  // Auth check
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) router.push('/login')
      else if (!user) setUser(session.user)
    })
  }, [user, setUser, router])

  // Escape key to exit focus mode
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && focusMode) {
        setFocusMode(false)
      }
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [focusMode])

  // Load project
  const loadProject = useCallback(async () => {
    if (!projectId || hasLoadedRef.current) return
    hasLoadedRef.current = true
    setLoadingProject(true)

    try {
      const p = await getProject(projectId)
      if (!p) {
        router.push('/dashboard')
        return
      }

      setProject({ ...p, messages: p.messages || [] })
      if (p.context_window) setContextWindow(p.context_window)
      if (p.stdout) setStdoutText(p.stdout)
      if (p.stderr) setStderrText(p.stderr)

      if (p.hipaa_compliant && !localStorage.getItem(`nist-acknowledged-${p.name}`)) {
        setShowNistModal(true)
      }

      const messages = await getMessages(projectId)
      setProject((prev: any) => prev ? { ...prev, messages } : prev)

      // Load persisted datasets with content
      const savedDatasets = await getDatasets(projectId)
      if (savedDatasets.length > 0) {
        const datasetItems: DatasetItem[] = await Promise.all(
          savedDatasets.map(async (d) => {
            const csvText = await getDatasetContent(d.id)
            return {
              id: d.id,
              fileName: d.file_name,
              sizeBytes: csvText?.length || 0,
              persisted: true,
              includeChat: true,
              includeRun: true,
              csvText: csvText || undefined
            }
          })
        )
        setDatasets(datasetItems)
      }
    } catch (e) {
      console.error('Failed to load project:', e)
    } finally {
      setLoadingProject(false)
    }
  }, [projectId, router])

  useEffect(() => {
    if (projectId && !hasLoadedRef.current) loadProject()
  }, [projectId, loadProject])

  // Handlers
  const handleCodeChange = useCallback((newCode: string) => {
    setProject((prev: any) => {
      if (!prev) return prev
      return { ...prev, code: newCode, updated_at: new Date().toISOString() }
    })
    updateCode(projectId, newCode).catch(console.error)
  }, [projectId])

  const handleSendMessage = async (prompt: string) => {
    if (!project || loading) return

    if (project.hipaa_compliant && !contextWindow) {
      setPendingPrompt(prompt)
      setShowContextModal(true)
      return
    }

    setLoading(true)
    try {
      const userMessage = await createMessage(projectId, { role: 'user', content: prompt })
      if (userMessage) {
        setProject((prev: any) => prev ? {
          ...prev,
          messages: [...(prev.messages || []), userMessage]
        } : prev)
      }

      const csvFiles = datasets
        .filter(d => d.csvText)
        .map(d => ({ fileName: d.fileName, csvData: d.csvText! }))

      const data = await sendChat({
        prompt,
        mode: mode,
        existingCode: project.code,
        csvFiles,
        privacyMode,
        contextWindow: project.hipaa_compliant ? contextWindow || undefined : undefined,
        isNistProject: project.hipaa_compliant
      })

      if (mode !== 'ask' && data.code) {
        handleCodeChange(data.code)
      }

      const assistantMessage = await createMessage(projectId, {
        role: 'assistant',
        content: data.message || data.explanation || 'Generated code.',
        code: data.code
      })
      if (assistantMessage) {
        setProject((prev: any) => prev ? {
          ...prev,
          messages: [...(prev.messages || []), assistantMessage]
        } : prev)
      }
    } catch (e) {
      console.error('Chat error:', e)
    } finally {
      setLoading(false)
    }
  }

  const handleRunCode = async () => {
    if (!project || loading) return
    setLoading(true)

    try {
      const csvFiles = datasets
        .filter(d => d.csvText)
        .map(d => ({ filename: d.fileName, data_base64: encodeBase64(d.csvText!) }))

      const data = await executeCode({ code: project.code, csv_files: csvFiles, projectId })

      setStdoutText(data.stdout || '')
      setStderrText(data.stderr || '')

      const plots = data.plot_urls || []

      if (plots.length) {
        setGalleryPlots(plots)
        const plotUrl = plots.length > 1 ? JSON.stringify(plots) : plots[0]
        setProject((p: any) => p ? { ...p, plot_url: plotUrl } : p)
      }

      await saveOutput(projectId, data.stdout || '', data.stderr || '')
    } catch (e) {
      console.error('Run error:', e)
      setStderrText('Execution failed')
    } finally {
      setLoading(false)
    }
  }

  const handleVersionRestore = (code: string, plotUrl?: string) => {
    setProject((p: any) => p ? { ...p, code, plot_url: plotUrl || null } : p)
    if (plotUrl) setGalleryPlots([plotUrl])
  }

  const handleDeletePlot = async (index: number) => {
    if (!project || galleryPlots.length === 0) return

    const plotUrl = galleryPlots[index]
    if (!plotUrl) return

    try {
      // Delete from storage (only for storage URLs, not data URLs)
      if (!plotUrl.startsWith('data:')) {
        await deletePlot(plotUrl)
      }

      // Update gallery state
      const newPlots = galleryPlots.filter((_, i) => i !== index)
      setGalleryPlots(newPlots)

      // Update project plot_url
      const newPlotUrl = newPlots.length > 1
        ? JSON.stringify(newPlots)
        : newPlots.length === 1
          ? newPlots[0]
          : null

      setProject((p: any) => p ? { ...p, plot_url: newPlotUrl } : p)
      await updateProject(projectId, { plot_url: newPlotUrl })
    } catch (error) {
      console.error('Failed to delete plot:', error)
    }
  }

  const handleSaveVersion = async (description: string) => {
    await saveVersion(projectId, { code: project.code, plot_url: project.plot_url, description })
  }

  const handleContextSave = async (context: string) => {
    setContextWindow(context)
    await saveContext(projectId, context)
    setShowContextModal(false)
    if (pendingPrompt) {
      handleSendMessage(pendingPrompt)
      setPendingPrompt('')
    }
  }

  const handleNistAcknowledge = () => {
    localStorage.setItem(`nist-acknowledged-${project.name}`, 'true')
    setShowNistModal(false)
  }

  const handleCloseContextModal = () => {
    setShowContextModal(false)
    setPendingPrompt('')
  }

  const datasetsNeedReupload = datasets.filter(d => d.persisted && !d.csvText).length

  return {
    // Auth
    user,

    // Project state
    project,
    loading,
    loadingProject,

    // UI state
    mode,
    setMode,
    showDatasetsPanel,
    setShowDatasetsPanel,
    privacyMode,
    setPrivacyMode,
    focusMode,
    setFocusMode,

    // Output state
    stdoutText,
    stderrText,
    galleryPlots,

    // Datasets
    datasets,
    setDatasets,
    datasetsNeedReupload,

    // Context/NIST
    contextWindow,
    showContextModal,
    setShowContextModal,
    showNistModal,

    // Timer
    elapsedSeconds,
    estimatedSeconds,

    // Handlers
    handleCodeChange,
    handleSendMessage,
    handleRunCode,
    handleVersionRestore,
    handleSaveVersion,
    handleDeletePlot,
    handleContextSave,
    handleNistAcknowledge,
    handleCloseContextModal
  }
}
