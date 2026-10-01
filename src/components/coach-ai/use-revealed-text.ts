"use client"
import { useEffect, useRef, useState } from "react"
import { useReducedMotion } from "framer-motion"
import { nextRevealLength, revealFrames } from "@/lib/coach-ai/reveal"

export function useRevealedText(target: string, streaming: boolean) {
  const reduced = useReducedMotion()
  const [shown, setShown] = useState(0)
  const targetRef = useRef(target)
  targetRef.current = target
  const active = streaming && !reduced
  useEffect(() => {
    if (!active) return
    let raf = 0
    let last = performance.now()
    const tick = (now: number) => {
      const frames = revealFrames(now - last)
      last = now
      setShown((s) => nextRevealLength(Math.min(s, targetRef.current.length), targetRef.current.length, frames))
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [active])
  return active ? target.slice(0, Math.min(shown, target.length)) : target
}
