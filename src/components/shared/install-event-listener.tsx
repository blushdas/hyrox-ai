"use client"

import { useEffect } from "react"
import { Capacitor } from "@capacitor/core"
import { INSTALL_DISMISSED_KEY, useInstallPromptStore, type InstallPromptEvent } from "@/stores/install-prompt-store"

export function InstallEventListener() {
  useEffect(() => {
    if (Capacitor.isNativePlatform()) return
    const store = useInstallPromptStore.getState()
    const onPrompt = (event: Event) => {
      event.preventDefault()
      store.setEvent(event as InstallPromptEvent)
    }
    const onInstalled = () => store.markInstalled()
    window.addEventListener("beforeinstallprompt", onPrompt)
    window.addEventListener("appinstalled", onInstalled)
    let dismissed = false
    try {
      dismissed = window.localStorage.getItem(INSTALL_DISMISSED_KEY) === "true"
    } catch (error) {
      console.warn("Install dismissal could not be read; using session state", error)
      dismissed = store.dismissed
    }
    store.hydrateDismissed(dismissed)
    return () => {
      window.removeEventListener("beforeinstallprompt", onPrompt)
      window.removeEventListener("appinstalled", onInstalled)
    }
  }, [])
  return null
}
