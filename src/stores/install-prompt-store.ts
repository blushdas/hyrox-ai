"use client"

import { create } from "zustand"

export const INSTALL_DISMISSED_KEY = "finisher:install-dismissed"

export type InstallPromptEvent = Event & {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>
}

type InstallPromptState = {
  event: InstallPromptEvent | null
  installed: boolean
  dismissed: boolean
  hydrated: boolean
  setEvent: (event: InstallPromptEvent | null) => void
  hydrateDismissed: (dismissed: boolean) => void
  markInstalled: () => void
  dismiss: () => void
  promptInstall: () => Promise<void>
}

export const useInstallPromptStore = create<InstallPromptState>((set, get) => ({
  event: null,
  installed: false,
  dismissed: false,
  hydrated: false,
  setEvent: (event) => set({ event }),
  hydrateDismissed: (dismissed) => set({ dismissed, hydrated: true }),
  markInstalled: () => set({ installed: true, event: null }),
  dismiss: () => {
    set({ dismissed: true })
    try {
      if (typeof window !== "undefined") window.localStorage.setItem(INSTALL_DISMISSED_KEY, "true")
    } catch (error) {
      // Keep dismissal for this session when storage is unavailable.
      console.warn("Install dismissal could not be saved", error)
    }
  },
  promptInstall: async () => {
    const event = get().event
    if (!event) return
    try {
      await event.prompt()
    } catch (error) {
      console.error("Install prompt failed", error)
    } finally {
      // A deferred event is single-use; preserve any newer event.
      if (get().event === event) set({ event: null })
    }
  },
}))
