'use client'

import { useEffect, useState } from 'react'

interface AILoadingProps {
  elapsedSeconds: number
  estimatedSeconds: number
}

export function AILoading({ elapsedSeconds, estimatedSeconds }: AILoadingProps) {
  return (
    <div className="p-4 border-b border-zinc-800 bg-gradient-to-r from-zinc-900 via-zinc-800/50 to-zinc-900">
      <div className="flex items-center gap-3">
        {/* Animated loading spinner */}
        <div className="relative w-8 h-8 flex-shrink-0">
          {/* Orbiting particles */}
          <div className="absolute inset-0">
            {[...Array(3)].map((_, i) => (
              <div
                key={i}
                className="absolute w-1.5 h-1.5 rounded-full bg-emerald-500"
                style={{
                  animation: `orbit ${1.5 + i * 0.3}s linear infinite`,
                  animationDelay: `${i * 0.2}s`,
                  top: '50%',
                  left: '50%',
                  transformOrigin: '0 0',
                  boxShadow: '0 0 8px rgba(16, 185, 129, 0.6)'
                }}
              />
            ))}
          </div>
          {/* Center pulse */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500/30 animate-ping" />
            <div className="absolute w-1.5 h-1.5 rounded-full bg-emerald-500" />
          </div>
        </div>

        {/* Text */}
        <span className="text-sm text-zinc-300">Generating code</span>
      </div>

      <style jsx>{`
        @keyframes orbit {
          from { transform: rotate(0deg) translateX(12px) rotate(0deg); }
          to { transform: rotate(360deg) translateX(12px) rotate(-360deg); }
        }
      `}</style>
    </div>
  )
}

interface CodeExecutionLoadingProps {
  className?: string
}

export function CodeExecutionLoading({ className = '' }: CodeExecutionLoadingProps) {
  const [dots, setDots] = useState<Array<{ x: number; y: number; delay: number }>>([])

  useEffect(() => {
    // Generate random dots for the matrix effect
    const newDots = Array.from({ length: 20 }, () => ({
      x: Math.random() * 100,
      y: Math.random() * 100,
      delay: Math.random() * 2
    }))
    setDots(newDots)
  }, [])

  return (
    <div className={`relative flex flex-col items-center justify-center ${className}`}>
      {/* Background matrix dots */}
      <div className="absolute inset-0 overflow-hidden opacity-20">
        {dots.map((dot, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 rounded-full bg-emerald-500"
            style={{
              left: `${dot.x}%`,
              top: `${dot.y}%`,
              animation: `fall 3s linear infinite`,
              animationDelay: `${dot.delay}s`
            }}
          />
        ))}
      </div>

      {/* Main loading animation - Stacked bars like a chart building */}
      <div className="relative mb-6">
        <div className="flex items-end gap-1.5 h-16">
          {[0.4, 0.7, 1, 0.6, 0.85].map((height, i) => (
            <div
              key={i}
              className="w-3 rounded-t-sm bg-gradient-to-t from-emerald-600 to-emerald-400"
              style={{
                height: `${height * 64}px`,
                animation: `barGrow 1.2s ease-in-out infinite`,
                animationDelay: `${i * 0.15}s`,
                opacity: 0.3
              }}
            />
          ))}
        </div>

        {/* Scanning line */}
        <div
          className="absolute left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-emerald-400 to-transparent"
          style={{
            animation: 'scan 2s ease-in-out infinite',
            top: '50%'
          }}
        />
      </div>

      {/* Text */}
      <p className="text-sm font-medium text-zinc-300">Executing R Code</p>

      {/* Circular progress ring */}
      <svg className="absolute w-32 h-32 -z-10 opacity-10" viewBox="0 0 100 100">
        <circle
          cx="50"
          cy="50"
          r="45"
          fill="none"
          stroke="#10B981"
          strokeWidth="1"
          strokeDasharray="10 5"
          style={{ animation: 'spin 20s linear infinite' }}
        />
        <circle
          cx="50"
          cy="50"
          r="35"
          fill="none"
          stroke="#06B6D4"
          strokeWidth="1"
          strokeDasharray="8 8"
          style={{ animation: 'spin 15s linear infinite reverse' }}
        />
      </svg>

      <style jsx>{`
        @keyframes fall {
          0% { transform: translateY(-10px); opacity: 0; }
          10% { opacity: 1; }
          90% { opacity: 1; }
          100% { transform: translateY(calc(100vh)); opacity: 0; }
        }
        @keyframes barGrow {
          0%, 100% { opacity: 0.3; transform: scaleY(1); }
          50% { opacity: 1; transform: scaleY(1.2); }
        }
        @keyframes scan {
          0%, 100% { top: 100%; opacity: 0; }
          10% { opacity: 1; }
          90% { opacity: 1; }
          50% { top: 0%; }
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  )
}

export function PageLoading() {
  return (
    <div className="h-screen bg-black flex items-center justify-center">
      <div className="relative">
        {/* Outer rotating ring */}
        <div className="w-20 h-20 rounded-full border-2 border-zinc-800 border-t-emerald-500 animate-spin" />

        {/* Inner pulsing circle */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-8 h-8 rounded-full bg-emerald-500/20 animate-pulse" />
          <div className="absolute w-4 h-4 rounded-full bg-emerald-500" />
        </div>
      </div>
    </div>
  )
}
