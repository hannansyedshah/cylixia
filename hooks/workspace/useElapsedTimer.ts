import { useState, useEffect, useRef } from 'react'

export function useElapsedTimer(isRunning: boolean) {
  const [elapsedSeconds, setElapsedSeconds] = useState(0)
  const startTimeRef = useRef<number | null>(null)

  useEffect(() => {
    if (!isRunning) {
      startTimeRef.current = null
      setElapsedSeconds(0)
      return
    }

    startTimeRef.current = Date.now()
    const interval = setInterval(() => {
      if (startTimeRef.current) {
        setElapsedSeconds(Math.floor((Date.now() - startTimeRef.current) / 1000))
      }
    }, 1000)

    return () => clearInterval(interval)
  }, [isRunning])

  return elapsedSeconds
}
