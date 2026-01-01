'use client'

interface TerminalViewProps {
  stdout?: string
  stderr?: string
  projectId?: string
}

export function TerminalView({ stdout = '', stderr = '' }: TerminalViewProps) {
  const hasOutput = Boolean(stdout?.trim() || stderr?.trim())

  return (
    <div className="h-full bg-black/90 text-green-200 rounded-lg border border-gray-700 overflow-hidden flex flex-col">
      <div className="px-3 py-2 text-xs text-gray-300 bg-black/70 border-b border-gray-700">
        Terminal
      </div>
      <div className="flex-1 p-3 overflow-auto font-mono text-xs leading-relaxed">
        {hasOutput ? (
          <>
            {stdout?.trim() && (
              <pre className="whitespace-pre-wrap break-words text-green-200">{stdout}</pre>
            )}
            {stderr?.trim() && (
              <pre className="whitespace-pre-wrap break-words text-red-300 mt-3">{stderr}</pre>
            )}
          </>
        ) : (
          <div className="text-gray-400">No output yet. Run your code to see logs.</div>
        )}
      </div>
    </div>
  )
}
