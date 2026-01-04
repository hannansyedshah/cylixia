'use client'

import { useParams } from 'next/navigation'
import { WorkspaceLayout } from '@/components/workspace/WorkspaceLayout'
import { ChatPanel } from '@/components/workspace/ChatPanel'
import { CodePanel } from '@/components/workspace/CodePanel'
import { OutputPanel } from '@/components/workspace/OutputPanel'
import { UploadPanel } from '@/components/data/UploadPanel'
import { ContextWindowModal } from '@/components/workspace/ContextWindowModal'
import { NistComplianceModal } from '@/components/workspace/NistComplianceModal'
import { PageLoading } from '@/components/workspace/LoadingStates'
import { generateContext } from '@/actions/context'
import { useWorkspace } from '@/hooks/workspace/useWorkspace'

export default function WorkspacePage() {
  const { projectId } = useParams() as { projectId: string }
  const {
    user,
    project,
    loading,
    executingCode,
    loadingProject,
    mode,
    setMode,
    showDatasetsPanel,
    setShowDatasetsPanel,
    privacyMode,
    setPrivacyMode,
    focusMode,
    setFocusMode,
    stdoutText,
    stderrText,
    galleryPlots,
    datasets,
    setDatasets,
    datasetsNeedReupload,
    contextWindow,
    showContextModal,
    setShowContextModal,
    showNistModal,
    elapsedSeconds,
    estimatedSeconds,
    handleCodeChange,
    handleSendMessage,
    handleRunCode,
    handleVersionRestore,
    handleSaveVersion,
    handleDeletePlot,
    handleContextSave,
    handleNistAcknowledge,
    handleCloseContextModal
  } = useWorkspace(projectId)

  if (!user || loadingProject) {
    return <PageLoading />
  }

  if (!project) return null

  return (
    <WorkspaceLayout
      projectName={project.name}
      isNist={project.hipaa_compliant}
      hasContext={!!contextWindow}
      hasDatasets={datasets.length > 0}
      privacyMode={privacyMode}
      mode={mode}
      showDatasetsPanel={showDatasetsPanel}
      datasetsCount={datasets.length}
      datasetsNeedReupload={datasetsNeedReupload}
      onModeChange={setMode}
      onToggleDatasetsPanel={() => setShowDatasetsPanel(v => !v)}
      onEditContext={() => setShowContextModal(true)}
    >
      <div className="h-full flex flex-col">
        {showDatasetsPanel && (
          <div className="p-4 border-b border-zinc-800 bg-zinc-900/50">
            <UploadPanel
              projectId={projectId}
              privacyMode={privacyMode}
              hipaaCompliant={project.hipaa_compliant}
              datasets={datasets}
              onDatasetsChange={setDatasets}
            />
          </div>
        )}

        <div className="flex-1 flex min-h-0">
          <div className="w-1/2 flex flex-col border-r border-zinc-800 relative">
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
              loading={loading || executingCode}
              focusMode={focusMode}
              onFocusModeChange={setFocusMode}
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
              projectName={project.name}
              loading={executingCode}
              onDeletePlot={handleDeletePlot}
            />
          </div>
        </div>

        {showNistModal && (
          <NistComplianceModal
            projectName={project.name}
            onAcknowledge={handleNistAcknowledge}
          />
        )}

        {showContextModal && (
          <ContextWindowModal
            projectName={project.name}
            csvFiles={datasets.filter(d => d.csvText).map(d => ({ fileName: d.fileName, csvData: d.csvText! }))}
            initialContext={contextWindow}
            onSave={handleContextSave}
            onCancel={handleCloseContextModal}
            onGenerateContext={async (name, files) => {
              return generateContext({ projectName: name, csvFiles: files })
            }}
          />
        )}
      </div>
    </WorkspaceLayout>
  )
}
