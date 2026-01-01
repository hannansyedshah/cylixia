import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { SessionStore } from '@/types'

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

