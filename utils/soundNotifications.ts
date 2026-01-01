/**
 * Sound notification utilities for collaboration events
 */

// Create a simple beep sound using Web Audio API
function createBeepSound(frequency: number = 800, duration: number = 200, volume: number = 0.3): void {
  try {
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
    const oscillator = audioContext.createOscillator()
    const gainNode = audioContext.createGain()

    oscillator.connect(gainNode)
    gainNode.connect(audioContext.destination)

    oscillator.frequency.value = frequency
    oscillator.type = 'sine'

    gainNode.gain.setValueAtTime(volume, audioContext.currentTime)
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + duration / 1000)

    oscillator.start(audioContext.currentTime)
    oscillator.stop(audioContext.currentTime + duration / 1000)
  } catch (error) {
    // Fallback: use browser beep if Web Audio API is not available
    console.warn('Could not play sound notification:', error)
  }
}

// Play a notification sound for collaboration (code edits)
export function playCollaborationSound(): void {
  // Higher pitch beep for collaboration
  createBeepSound(1000, 150, 0.2)
}

// Play a notification sound for chat messages
export function playChatSound(): void {
  // Lower pitch beep for chat
  createBeepSound(600, 200, 0.25)
}

