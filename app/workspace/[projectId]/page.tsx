'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { Layout } from '@/components/Layout'
import { WorkspaceHeader } from '@/components/workspace/WorkspaceHeader'
import { ChatPanel } from '@/components/workspace/ChatPanel'
import { CodePanel } from '@/components/workspace/CodePanel'
import { OutputPanel } from '@/components/workspace/OutputPanel'
import { UploadPanel } from '@/components/UploadPanel'
import { ContextWindowModal } from '@/components/ContextWindowModal'
import { NistComplianceModal } from '@/components/NistComplianceModal'
import { useSessionStore } from '@/lib/stores/sessionStore'
import { supabase } from '@/lib/supabase/client'
import { encodeBase64 } from '@/utils/base64'
import type { Message, DatasetItem, SharedDataset, AiriaMode } from '@/types'

export default function WorkspacePage() {
  const router = useRouter()
  const { projectId } = useParams() as { projectId: string }
  const { user, setUser } = useSessionStore()

  // Project state
  const [project, setProject] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [loadingProject, setLoadingProject] = useState(true)

  // UI state
  const [airiaMode, setAiriaMode] = useState<AiriaMode>('quick')
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
      const res = await fetch(`/api/projects/${projectId}`)
      if (!res.ok) {
        if (res.status === 404) router.push('/dashboard')
        return
      }
      const { project: p } = await res.json()
      if (!mountedRef.current) return

      setProject({ ...p, messages: p.messages || [] })
      if (p.context_window) setContextWindow(p.context_window)
      if (p.stdout) setStdoutText(p.stdout)
      if (p.stderr) setStderrText(p.stderr)

      // NIST acknowledgement
      if (p.hipaa_compliant && !localStorage.getItem(`nist-acknowledged-${p.name}`)) {
        setShowNistModal(true)
      }

      // Load messages
      const msgRes = await fetch(`/api/projects/${projectId}/messages`)
      if (msgRes.ok) {
        const { messages } = await msgRes.json()
        setProject((prev: any) => prev ? { ...prev, messages } : prev)
      }

      // Load shared datasets
      const dsRes = await fetch(`/api/projects/${projectId}/shared-datasets`)
      if (dsRes.ok) {
        const { datasets: sd } = await dsRes.json()
        setSharedDatasets(sd || [])
      }
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

  // Update estimated time based on mode
  useEffect(() => {
    setEstimatedSeconds(airiaMode === 'legacy' ? 130 : airiaMode === 'ask' ? 60 : 40)
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

  // Cleanup
  useEffect(() => {
    return () => { mountedRef.current = false }
  }, [])

  // Handlers
  const handleCodeChange = useCallback((newCode: string) => {
    if (!project) return
    setProject({ ...project, code: newCode, updated_at: new Date().toISOString() })
    fetch(`/api/projects/${projectId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code: newCode })
    }).catch(console.error)
  }, [project, projectId])

  const handleSendMessage = async (prompt: string) => {
    if (!project || loading) return

    // NIST context check
    if (project.hipaa_compliant && !contextWindow) {
      setPendingPrompt(prompt)
      setShowContextModal(true)
      return
    }

    setLoading(true)
    try {
      // Post user message
      await fetch(`/api/projects/${projectId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: 'user', content: prompt })
      })

      // Prepare CSV data
      const csvFiles = datasets
        .filter(d => d.csvText)
        .map(d => ({ fileName: d.fileName, csvData: d.csvText! }))

      // Call AI
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt,
          mode: airiaMode,
          existingCode: project.code,
          csvFiles,
          privacyMode,
          contextWindow: project.hipaa_compliant ? contextWindow : undefined,
          isNistProject: project.hipaa_compliant
        })
      })

      if (!res.ok) throw new Error('AI request failed')
      const data = await res.json()

      // Update code (unless ask mode)
      if (airiaMode !== 'ask' && data.code) {
        handleCodeChange(data.code)
      }

      // Post assistant message
      await fetch(`/api/projects/${projectId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          role: 'assistant',
          content: data.message || data.explanation || 'Generated code.',
          code: data.code
        })
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

      const res = await fetch('/api/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: project.code, csvFiles })
      })

      const data = await res.json()
      console.log('Execute response:', data)

      setStdoutText(data.stdout || '')
      setStderrText(data.stderr || '')

      // Handle multiple possible plot response formats
      const plots = data.plots || data.plot_urls || (data.plot_url ? [data.plot_url] : [])
      if (plots.length) {
        console.log('Setting plots:', plots)
        setGalleryPlots(plots)
        setProject((p: any) => p ? { ...p, plot_url: plots[0] } : p)
      }

      // Save output to DB
      await fetch(`/api/projects/${projectId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          stdout: data.stdout,
          stderr: data.stderr,
          plot_url: plots[0] || null
        })
      })
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
    await fetch(`/api/projects/${projectId}/versions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code: project.code, plot_url: project.plot_url, description })
    })
  }

  const handleContextSave = async (context: string) => {
    setContextWindow(context)
    await fetch(`/api/projects/${projectId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ context_window: context })
    })
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
          {/* Left: Chat + Code */}
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

          {/* Right: Output */}
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
              const res = await fetch('/api/context/generate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ projectName: name, csvFiles: files })
              })
              const data = await res.json()
              return data.context || ''
            }}
          />
        )}
      </div>
    </Layout>
  )
}
