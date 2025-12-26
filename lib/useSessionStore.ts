import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface SessionStore {
  user: any | null
  setUser: (user: any | null) => void
}

export const useSessionStore = create<SessionStore>()(
  persist(
    (set) => ({
      user: null,
      setUser: (user) => set({ user }),
    }),
    {
      name: 'create-session-storage',
    }
  )
)

