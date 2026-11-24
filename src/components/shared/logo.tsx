"use client"

import { useLayoutEffect, useRef, useState } from "react"
import { createColdStartGate, durationSeconds } from "@/lib/motion"
import { cn } from "@/lib/utils"

type LogoProps = {
  className?: string
  size?: "sm" | "md" | "lg"
}

export function Logo({ className, size = "md" }: LogoProps) {
  const sizeClasses = {
    sm: "text-lg",
    md: "text-xl",
    lg: "text-3xl",
  }

  return (
    <span
      className={cn(
        "font-semibold tracking-tight",
        sizeClasses[size],
        className,
      )}
    >
      <span className="text-primary">F</span>
      <span className="text-foreground">INISHER</span>
    </span>
  )
}

const claimSplash = createColdStartGate()

export function ColdStartSplash() {
  const [visible, setVisible] = useState(true)
  const ownsSplash = useRef(false)

  useLayoutEffect(() => {
    // Retain ownership through Strict Mode's effect replay, while rejecting remounts.
    if (!ownsSplash.current && !claimSplash()) {
      queueMicrotask(() => setVisible(false))
      return
    }
    ownsSplash.current = true
    const duration = durationSeconds(getComputedStyle(document.documentElement).getPropertyValue("--dur-splash"), 0.9)
    const timer = window.setTimeout(() => setVisible(false), duration * 1000)
    return () => window.clearTimeout(timer)
  }, [])

  if (!visible) return null
  return (
    <div className="motion-splash" aria-hidden="true" data-cold-start-splash
      onAnimationEnd={(event) => { if (event.target === event.currentTarget) setVisible(false) }}
    >
      <div className="motion-splash-mask">
        <Logo size="lg" className="motion-splash-logo" />
      </div>
    </div>
  )
}
