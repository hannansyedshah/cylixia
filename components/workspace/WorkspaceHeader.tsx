'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Mascot } from '@/components/homepage/Mascot'
import { useSessionStore } from '@/lib/stores/sessionStore'
import { getProfile } from '@/lib/db/profile'
import { ArrowLeft, Shield, Edit3, Database, Users, Code } from 'lucide-react'
import type { OpenAIMode } from '@/types/openai'
import type { Language } from '@/templates/openai/languages'
import { CollaboratorsModal } from '@/components/workspace/CollaboratorsModal'
import { getLanguageConfig, getBadgeClasses } from '@/templates/openai/languages'

interface WorkspaceHeaderProps {
  projectId: string
  projectName: string
  language: Language
  isNist: boolean
  isOwner: boolean
  hasContext: boolean
  hasDatasets: boolean
  privacyMode: boolean
  mode: OpenAIMode
  showDatasetsPanel: boolean
  datasetsCount: number
  datasetsNeedReupload: number
  onModeChange: (mode: OpenAIMode) => void
  onToggleDatasetsPanel: () => void
  onEditContext: () => void
}

export function WorkspaceHeader({
  projectId,
  projectName,
  language,
  isNist,
  isOwner,
  hasContext,
  hasDatasets,
  privacyMode,
  mode,
  showDatasetsPanel,
  datasetsCount,
  datasetsNeedReupload,
  onModeChange,
  onToggleDatasetsPanel,
  onEditContext
}: WorkspaceHeaderProps) {
  const { user } = useSessionStore()
  const [profile, setProfile] = useState<{ display_name: string | null } | null>(null)
  const [now, setNow] = useState<Date>(new Date())
  const [showCollaborators, setShowCollaborators] = useState(false)

  useEffect(() => {
    const loadProfile = async () => {
      if (user?.id) {
        try {
          const profileData = await getProfile()
          setProfile(profileData)
        } catch (error) {
          console.error('Failed to load profile:', error)
        }
      }
    }
    loadProfile()
  }, [user?.id])

  // Live clock
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(id)
  }, [])

  const formattedNow = new Intl.DateTimeFormat(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short'
  }).format(now)

  return (
    <div className="flex-shrink-0">
      {/* Main Floating Toolbar */}
      <div className="px-4 pt-4 pb-2">
        <div className="relative container mx-auto">
          <div className="absolute inset-0 bg-emerald-500/5 rounded-2xl blur-xl" />
          <div className="relative bg-zinc-900/80 backdrop-blur-xl border border-zinc-700/50 rounded-2xl shadow-lg shadow-emerald-900/10 px-6 py-3 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/dashboard">
                <Button variant="ghost" size="sm" className="text-zinc-400 hover:text-white hover:bg-zinc-800">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back
                </Button>
              </Link>
              <div className="h-6 w-px bg-zinc-700" />
              <Link href="/" className="flex items-center w-fit group">
                <Mascot size={32} className="transition-transform group-hover:scale-110" />
              </Link>
              {user && (
                <div className="flex items-center space-x-2 text-xs sm:text-sm text-zinc-500">
                  <span className="truncate max-w-[180px] sm:max-w-[240px]">
                    {profile?.display_name || user.email}
                  </span>
                  <span className="opacity-50">•</span>
                  <span className="whitespace-nowrap">{formattedNow}</span>
                </div>
              )}
            </div>

          </div>
        </div>
      </div>

      {/* Secondary Bar - Project Info & Controls */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-zinc-800 bg-zinc-900/50">
        <div className="flex items-center gap-3">
          <h1 className="text-lg font-semibold text-white truncate max-w-[300px]">{projectName}</h1>
          <span className={`px-2 py-0.5 text-xs font-medium rounded-full flex items-center gap-1 border ${getBadgeClasses(getLanguageConfig(language).badgeColor)}`}>
            <Code className="h-3 w-3" />
            {getLanguageConfig(language).name}
          </span>
          {isNist ? (
            <span className="px-2 py-0.5 text-xs font-medium bg-teal-500/20 text-teal-400 rounded-full flex items-center gap-1 border border-teal-500/30">
              <Shield className="h-3 w-3" /> NIST
            </span>
          ) : (
            <span className="px-2 py-0.5 text-xs font-medium bg-orange-500/20 text-orange-400 rounded-full border border-orange-500/30">
              Standard
            </span>
          )}
          {hasContext && (
            <span className="px-2 py-0.5 text-xs bg-blue-500/20 text-blue-400 rounded-full border border-blue-500/30">Context Set</span>
          )}
          {hasDatasets && (
            <span className={`px-2 py-0.5 text-xs rounded-full border ${privacyMode ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' : 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'}`}>
              {privacyMode ? 'Privacy ON' : 'Privacy OFF'}
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => setShowCollaborators(true)}
            className="h-8 bg-zinc-800 border-zinc-700 text-zinc-300 hover:bg-zinc-700 hover:text-white"
          >
            <Users className="w-3.5 h-3.5 mr-1" />
            Share
          </Button>

          {isNist && (
            <Button
              size="sm"
              variant="outline"
              onClick={onEditContext}
              className="h-8 bg-zinc-800 border-zinc-700 text-zinc-300 hover:bg-zinc-700 hover:text-white"
            >
              <Edit3 className="w-3.5 h-3.5 mr-1" />
              {hasContext ? 'Edit Context' : 'Set Context'}
            </Button>
          )}

          <Button
            size="sm"
            variant="outline"
            onClick={onToggleDatasetsPanel}
            className={`h-8 bg-zinc-800 border-zinc-700 text-zinc-300 hover:bg-zinc-700 hover:text-white ${datasetsNeedReupload > 0 ? 'border-yellow-500/50' : ''}`}
          >
            <Database className="w-3.5 h-3.5 mr-1" />
            Datasets ({datasetsCount})
            {datasetsNeedReupload > 0 && (
              <span className="ml-2 px-1.5 py-0.5 rounded-full text-xs font-semibold bg-yellow-500 text-yellow-900">
                {datasetsNeedReupload}
              </span>
            )}
          </Button>

          <div className="flex gap-1 text-xs ml-2">
            {(['generate', 'ask'] as const).map((m) => (
              <button
                key={m}
                onClick={() => onModeChange(m)}
                className={`px-3 py-1.5 rounded-lg border transition-all ${
                  m === mode
                    ? 'bg-zinc-700 border-zinc-600 text-white font-medium'
                    : 'bg-zinc-800/50 border-zinc-700 text-zinc-400 hover:text-white hover:bg-zinc-700'
                }`}
              >
                {m === 'generate' ? 'Generate' : 'Ask Data'}
              </button>
            ))}
          </div>
        </div>
      </div>

      {showCollaborators && (
        <CollaboratorsModal
          projectId={projectId}
          isOwner={isOwner}
          onClose={() => setShowCollaborators(false)}
        />
      )}
    </div>
  )
}
