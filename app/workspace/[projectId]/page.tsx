'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { Layout } from '@/components/Layout'
import { ChatBox } from '@/components/ChatBox'
import { CodeEditor } from '@/components/CodeEditor'
import { PlotViewer } from '@/components/PlotViewer'
import { TerminalView } from '@/components/TerminalView'
import { UploadPanel } from '@/components/UploadPanel'
import { VersionHistory } from '@/components/VersionHistory'
import { DataPreview } from '@/components/DataPreview'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useSessionStore } from '@/store/useSessionStore'
import { Send, Play, Code2, BarChart3, ArrowLeft, Maximize2, Minimize2 } from 'lucide-react'
import Link from 'next/link'
import { supabase } from '@/lib/supabaseClient'

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  code?: string
  plot_url?: string
  created_at: string
}

export default function WorkspacePage() {
  const router = useRouter()
  const params = useParams()
  const projectId = params.projectId as string
  
  const { user, setUser } = useSessionStore()
  const [prompt, setPrompt] = useState('')
  const [loading, setLoading] = useState(false)
  const [project, setProject] = useState<any>(null)
  const [loadingProject, setLoadingProject] = useState(true)
  type DatasetItem = { id: string, fileName: string, sizeBytes: number, persisted: boolean, includeChat: boolean, includeRun: boolean, csvText?: string }
  const [datasets, setDatasets] = useState<DatasetItem[]>([])
  const [privacyMode, setPrivacyMode] = useState<boolean>(true) // Default to randomized data for privacy
  const [airiaMode, setAiriaMode] = useState<'legacy' | 'quick'>('legacy')
  const [stdoutText, setStdoutText] = useState<string>('')
  const [stderrText, setStderrText] = useState<string>('')
  const [showTerminalNextToPlot, setShowTerminalNextToPlot] = useState<boolean>(false)
  const [editorFocusMode, setEditorFocusMode] = useState<boolean>(false)
  const hasLoadedRef = useRef(false)
  const [showDatasetsPanel, setShowDatasetsPanel] = useState<boolean>(false)
  const [galleryPlots, setGalleryPlots] = useState<string[]>([])

  const loadProject = useCallback(async () => {
    if (!projectId || hasLoadedRef.current) return
    
    try {
      console.log('🚀 Loading project:', projectId)
      setLoadingProject(true)
      hasLoadedRef.current = true
      
      // Load project data
      const controller = new AbortController()
      const timeoutId = setTimeout(() => {
        console.log('⏰ Request timeout, aborting...')
        controller.abort()
      }, 10000) // 10 second timeout
      
      const response = await fetch(`/api/projects/${projectId}`, {
        signal: controller.signal
      })
      
      clearTimeout(timeoutId)
      
      if (!response.ok) {
        if (response.status === 404) {
          console.warn('❌ Project not found')
          router.push('/dashboard')
          return
        }
        throw new Error(`HTTP ${response.status}`)
      }
      
      const data = await response.json()
      
      if (data.project) {
        console.log('✅ Project loaded successfully:', data.project.name)
        // Ensure messages array exists
        const projectWithMessages = {
          ...data.project,
          messages: data.project.messages || []
        }
        setProject(projectWithMessages)
      } else {
        console.warn('❌ No project data received')
        router.push('/dashboard')
      }
    } catch (error: any) {
      if (error.name === 'AbortError') {
        console.error('💥 Request was aborted due to timeout')
      } else {
        console.error('💥 Failed to load project:', error)
      }
      router.push('/dashboard')
    } finally {
      setLoadingProject(false)
    }
  }, [projectId, router])

  // Handle authentication state changes
  useEffect(() => {
    let mounted = true
    
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!mounted) return
      
      if (!session && !user) {
        console.log('❌ No auth, redirecting to login')
        router.push('/login')
        return
      }
      
      if (session && !user) {
        console.log('✅ Setting user from session')
        setUser(session.user)
      }
    }
    
    checkAuth()
    
    return () => {
      mounted = false
    }
  }, [user, setUser, router])

  // Reset loading state when projectId changes
  useEffect(() => {
    hasLoadedRef.current = false
    setLoadingProject(true)
    setProject(null)
  }, [projectId])

  // Load project when projectId changes (only once per projectId)
  useEffect(() => {
    if (projectId && !hasLoadedRef.current) {
      loadProject()
    }
  }, [projectId, loadProject])

  const handleSendMessage = async () => {
    if (!prompt.trim() || !project) return

    setLoading(true)
    
    // Add user message
    await fetch(`/api/projects/${projectId}/messages`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ role: 'user', content: prompt }),
    })

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
          prompt,
          existingCode: project.code,
          userId: user?.id || user?.email || 'anonymous',
          privacyMode,
          mode: airiaMode,
          csvFilesForChat: datasets
            .filter(d => d.includeChat && d.csvText) // only ephemeral have csvText locally
            .map(d => ({ fileName: d.fileName, csvData: d.csvText! }))
        }),
      })

      const data = await response.json()
      
      if (data.code) {
        // Update code in database
        await fetch(`/api/projects/${projectId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ code: data.code }),
        })
        
        // Update local state immediately for better UX
        setProject((prev: any) => ({
          ...prev,
          code: data.code
        }))

        // Auto-save version when new code is generated
        try {
          await fetch(`/api/projects/${projectId}/versions`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              code: data.code,
              plot_url: project.plot_url,
              description: `Auto-saved: ${prompt.substring(0, 50)}${prompt.length > 50 ? '...' : ''}`
            })
          })
        } catch (error) {
          console.error('Failed to auto-save version:', error)
        }
      }

      // Add assistant message
      const newMessage = {
        id: Math.random().toString(36).substring(7),
        role: 'assistant',
        content: data.message || 'Here\'s the R code for your request:',
        code: data.code,
        created_at: new Date().toISOString()
      }
      
      await fetch(`/api/projects/${projectId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          role: 'assistant',
          content: newMessage.content,
          code: data.code,
        }),
      })
      
      // Update messages locally
      setProject((prev: any) => ({
        ...prev,
        messages: [...prev.messages, newMessage]
      }))
    } catch (error) {
      console.error('Chat error:', error)
    } finally {
      setLoading(false)
      setPrompt('')
    }
  }

  const handleRunCode = async () => {
    if (!project) {
      console.error('No project loaded')
      return
    }
    
    console.log('🚀 Running R code...')
    console.log('Code:', project.code.substring(0, 100))
    console.log('Selected for run:', datasets.filter(d => d.includeRun).length)
    
    setLoading(true)

    try {
      console.log('Sending request to /api/execute proxy...')
      
      // Prepare CSV data array for execution (originals)
      const runFiles = datasets.filter(d => d.includeRun && d.csvText)
      const csv_files = runFiles.map(d => ({ filename: d.fileName, data_base64: btoa(d.csvText!) }))
      // Backward compatibility: also send the first CSV as single fields expected by backend
      const primary = runFiles[0]
      const csv_base64 = primary ? btoa(primary.csvText!) : undefined
      const file_name = primary ? primary.fileName : undefined
      
      const response = await fetch("/api/execute", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ 
          code: project.code, 
          csv_files,
          csv_base64,
          file_name,
        }),
      })

      console.log('Response status:', response.status)
      
      const data = await response.json()
      console.log('Full response data:', JSON.stringify(data, null, 2))
      console.log('Response keys:', Object.keys(data))
      console.log('Success status:', data.success)
      console.log('Plot data present:', !!(data.plot_base64 || data.plot || data.image || data.plot_data || data.result))
      
      // Capture terminal output if available
      try {
        if (typeof data?.stdout === 'string') setStdoutText(data.stdout)
        if (typeof data?.stderr === 'string') setStderrText(data.stderr)
      } catch {}

      if (!response.ok) {
        console.error('Execute error:', data)
        const errorMessage = data.error || 'Failed to execute code'
        
        // Show detailed error information
        let fullErrorMessage = `Error: ${errorMessage}`
        
        // Special handling for service not deployed
        if (response.status === 503) {
          fullErrorMessage += `\n\n🔧 The R execution service is not responding properly. Please check the Hugging Face service status.`
        }
        
        alert(fullErrorMessage)
        return
      }
      
      // Handle response payloads: multiple or single plot(s)
      let urls: string[] = []
      if (Array.isArray(data.plot_base64)) {
        urls = data.plot_base64
          .map((p: any) => (p && (p.data || p)))
          .filter(Boolean)
          .map((b64: string) => `data:image/png;base64,${b64}`)
      } else {
        const plotData =
          data.plot_base64 ||
          data.image_base64 ||
          data.plot ||
          data.image ||
          data.plot_data ||
          data.result
        if (plotData) {
          urls = [`data:image/png;base64,${plotData}`]
        }
      }

      if (urls.length > 0) {
        setGalleryPlots(urls)

        // Persist the first image URL for version/history continuity
        const firstUrl = urls[0]
        await fetch(`/api/projects/${projectId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ plot_url: firstUrl }),
        })

        setProject((prev: any) => ({
          ...prev,
          plot_url: firstUrl
        }))

        try {
          await fetch(`/api/projects/${projectId}/versions`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              code: project.code,
              plot_url: firstUrl,
              description: `Plot generated: ${new Date().toLocaleString()}`
            })
          })
        } catch (error) {
          console.error('Failed to auto-save version with plot:', error)
        }

        console.log(`✅ Plot updated successfully (${urls.length} image(s))`)
      } else {
        console.warn('No plot data found in response')
        console.log('Available fields:', Object.keys(data))
        if (data.message) {
          console.log('Response message:', data.message)
        }
      }
    } catch (error: any) {
      console.error('Execution error:', error)
      setStderrText(prev => `${prev}\n${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  const handleCodeChange = async (newCode: string) => {
    if (project) {
      setProject({ ...project, code: newCode })
      // Debounce the API call - don't await to prevent blocking
      fetch(`/api/projects/${projectId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: newCode }),
      }).catch(error => {
        console.error('Failed to save code:', error)
      })
    }
  }

  const handleVersionRestore = (code: string, plotUrl?: string) => {
    if (project) {
      setProject({ 
        ...project, 
        code: code,
        plot_url: plotUrl || project.plot_url
      })
      
      // Update the database - don't await to prevent blocking
      fetch(`/api/projects/${projectId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          code: code,
          plot_url: plotUrl || project.plot_url
        }),
      }).catch(error => {
        console.error('Failed to restore version:', error)
      })
    }
  }

  const handleSaveVersion = async (code: string, plotUrl?: string, description?: string) => {
    try {
      const response = await fetch(`/api/projects/${projectId}/versions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: code,
          plot_url: plotUrl,
          description: description || `Version ${new Date().toLocaleString()}`
        })
      })

      const data = await response.json()
      if (data.version) {
        console.log('Version saved successfully:', data.version.version_number)
      }
    } catch (error) {
      console.error('Failed to save version:', error)
    }
  }

  // Show loading screen while project is loading
  if (loadingProject) {
    return (
      <Layout>
        <div className="h-[calc(100vh-80px)] flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-rstudio mx-auto mb-4"></div>
            <p className="text-gray-600 dark:text-gray-400">Loading project...</p>
          </div>
        </div>
      </Layout>
    )
  }

  // If no project after loading, redirect to dashboard
  if (!project) {
    return (
      <Layout>
        <div className="h-[calc(100vh-80px)] flex items-center justify-center">
          <div className="text-center">
            <p className="text-gray-600 dark:text-gray-400 mb-4">Project not found</p>
            <Link href="/dashboard">
              <Button>Back to Dashboard</Button>
            </Link>
          </div>
        </div>
      </Layout>
    )
  }

  return (
    <Layout>
      <div className="h-[calc(100vh-80px)] flex flex-col bg-gradient-to-br from-gray-50 to-blue-50/30 dark:from-gray-900 dark:to-purple-950/30">
        {/* Project Header */}
        <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-b px-4 py-2 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Link href="/dashboard">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="text-lg font-semibold text-darktext dark:text-white">
                  {project.name}
                </h1>
                {datasets.length > 0 && (
                  <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                    privacyMode 
                      ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' 
                      : 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400'
                  }`}>
                    {privacyMode ? '🔒 Chat uses randomized data' : '⚠️ Chat uses originals'}
                  </div>
                )}
              </div>
              {project.description && (
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {project.description}
                </p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            {/* Datasets dropdown trigger */}
            <Button size="sm" variant="outline" onClick={() => setShowDatasetsPanel(v => !v)} className="h-8 px-3">
              Datasets ({datasets.length})
            </Button>
            {/* Compact AI mode pills */}
            <div className="flex gap-1 text-xs">
              <button
                className={`px-2 py-1 rounded border ${airiaMode === 'legacy' ? 'bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 font-medium' : 'bg-transparent border-transparent opacity-70'}`}
                onClick={() => setAiriaMode('legacy')}
              >
                Legacy
              </button>
              <button
                className={`px-2 py-1 rounded border ${airiaMode === 'quick' ? 'bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 font-medium' : 'bg-transparent border-transparent opacity-70'}`}
                onClick={() => setAiriaMode('quick')}
              >
                Quick
              </button>
            </div>
          </div>
        </div>

        {/* Datasets dropdown panel */}
        {showDatasetsPanel && (
          <div className="px-4 pt-2">
            <div className="border rounded-lg bg-white dark:bg-gray-800 shadow-md">
              <UploadPanel 
                privacyMode={privacyMode}
                datasets={datasets}
                onDatasetsChange={(list) => setDatasets(list)}
              />
            </div>
          </div>
        )}

        {/* Main Workspace */}
        <div className="flex-1 flex overflow-hidden">
        {/* Left Pane - Chat & Code */}
        <div className="w-1/2 border-r border-gray-200 dark:border-gray-700 flex flex-col shadow-xl min-w-0">
          {!editorFocusMode && (
            <>
              {/* Chat Section */}
              <div className="flex-1 flex flex-col overflow-hidden">
                <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-800">
                  {project.messages.length === 0 ? (
                    <div className="flex items-center justify-center h-full text-muted-foreground">
                      <div className="text-center animate-fade-in-up">
                        <div className="mb-4 text-6xl animate-float">💬</div>
                        <p className="text-lg">Start a conversation by typing a question below</p>
                        <p className="text-sm mt-2 opacity-70">Try: &quot;Create a scatter plot of my data&quot;</p>
                      </div>
                    </div>
                  ) : (
                    project.messages.map((message: Message, index: number) => (
                      <div
                        key={message.id}
                        className={`flex ${
                          message.role === 'user' ? 'justify-end' : 'justify-start'
                        } animate-fade-in-up`}
                        style={{ animationDelay: `${index * 0.1}s` }}
                      >
                        <div
                          className={`max-w-[70%] rounded-xl px-4 py-3 shadow ${
                            message.role === 'user'
                              ? 'bg-gradient-to-r from-rstudio to-blue-600 text-white'
                              : 'bg-white dark:bg-gray-700 text-darktext dark:text-white border border-gray-200 dark:border-gray-600'
                          }`}
                        >
                          <p className="text-sm leading-relaxed break-words">{message.content}</p>
                          {message.code && (
                            <pre className="mt-2 p-3 bg-black/10 dark:bg-black/30 rounded-lg text-xs overflow-x-auto border border-white/20">
                              <code>{message.code}</code>
                            </pre>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
                {/* Privacy Toggle - Compact */}
                {datasets.length > 0 && (
                  <div className="px-4 py-2 bg-blue-50/30 dark:bg-blue-950/10 border-t border-blue-200/30 dark:border-blue-800/30">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <div className={`w-2 h-2 rounded-full ${privacyMode ? 'bg-green-500' : 'bg-orange-500'}`}></div>
                        <span className="text-xs font-medium text-gray-600 dark:text-gray-400">
                          {privacyMode ? '🔒 Privacy ON' : '⚠️ Privacy OFF'}
                        </span>
                      </div>
                      <label className="flex items-center space-x-1 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={privacyMode}
                          onChange={(e) => setPrivacyMode(e.target.checked)}
                          className="w-3 h-3 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-1 dark:bg-gray-700 dark:border-gray-600"
                        />
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          Randomize
                        </span>
                      </label>
                    </div>
                  </div>
                )}
                {/* AI Mode now in header; removed here to save space */}
                {/* Prompt Input */}
                <div className="p-4 border-t bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm">
                  <div className="flex space-x-2">
                    <Input
                      placeholder="Ask me anything about your data... (e.g., 'make a regression plot')"
                      value={prompt}
                      onChange={(e) => setPrompt(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                      disabled={loading}
                      className="border-2 border-rstudio/20 focus:border-rstudio shadow-sm text-darktext dark:text-white bg-white dark:bg-gray-800"
                    />
                    <Button onClick={handleSendMessage} disabled={loading} className="shadow-lg">
                      <Send className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* Code Editor Section */}
          <div className={`${editorFocusMode ? 'flex-1' : 'h-1/3'} border-t border-gray-200 dark:border-gray-700 flex flex-col bg-white dark:bg-gray-800 shadow-inner min-h-0`}>
            <div className="p-3 bg-gradient-to-r from-gray-100 to-gray-50 dark:from-gray-800 dark:to-gray-900 border-b flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <span className="text-sm font-semibold text-darktext dark:text-white flex items-center">
                  <Code2 className="h-4 w-4 mr-2 text-rstudio" />
                  R Code Editor
                </span>
                <VersionHistory
                  projectId={projectId}
                  currentCode={project.code}
                  currentPlotUrl={project.plot_url}
                  onVersionRestore={handleVersionRestore}
                  onSaveVersion={handleSaveVersion}
                />
              </div>
              <div className="flex items-center gap-2">
                <Button onClick={() => setEditorFocusMode(!editorFocusMode)} size="sm" variant="outline" className="shadow-none">
                  {editorFocusMode ? (
                    <>
                      <Minimize2 className="h-4 w-4 mr-2" />
                      Collapse
                    </>
                  ) : (
                    <>
                      <Maximize2 className="h-4 w-4 mr-2" />
                      Expand
                    </>
                  )}
                </Button>
                <Button onClick={handleRunCode} size="sm" disabled={loading} className="shadow-md">
                  <Play className="h-4 w-4 mr-2" />
                  Run
                </Button>
              </div>
            </div>
            <div className="flex-1 min-h-0">
              <CodeEditor value={project.code} onChange={handleCodeChange} />
            </div>
          </div>
        </div>

          {/* Right Pane - Plot / Terminal - Scrollable */}
          <div className="w-1/2 bg-white dark:bg-gray-900 shadow-xl flex flex-col overflow-y-auto min-w-0">
            {/* Plot Display Section - Scrollable content */}
            <div className="flex-1 flex flex-col min-h-0">
              <div className="p-2 bg-gradient-to-r from-gray-100 to-blue-50 dark:from-gray-800 dark:to-blue-950 border-b flex items-center justify-between flex-shrink-0">
                <span className="text-sm font-semibold text-darktext dark:text-white flex items-center">
                  <BarChart3 className="h-4 w-4 mr-2 text-rstudio" />
                  View
                </span>
                <div className="flex items-center gap-2 text-xs">
                  <button
                    className={`px-2 py-1 rounded border ${!showTerminalNextToPlot ? 'bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600' : 'bg-transparent border-transparent opacity-60'}`}
                    onClick={() => setShowTerminalNextToPlot(false)}
                  >
                    Plot only
                  </button>
                  <button
                    className={`px-2 py-1 rounded border ${showTerminalNextToPlot ? 'bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600' : 'bg-transparent border-transparent opacity-60'}`}
                    onClick={() => setShowTerminalNextToPlot(true)}
                  >
                    Plot + Terminal
                  </button>
                </div>
              </div>
              <div className="flex-1 min-h-[400px] overflow-auto">
                {showTerminalNextToPlot ? (
                  <div className="h-full w-full flex gap-2 p-2">
                    <div className="w-1/2 min-w-0">
                      <TerminalView stdout={stdoutText} stderr={stderrText} />
                    </div>
                    <div className="w-1/2 min-w-0">
                      <PlotViewer 
                        plotUrl={project.plot_url || null}
                        plotUrls={galleryPlots}
                        projectName={project.name} 
                        hasCsvData={datasets.length > 0}
                      />
                    </div>
                  </div>
                ) : (
                  <div className="h-full w-full">
                    <PlotViewer 
                      plotUrl={project.plot_url || null}
                      plotUrls={galleryPlots}
                      projectName={project.name} 
                      hasCsvData={datasets.length > 0}
                    />
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  )
}

