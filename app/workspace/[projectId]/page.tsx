'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { Layout } from '@/components/Layout'
import { ChatBox } from '@/components/ChatBox'
import { CodeEditor } from '@/components/CodeEditor'
import { PlotViewer } from '@/components/PlotViewer'
import { UploadPanel } from '@/components/UploadPanel'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useSessionStore } from '@/store/useSessionStore'
import { Send, Play, Code2, BarChart3, ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { supabase } from '@/lib/supabaseClient'

export default function WorkspacePage() {
  const router = useRouter()
  const params = useParams()
  const projectId = params.projectId as string
  
  const { user, setUser } = useSessionStore()
  const [prompt, setPrompt] = useState('')
  const [loading, setLoading] = useState(false)
  const [project, setProject] = useState<any>(null)
  const [loadingProject, setLoadingProject] = useState(true)

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session && !user) {
        router.push('/login')
        return
      }
      
      if (session && !user) {
        setUser(session.user)
      }
      
      loadProject()
    }
    
    checkAuth()
  }, [user, projectId, router])

  const loadProject = async () => {
    try {
      const response = await fetch(`/api/projects/${projectId}`)
      const data = await response.json()
      if (data.project) {
        setProject(data.project)
      } else {
        router.push('/dashboard')
      }
    } catch (error) {
      console.error('Failed to load project:', error)
      router.push('/dashboard')
    } finally {
      setLoadingProject(false)
    }
  }

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
        body: JSON.stringify({ prompt }),
      })

      const data = await response.json()
      
      if (data.code) {
        await fetch(`/api/projects/${projectId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ code: data.code }),
        })
      }

      // Add assistant message
      await fetch(`/api/projects/${projectId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          role: 'assistant',
          content: data.message || 'Here\'s the R code for your request:',
          code: data.code,
        }),
      })

      // Reload project to get updated data
      await loadProject()
    } catch (error) {
      console.error('Chat error:', error)
    } finally {
      setLoading(false)
      setPrompt('')
    }
  }

  const handleRunCode = async () => {
    if (!project) return
    
    setLoading(true)

    try {
      const response = await fetch('/api/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: project.code }),
      })

      const data = await response.json()
      
      if (data.plotUrl) {
        await fetch(`/api/projects/${projectId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ plot_url: data.plotUrl }),
        })
        await loadProject()
      }
    } catch (error) {
      console.error('Execution error:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCodeChange = async (newCode: string) => {
    if (project) {
      setProject({ ...project, code: newCode })
      // Debounce the API call
      await fetch(`/api/projects/${projectId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: newCode }),
      })
    }
  }

  if (!user || loadingProject) {
    return (
      <Layout>
        <div className="h-[calc(100vh-80px)] flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-rstudio"></div>
        </div>
      </Layout>
    )
  }

  if (!project) {
    return null
  }

  return (
    <Layout>
      <div className="h-[calc(100vh-80px)] flex flex-col bg-gradient-to-br from-gray-50 to-blue-50/30 dark:from-gray-900 dark:to-purple-950/30">
        {/* Project Header */}
        <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-b px-4 py-3 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Link href="/dashboard">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <div>
              <h1 className="text-lg font-semibold text-darktext dark:text-white">
                {project.name}
              </h1>
              {project.description && (
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {project.description}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Main Workspace */}
        <div className="flex-1 flex overflow-hidden">
          {/* Left Pane */}
          <div className="w-1/2 border-r border-gray-200 dark:border-gray-700 flex flex-col shadow-xl">
            <UploadPanel />
            
            {/* Chat Section */}
            <div className="flex-1 flex flex-col overflow-hidden">
              <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-800">
                {project.messages.length === 0 ? (
                  <div className="flex items-center justify-center h-full text-muted-foreground">
                    <div className="text-center animate-fade-in-up">
                      <div className="mb-4 text-6xl animate-float">💬</div>
                      <p className="text-lg">Start a conversation by typing a question below</p>
                      <p className="text-sm mt-2 opacity-70">Try: "Create a scatter plot of my data"</p>
                    </div>
                  </div>
                ) : (
                  project.messages.map((message, index) => (
                    <div
                      key={message.id}
                      className={`flex ${
                        message.role === 'user' ? 'justify-end' : 'justify-start'
                      } animate-fade-in-up`}
                      style={{ animationDelay: `${index * 0.1}s` }}
                    >
                      <div
                        className={`max-w-[80%] rounded-xl px-4 py-3 shadow-lg transform hover:scale-105 transition-all duration-200 ${
                          message.role === 'user'
                            ? 'bg-gradient-to-r from-rstudio to-blue-600 text-white'
                            : 'bg-white dark:bg-gray-700 text-darktext dark:text-white border border-gray-200 dark:border-gray-600'
                        }`}
                      >
                        <p className="text-sm leading-relaxed">{message.content}</p>
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

            {/* Code Editor Section */}
            <div className="h-1/2 border-t border-gray-200 dark:border-gray-700 flex flex-col bg-white dark:bg-gray-800 shadow-inner">
              <div className="p-3 bg-gradient-to-r from-gray-100 to-gray-50 dark:from-gray-800 dark:to-gray-900 border-b flex items-center justify-between">
                <span className="text-sm font-semibold text-darktext dark:text-white flex items-center">
                  <Code2 className="h-4 w-4 mr-2 text-rstudio" />
                  R Code Editor
                </span>
                <Button onClick={handleRunCode} size="sm" disabled={loading} className="shadow-md">
                  <Play className="h-4 w-4 mr-2" />
                  Run
                </Button>
              </div>
              <div className="flex-1">
                <CodeEditor value={project.code} onChange={handleCodeChange} />
              </div>
            </div>
          </div>

          {/* Right Pane - Plot Viewer */}
          <div className="w-1/2 bg-white dark:bg-gray-900 shadow-xl">
            <div className="p-3 bg-gradient-to-r from-gray-100 to-blue-50 dark:from-gray-800 dark:to-blue-950 border-b">
              <span className="text-sm font-semibold text-darktext dark:text-white flex items-center">
                <BarChart3 className="h-4 w-4 mr-2 text-rstudio" />
                Plot Display
              </span>
            </div>
                <div className="h-[calc(100%-48px)]">
              <PlotViewer plotUrl={project.plot_url || null} />
            </div>
          </div>
        </div>
      </div>
    </Layout>
  )
}

