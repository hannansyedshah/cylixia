'use client'

import { WorkspaceHeader } from './WorkspaceHeader'
import type { OpenAIMode } from '@/types/openai'
import type { Language } from '@/types/database'

interface WorkspaceLayoutProps {
  children: React.ReactNode
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

export function WorkspaceLayout({
  children,
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
}: WorkspaceLayoutProps) {
  return (
    <div className="h-screen flex flex-col bg-black overflow-hidden">
      <WorkspaceHeader
        projectId={projectId}
        projectName={projectName}
        language={language}
        isNist={isNist}
        isOwner={isOwner}
        hasContext={hasContext}
        hasDatasets={hasDatasets}
        privacyMode={privacyMode}
        mode={mode}
        showDatasetsPanel={showDatasetsPanel}
        datasetsCount={datasetsCount}
        datasetsNeedReupload={datasetsNeedReupload}
        onModeChange={onModeChange}
        onToggleDatasetsPanel={onToggleDatasetsPanel}
        onEditContext={onEditContext}
      />
      <main className="flex-1 min-h-0 overflow-hidden">{children}</main>
    </div>
  )
}
