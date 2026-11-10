"use client"

import { create } from "zustand"

export const INSTALL_DISMISSED_KEY = "finisher:install-dismissed"
export const INSTALL_SEEN_KEY = "finisher:install-seen"
// The sheet is an offer, not a nag: at most this many appearances, ever.
export const INSTALL_MAX_SEEN = 2

export function readInstallSeen(): number {
  try {
    const value = Number(window.localStorage.getItem(INSTALL_SEEN_KEY))
    return Number.isFinite(value) && value > 0 ? value : 0
  } catch (error) {
    console.warn("Install impressions could not be read", error)
    return INSTALL_MAX_SEEN
  }
}

export function bumpInstallSeen(): void {
  try {
    window.localStorage.setItem(INSTALL_SEEN_KEY, String(readInstallSeen() + 1))
  } catch (error) {
    console.warn("Install impression could not be saved", error)
  }
}

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
      const choice = await event.userChoice
      // Only an accepted install is final; a cancelled prompt may be offered again within the cap.
      if (choice.outcome === "accepted") get().dismiss()
    } catch (error) {
      console.error("Install prompt failed", error)
    } finally {
      // A deferred event is single-use; preserve any newer event.
      if (get().event === event) set({ event: null })
    }
  },
}))
