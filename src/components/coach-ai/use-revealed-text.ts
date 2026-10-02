"use client"
import { useEffect, useRef, useState } from "react"
import { useReducedMotion } from "framer-motion"
import { initialRevealState, nextRevealState, revealFrames } from "@/lib/coach-ai/reveal"

// Assistant messages are keyed by message ID; a fresh mount owns a fresh reveal.
export function useRevealedText(target: string, streaming: boolean) {
  const reduced = useReducedMotion()
  const [animate] = useState(streaming)
  const [shown, setShown] = useState(() => streaming ? 0 : target.length)
  const pacing = useRef(initialRevealState(shown))
  const targetRef = useRef(target)
  useEffect(() => { targetRef.current = target }, [target])
  const draining = animate && !reduced && shown < target.length
  const active = !reduced && (streaming || draining)
  useEffect(() => {
    if (!active) return
    let raf = 0
    let last = performance.now()
    const tick = (now: number) => {
      pacing.current = nextRevealState(pacing.current, targetRef.current.length, revealFrames(now - last))
      last = now
      setShown(pacing.current.shown)
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [active])
  return { text: animate && !reduced ? target.slice(0, shown) : target, draining }
}
