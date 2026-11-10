"use client"

import { useEffect, useRef, useState } from "react"
import { Capacitor } from "@capacitor/core"
import { Share, SquarePlus, X } from "lucide-react"
import {
  INSTALL_MAX_SEEN,
  bumpInstallSeen,
  readInstallSeen,
  useInstallPromptStore,
} from "@/stores/install-prompt-store"

type InstallEnvironment = {
  native: boolean
  standalone: boolean
  dismissed: boolean
  installed: boolean
  hasEvent: boolean
  isIosSafari: boolean
}

const SHOW_DELAY_MS = 2500
const EXIT_MS = 220

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

export function shouldOfferInstall(seen: number): boolean {
  return seen < INSTALL_MAX_SEEN
}

type InstallBannerProps = { className?: string }

export function InstallBanner({ className = "bottom-4" }: InstallBannerProps) {
  const { event, installed, dismissed, hydrated, dismiss, promptInstall } = useInstallPromptStore()
  const [environment, setEnvironment] = useState<Pick<InstallEnvironment, "native" | "standalone" | "isIosSafari"> | null>(null)
  const [mounted, setMounted] = useState(false)
  const [visible, setVisible] = useState(false)
  const [prompting, setPrompting] = useState(false)
  const exitTimer = useRef<number | undefined>(undefined)
  const pendingCommit = useRef<(() => void) | undefined>(undefined)

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

  // Running as an installed app proves they already did it: never offer again.
  const standalone = environment?.standalone === true
  useEffect(() => {
    if (standalone && hydrated && !dismissed) dismiss()
  }, [standalone, hydrated, dismissed, dismiss])

  const mode = environment && hydrated
    ? getInstallMode({ ...environment, dismissed, installed, hasEvent: event !== null })
    : "hidden"

  // Wait a beat so the sheet never competes with the first paint or a first tap.
  useEffect(() => {
    if (mode === "hidden" || mounted || prompting) return
    if (!shouldOfferInstall(readInstallSeen())) return
    const timer = window.setTimeout(() => {
      bumpInstallSeen()
      setMounted(true)
      window.requestAnimationFrame(() => window.requestAnimationFrame(() => setVisible(true)))
    }, SHOW_DELAY_MS)
    return () => window.clearTimeout(timer)
  }, [mode, mounted, prompting])

  // Leaving mid-exit must not drop the pending choice: flush it instead of cancelling.
  useEffect(() => () => {
    if (exitTimer.current === undefined) return
    window.clearTimeout(exitTimer.current)
    exitTimer.current = undefined
    pendingCommit.current?.()
    pendingCommit.current = undefined
  }, [])

  // Close with the exit transition, then run the commit (e.g. remember the dismissal).
  const close = (commit?: () => void) => {
    setVisible(false)
    pendingCommit.current = commit
    exitTimer.current = window.setTimeout(() => {
      exitTimer.current = undefined
      pendingCommit.current = undefined
      commit?.()
      setMounted(false)
    }, EXIT_MS)
  }

  // Fire inside the tap so the browser still sees a user gesture; the sheet exits on its own.
  const install = () => {
    setPrompting(true)
    void promptInstall()
    close()
  }

  if (!mounted || mode === "hidden") return null

  return (
    <section
      aria-label="Install FINISHER"
      data-visible={visible}
      className={`install-sheet fixed inset-x-0 z-40 mx-auto w-[calc(100%-32px)] max-w-[380px] rounded-lg border border-hairline bg-surface-1 p-4 shadow-[0_12px_32px_rgba(0,0,0,0.55)] ${className}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="text-[15px] font-semibold leading-5">Add FINISHER to your home screen</h2>
          <p className="mt-0.5 text-[13px] text-text-2">One tap to today&apos;s session.</p>
        </div>
        <button
          type="button"
          onClick={() => close()}
          aria-label="Dismiss install prompt"
          className="-mr-2 -mt-2 flex min-h-11 min-w-11 items-center justify-center rounded-md text-text-2 hover:bg-white/5 focus-visible:outline-2 focus-visible:outline-accent"
        >
          <X size={18} aria-hidden="true" />
        </button>
      </div>

      {mode === "ios" ? (
        <>
          <ol className="mt-3 space-y-2 text-[14px]">
            <li className="flex items-center gap-3 rounded-md bg-surface-2 px-3 py-2.5">
              <span className="tnum flex size-5 shrink-0 items-center justify-center rounded-full bg-accent text-[11px] font-bold text-accent-ink">1</span>
              <span className="flex-1">Tap Share</span>
              <Share size={18} className="text-text-2" aria-hidden="true" />
            </li>
            <li className="flex items-center gap-3 rounded-md bg-surface-2 px-3 py-2.5">
              <span className="tnum flex size-5 shrink-0 items-center justify-center rounded-full bg-accent text-[11px] font-bold text-accent-ink">2</span>
              <span className="flex-1">Add to Home Screen</span>
              <SquarePlus size={18} className="text-text-2" aria-hidden="true" />
            </li>
          </ol>
          <button
            type="button"
            onClick={() => close()}
            className="mt-3 min-h-11 w-full rounded-md text-[13px] font-medium text-text-2 hover:bg-white/5 focus-visible:outline-2 focus-visible:outline-accent"
          >
            Already added
          </button>
        </>
      ) : (
        <div className="mt-3 flex gap-2">
          <button
            type="button"
            onClick={install}
            className="min-h-11 flex-1 rounded-md bg-accent px-4 text-[14px] font-semibold text-accent-ink hover:opacity-80 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
          >
            Install
          </button>
          <button
            type="button"
            onClick={() => close()}
            className="min-h-11 rounded-md px-4 text-[13px] font-medium text-text-2 hover:bg-white/5 focus-visible:outline-2 focus-visible:outline-accent"
          >
            Not now
          </button>
        </div>
      )}
    </section>
  )
}
