"use client"

import { useEffect, useState } from "react"
import { Capacitor } from "@capacitor/core"
import { X } from "lucide-react"
import { useInstallPromptStore } from "@/stores/install-prompt-store"

type InstallEnvironment = {
  native: boolean
  standalone: boolean
  dismissed: boolean
  installed: boolean
  hasEvent: boolean
  isIosSafari: boolean
}

export function getInstallMode(environment: InstallEnvironment): "hidden" | "prompt" | "ios" {
  if (environment.native || environment.standalone || environment.dismissed || environment.installed) return "hidden"
  if (environment.hasEvent) return "prompt"
  return environment.isIosSafari ? "ios" : "hidden"
}

export function isIosSafari(userAgent: string, maxTouchPoints: number): boolean {
  const ios = /iPhone|iPad|iPod/i.test(userAgent) || (/Macintosh/i.test(userAgent) && maxTouchPoints > 1)
  // Require Safari and exclude common alternate browsers and embedded webviews.
  return ios && /Version\//i.test(userAgent) && /Safari\//i.test(userAgent) && !/CriOS|FxiOS|EdgiOS|OPiOS|GSA|FBAN|FBAV|Instagram/i.test(userAgent)
}

export function InstallBanner() {
  const { event, installed, dismissed, hydrated, dismiss, promptInstall } = useInstallPromptStore()
  const [environment, setEnvironment] = useState<Pick<InstallEnvironment, "native" | "standalone" | "isIosSafari"> | null>(null)

  useEffect(() => {
    const media = window.matchMedia("(display-mode: standalone)")
    const update = () => setEnvironment({
      native: Capacitor.isNativePlatform(),
      standalone: media.matches || (navigator as Navigator & { standalone?: boolean }).standalone === true,
      isIosSafari: isIosSafari(navigator.userAgent, navigator.maxTouchPoints),
    })
    update()
    media.addEventListener("change", update)
    return () => media.removeEventListener("change", update)
  }, [])

  if (!environment || !hydrated) return null
  const mode = getInstallMode({ ...environment, dismissed, installed, hasEvent: event !== null })
  if (mode === "hidden") return null

  return (
    <section aria-label="Install FINISHER" className="mt-4 flex items-start gap-3 rounded-md border border-hairline bg-surface-1 p-4">
      <div className="min-w-0 flex-1">
        <h2 className="font-semibold">Install FINISHER</h2>
        <p className="mt-1 text-sm text-text-2">
          {mode === "prompt" ? "Add it to your home screen for one-tap access." : "Tap Share, then Add to Home Screen."}
        </p>
        {mode === "prompt" && (
          <button type="button" onClick={() => void promptInstall()} className="mt-3 min-h-11 rounded-sm bg-accent px-4 font-semibold text-accent-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent">
            Install
          </button>
        )}
      </div>
      <button type="button" onClick={dismiss} aria-label="Dismiss install prompt" className="flex min-h-11 min-w-11 items-center justify-center text-text-2 focus-visible:outline-2 focus-visible:outline-accent">
        <X size={20} aria-hidden="true" />
      </button>
    </section>
  )
}
