'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { Layout } from '@/components/layout/Layout'
import { WorkspaceHeader } from '@/components/workspace/WorkspaceHeader'
import { ChatPanel } from '@/components/workspace/ChatPanel'
import { CodePanel } from '@/components/workspace/CodePanel'
import { OutputPanel } from '@/components/workspace/OutputPanel'
import { UploadPanel } from '@/components/data/UploadPanel'
import { ContextWindowModal } from '@/components/workspace/ContextWindowModal'
import { NistComplianceModal } from '@/components/workspace/NistComplianceModal'
import { useSessionStore } from '@/lib/stores/sessionStore'
import { supabase } from '@/lib/supabase/client'
import { encodeBase64 } from '@/utils/base64'
import { getProject, updateCode, saveContext, saveOutput } from '@/lib/db/projects'
import { getMessages, createMessage } from '@/lib/db/messages'
import { getSharedDatasets } from '@/lib/db/datasets'
import { saveVersion } from '@/lib/db/versions'
import { sendChat } from '@/actions/chat'
import { executeCode } from '@/actions/execute'
import { generateContext } from '@/actions/context'
import type { Message } from '@/types/database'
import type { DatasetItem, SharedDataset } from '@/types/dataset'
import type { AiriaMode } from '@/types/api'

export default function WorkspacePage() {
  const router = useRouter()
  const { projectId } = useParams() as { projectId: string }
  const { user, setUser } = useSessionStore()

  // Project state
  const [project, setProject] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [loadingProject, setLoadingProject] = useState(true)

  // UI state
  const [airiaMode, setAiriaMode] = useState<AiriaMode>('generate')
  const [showDatasetsPanel, setShowDatasetsPanel] = useState(false)
  const [privacyMode, setPrivacyMode] = useState(true)

  // Output state
  const [stdoutText, setStdoutText] = useState('')
  const [stderrText, setStderrText] = useState('')
  const [galleryPlots, setGalleryPlots] = useState<string[]>([])

  // Datasets
  const [datasets, setDatasets] = useState<DatasetItem[]>([])
  const [sharedDatasets, setSharedDatasets] = useState<SharedDataset[]>([])

  // NIST/Context
  const [contextWindow, setContextWindow] = useState<string | null>(null)
  const [showContextModal, setShowContextModal] = useState(false)
  const [showNistModal, setShowNistModal] = useState(false)
  const [pendingPrompt, setPendingPrompt] = useState('')

  // Loading indicators
  const [elapsedSeconds, setElapsedSeconds] = useState(0)
  const [estimatedSeconds, setEstimatedSeconds] = useState(40)
  const loadingStartRef = useRef<number | null>(null)

  // Refs
  const hasLoadedRef = useRef(false)
  const mountedRef = useRef(true)

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
      if (!mountedRef.current) return

      setProject({ ...p, messages: p.messages || [] })
      if (p.context_window) setContextWindow(p.context_window)
      if (p.stdout) setStdoutText(p.stdout)
      if (p.stderr) setStderrText(p.stderr)

      if (p.hipaa_compliant && !localStorage.getItem(`nist-acknowledged-${p.name}`)) {
        setShowNistModal(true)
      }

      const [messages, sharedDs] = await Promise.all([
        getMessages(projectId),
        getSharedDatasets(projectId)
      ])

      setProject((prev: any) => prev ? { ...prev, messages } : prev)
      setSharedDatasets(sharedDs)
    } catch (e) {
      console.error('Failed to load project:', e)
    } finally {
      if (mountedRef.current) setLoadingProject(false)
    }
  }, [projectId, router])

  useEffect(() => {
    if (projectId && !hasLoadedRef.current) loadProject()
  }, [projectId, loadProject])

  // Elapsed time tracking
  useEffect(() => {
    if (!loading) {
      loadingStartRef.current = null
      setElapsedSeconds(0)
      return
    }
    loadingStartRef.current = Date.now()
    const interval = setInterval(() => {
      if (loadingStartRef.current) {
        setElapsedSeconds(Math.floor((Date.now() - loadingStartRef.current) / 1000))
      }
    }, 1000)
    return () => clearInterval(interval)
  }, [loading])

  useEffect(() => {
    setEstimatedSeconds(airiaMode === 'ask' ? 60 : 40)
  }, [airiaMode])

  // Real-time messages subscription
  useEffect(() => {
    if (!projectId) return
    const channel = supabase
      .channel(`messages-${projectId}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages', filter: `project_id=eq.${projectId}` },
        (payload) => {
          const newMsg = payload.new as Message
          setProject((prev: any) => {
            if (!prev || prev.messages?.some((m: Message) => m.id === newMsg.id)) return prev
            return { ...prev, messages: [...(prev.messages || []), newMsg] }
          })
        }
      )
      .subscribe()
    return () => { channel.unsubscribe() }
  }, [projectId])

  useEffect(() => {
    return () => { mountedRef.current = false }
  }, [])

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
        mode: airiaMode,
        existingCode: project.code,
        csvFiles,
        privacyMode,
        contextWindow: project.hipaa_compliant ? contextWindow || undefined : undefined,
        isNistProject: project.hipaa_compliant
      })

      if (airiaMode !== 'ask' && data.code) {
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
      if (mountedRef.current) setLoading(false)
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
      if (mountedRef.current) setLoading(false)
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

  const datasetsNeedReupload = datasets.filter(d => d.persisted && !d.csvText).length

  if (!user || loadingProject) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-[calc(100vh-80px)]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
        </div>
      </Layout>
    )
  }

  if (!project) return null

  return (
    <Layout>
      <div className="h-[calc(100vh-80px)] flex flex-col">
        <WorkspaceHeader
          projectName={project.name}
          isNist={project.hipaa_compliant}
          hasContext={!!contextWindow}
          hasDatasets={datasets.length > 0}
          privacyMode={privacyMode}
          airiaMode={airiaMode}
          showDatasetsPanel={showDatasetsPanel}
          datasetsCount={datasets.length}
          datasetsNeedReupload={datasetsNeedReupload}
          onAiriaModeChange={setAiriaMode}
          onToggleDatasetsPanel={() => setShowDatasetsPanel(v => !v)}
          onEditContext={() => setShowContextModal(true)}
        />

        {showDatasetsPanel && (
          <div className="p-4 border-b bg-gray-50 dark:bg-gray-900">
            <UploadPanel
              privacyMode={privacyMode}
              hipaaCompliant={project.hipaa_compliant}
              datasets={datasets}
              sharedDatasets={sharedDatasets}
              onDatasetsChange={setDatasets}
              projectId={projectId}
              currentUserId={user.id}
            />
          </div>
        )}

        <div className="flex-1 flex min-h-0">
          <div className="w-1/2 flex flex-col border-r">
            <div className="flex-1 min-h-0">
              <ChatPanel
                messages={project.messages || []}
                loading={loading}
                elapsedSeconds={elapsedSeconds}
                estimatedSeconds={estimatedSeconds}
                isNist={project.hipaa_compliant}
                hasContext={!!contextWindow}
                hasDatasets={datasets.length > 0}
                privacyMode={privacyMode}
                onPrivacyModeChange={setPrivacyMode}
                onSendMessage={handleSendMessage}
              />
            </div>
            <CodePanel
              code={project.code}
              projectId={projectId}
              plotUrl={project.plot_url}
              loading={loading}
              onChange={handleCodeChange}
              onRun={handleRunCode}
              onVersionRestore={handleVersionRestore}
              onSaveVersion={handleSaveVersion}
            />
          </div>

          <div className="w-1/2">
            <OutputPanel
              plotUrl={project.plot_url}
              galleryPlots={galleryPlots}
              stdout={stdoutText}
              stderr={stderrText}
              projectId={projectId}
            />
          </div>
        </div>

        {showNistModal && (
          <NistComplianceModal
            projectName={project.name}
            onAcknowledge={() => {
              localStorage.setItem(`nist-acknowledged-${project.name}`, 'true')
              setShowNistModal(false)
            }}
          />
        )}

        {showContextModal && (
          <ContextWindowModal
            projectName={project.name}
            csvFiles={datasets.filter(d => d.csvText).map(d => ({ fileName: d.fileName, csvData: d.csvText! }))}
            initialContext={contextWindow}
            onSave={handleContextSave}
            onCancel={() => { setShowContextModal(false); setPendingPrompt('') }}
            onGenerateContext={async (name, files) => {
              return generateContext({ projectName: name, csvFiles: files })
            }}
          />
        )}
      </div>
    </Layout>
  )
}
