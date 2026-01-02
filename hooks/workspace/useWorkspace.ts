'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useSessionStore } from '@/lib/stores/sessionStore'
import { supabase } from '@/lib/supabase/client'
import { encodeBase64 } from '@/utils/base64'
import { getProject, updateCode, saveContext, saveOutput } from '@/lib/db/projects'
import { getMessages, createMessage } from '@/lib/db/messages'
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
    if (!project) return
    setProject({ ...project, code: newCode, updated_at: new Date().toISOString() })
    updateCode(projectId, newCode).catch(console.error)
  }, [project, projectId])

  const handleSendMessage = async (prompt: string) => {
    if (!project || loading) return

    if (project.hipaa_compliant && !contextWindow) {
      setPendingPrompt(prompt)
      setShowContextModal(true)
      return
    }

    setLoading(true)
    try {
      await createMessage(projectId, { role: 'user', content: prompt })

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

      await createMessage(projectId, {
        role: 'assistant',
        content: data.message || data.explanation || 'Generated code.',
        code: data.code
      })
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
        .map(d => ({ fileName: d.fileName, csvData: encodeBase64(d.csvText!) }))

      const data = await executeCode({ code: project.code, csvFiles })

      setStdoutText(data.stdout || '')
      setStderrText(data.stderr || '')

      const plots = data.plot_base64?.map(p => `data:image/png;base64,${p.data}`) || []

      if (plots.length) {
        setGalleryPlots(plots)
        setProject((p: any) => p ? { ...p, plot_url: plots[0] } : p)
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
    handleContextSave,
    handleNistAcknowledge,
    handleCloseContextModal
  }
}
