'use client'

import { useEffect, useState } from 'react'

interface AILoadingProps {
  elapsedSeconds: number
  estimatedSeconds: number
}

export function AILoading({ elapsedSeconds, estimatedSeconds }: AILoadingProps) {
  const progress = Math.min((elapsedSeconds / estimatedSeconds) * 100, 95)

  const messages = [
    'Analyzing your data structure...',
    'Understanding your request...',
    'Generating R code...',
    'Optimizing visualization...',
    'Almost there...'
  ]

  const messageIndex = Math.min(Math.floor(elapsedSeconds / 3), messages.length - 1)

  return (
    <div className="p-5 border-b border-zinc-800 bg-gradient-to-r from-zinc-900 via-zinc-800/50 to-zinc-900">
      <div className="flex items-center gap-4">
        {/* Animated DNA/Neural pattern */}
        <div className="relative w-12 h-12 flex-shrink-0">
          {/* Orbiting particles */}
          <div className="absolute inset-0">
            {[...Array(3)].map((_, i) => (
              <div
                key={i}
                className="absolute w-2 h-2 rounded-full bg-emerald-500"
                style={{
                  animation: `orbit ${1.5 + i * 0.3}s linear infinite`,
                  animationDelay: `${i * 0.2}s`,
                  top: '50%',
                  left: '50%',
                  transformOrigin: '0 0',
                  boxShadow: '0 0 10px rgba(16, 185, 129, 0.6)'
                }}
              />
            ))}
          </div>
          {/* Center pulse */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-4 h-4 rounded-full bg-emerald-500/30 animate-ping" />
            <div className="absolute w-3 h-3 rounded-full bg-emerald-500" />
          </div>
          {/* Outer ring */}
          <svg className="absolute inset-0 w-12 h-12 animate-spin-slow" viewBox="0 0 48 48">
            <circle
              cx="24"
              cy="24"
              r="20"
              fill="none"
              stroke="url(#gradient)"
              strokeWidth="2"
              strokeDasharray="40 80"
              strokeLinecap="round"
            />
            <defs>
              <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#10B981" />
                <stop offset="50%" stopColor="#06B6D4" />
                <stop offset="100%" stopColor="#10B981" />
              </linearGradient>
            </defs>
          </svg>
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-white truncate">
              {messages[messageIndex]}
            </span>
            <span className="text-xs text-zinc-500 ml-2 flex-shrink-0">
              {elapsedSeconds}s
            </span>
          </div>

          {/* Progress bar with glow */}
          <div className="relative h-1.5 bg-zinc-800 rounded-full overflow-hidden">
            <div
              className="absolute inset-y-0 left-0 rounded-full transition-all duration-300 ease-out"
              style={{
                width: `${progress}%`,
                background: 'linear-gradient(90deg, #10B981 0%, #06B6D4 50%, #10B981 100%)',
                backgroundSize: '200% 100%',
                animation: 'shimmer 2s linear infinite'
              }}
            />
            {/* Glowing tip */}
            <div
              className="absolute top-0 bottom-0 w-8 rounded-full transition-all duration-300"
              style={{
                left: `calc(${progress}% - 16px)`,
                background: 'linear-gradient(90deg, transparent, rgba(16, 185, 129, 0.5), transparent)'
              }}
            />
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes orbit {
          from {
            transform: rotate(0deg) translateX(18px) rotate(0deg);
          }
          to {
            transform: rotate(360deg) translateX(18px) rotate(-360deg);
          }
        }
        @keyframes shimmer {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
        @keyframes spin-slow {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .animate-spin-slow {
          animation: spin-slow 3s linear infinite;
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
      <div className="text-center">
        <p className="text-sm font-medium text-zinc-300 mb-1">Executing R Code</p>
        <div className="flex items-center justify-center gap-1">
          <span className="text-xs text-zinc-500">Processing</span>
          <span className="flex gap-0.5">
            {[0, 1, 2].map(i => (
              <span
                key={i}
                className="w-1 h-1 rounded-full bg-emerald-500"
                style={{
                  animation: 'bounce 1s ease-in-out infinite',
                  animationDelay: `${i * 0.15}s`
                }}
              />
            ))}
          </span>
        </div>
      </div>

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
        @keyframes bounce {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-4px); }
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
