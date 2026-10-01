"use client"
import { motion, useReducedMotion } from "framer-motion"

export const thinkingLabel = (searching: boolean) => (searching ? "Searching the web" : "Coach is thinking")

const EASE_OUT_EXPO: [number, number, number, number] = [0.16, 1, 0.3, 1]

export function Thinking({ searching = false }: { searching?: boolean }) {
  const reduced = useReducedMotion()
  return (
    <div role="status" aria-live="polite" className="flex min-h-11 items-center gap-3">
      <span aria-hidden className="flex h-4 items-end gap-[3px]">
        {[0, 1, 2].map(i => (
          <motion.span
            key={i}
            className="block h-4 w-[3px] origin-bottom rounded-full bg-accent"
            style={reduced ? { scaleY: 0.6 } : undefined}
            animate={reduced ? undefined : { scaleY: [0.3, 1, 0.3], opacity: [0.45, 1, 0.45] }}
            transition={{ duration: 1.4, repeat: Infinity, ease: EASE_OUT_EXPO, delay: i * 0.18 }}
          />
        ))}
      </span>
      <motion.span
        className="font-mono text-[11px] uppercase tracking-wider text-text-2"
        animate={reduced ? undefined : { opacity: [0.55, 1, 0.55] }}
        transition={{ duration: 2.4, repeat: Infinity, ease: EASE_OUT_EXPO }}
      >
        {thinkingLabel(searching)}
      </motion.span>
    </div>
  )
}
