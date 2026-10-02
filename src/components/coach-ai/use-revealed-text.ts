"use client"
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react"
import { useReducedMotion } from "framer-motion"
import { advanceRevealBatches, nextRevealLength, revealFrames, REVEAL_FINISH_MAX_MS, REVEAL_FRAME_MS, type RevealBatch } from "@/lib/coach-ai/reveal"

const FLUSH_EVENT = "coach-ai:flush-reveal"
export function flushRevealedText() {
  if (typeof document === "undefined") return
  document.dispatchEvent(new Event(FLUSH_EVENT))
}

type View = { shown: number; batches: RevealBatch[]; nextId: number; flushed: boolean }
// Keyed assistant mounts own their pacing and batch identities.
export function useRevealedText(target: string, streaming: boolean, failed = false) {
  const reduced = useReducedMotion()
  const received = useMemo(() => target.replace(/\r\n/g, "\n"), [target])
  const [animate] = useState(() => streaming && !reduced)
  const [view, setView] = useState<View>(() => ({ shown: streaming ? 0 : received.length, batches: [], nextId: 0, flushed: false }))
  const state = useRef(view)
  const input = useRef({ received, streaming, failed })
  useLayoutEffect(() => { input.current = { received, streaming, failed } }, [received, streaming, failed])
  const pending = animate && !view.flushed && view.shown < received.length
  const draining = !failed && !reduced && (pending || view.batches.length > 0)
  const active = animate && !failed && !reduced && !view.flushed && draining

  useEffect(() => {
    const flush = () => {
      const next = { ...state.current, shown: input.current.received.length, batches: [], flushed: true }
      state.current = next
      setView(next)
    }
    const stop = () => { if (input.current.streaming) flush() }
    const preference = (event: MediaQueryListEvent) => { if (event.matches) flush() }
    const media = window.matchMedia("(prefers-reduced-motion: reduce)")
    document.addEventListener(FLUSH_EVENT, stop)
    media.addEventListener("change", preference)
    return () => {
      document.removeEventListener(FLUSH_EVENT, stop)
      media.removeEventListener("change", preference)
    }
  }, [])

  useEffect(() => {
    if (streaming || failed || reduced || !animate) return
    // Reference finish(maxWaitMs): an exceptional replay cannot meet both a
    // fixed 400/frame cap and an arbitrary-length deadline without this guard.
    const timer = window.setTimeout(() => {
      if (state.current.shown >= input.current.received.length && !state.current.batches.length) return
      const next = { ...state.current, shown: input.current.received.length, batches: [], flushed: true }
      state.current = next
      setView(next)
    }, REVEAL_FINISH_MAX_MS)
    return () => clearTimeout(timer)
  }, [streaming, failed, reduced, animate])

  useEffect(() => {
    if (!active) return
    let raf = 0
    let last = performance.now()
    const tick = (now: number) => {
      if (input.current.failed || state.current.flushed) return
      if (now - last < REVEAL_FRAME_MS) {
        raf = requestAnimationFrame(tick)
        return
      }
      const previous = state.current
      const shown = nextRevealLength(previous.shown, input.current.received.length, revealFrames(now - last))
      last = now
      const batch = advanceRevealBatches(previous.batches, previous.shown, shown, previous.nextId, now)
      if (shown !== previous.shown || batch.batches.length !== previous.batches.length) {
        const next = { shown, ...batch, flushed: false }
        state.current = next
        setView(next)
      }
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [active])
  return {
    text: animate && !reduced && !view.flushed ? received.slice(0, view.shown) : received,
    batches: animate && !reduced && !view.flushed ? view.batches : [],
    draining,
  }
}
