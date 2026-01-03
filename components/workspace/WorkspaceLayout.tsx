'use client'

import { WorkspaceHeader } from './WorkspaceHeader'
import type { OpenAIMode } from '@/types/openai'

interface WorkspaceLayoutProps {
  children: React.ReactNode
  projectName: string
  isNist: boolean
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
  projectName,
  isNist,
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
    <div className="min-h-screen bg-black">
      <WorkspaceHeader
        projectName={projectName}
        isNist={isNist}
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
      <main className="pt-32">{children}</main>
    </div>
  )
}
