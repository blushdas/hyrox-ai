"use client"
import { useId, useState } from "react"
import { AnimatePresence, motion, useReducedMotion } from "framer-motion"
import { Brain, ChevronDown, Globe, ScanSearch } from "lucide-react"
import { deriveThinkingStep } from "@/lib/coach-ai/thinking-steps"

export const thinkingLabel = (searching: boolean) => (searching ? "Searching the web" : "Coach is thinking")

const EASE_OUT_EXPO: [number, number, number, number] = [0.16, 1, 0.3, 1]

const STEP_ICONS = { understand: Brain, web: Globe, review: ScanSearch }

export function Thinking({ searching = false, sourceCount = 0 }: { searching?: boolean; sourceCount?: number }) {
  const [open, setOpen] = useState(false)
  const panelId = useId()
  const step = deriveThinkingStep({ searching, sourceCount })
  const Icon = STEP_ICONS[step.category]
  const reduced = useReducedMotion()
  return (
    <div>
      <div className="flex min-h-11 items-center gap-3">
        <div role="status" aria-live="polite" className="flex min-w-0 items-center gap-3">
          {/* Reduced motion keeps a gentle opacity-only pulse: a loader that never moves reads as frozen. */}
          <span aria-hidden className="flex h-4 items-center gap-1.5">
            {[0, 1, 2].map(i => (
              <motion.span
                key={i}
                className="block size-1.5 rounded-full bg-accent"
                animate={reduced ? { opacity: [0.3, 1, 0.3] } : { opacity: [0.3, 1, 0.3], scale: [0.7, 1.15, 0.7] }}
                transition={{ duration: 1.2, repeat: Infinity, ease: EASE_OUT_EXPO, delay: i * 0.2 }}
              />
            ))}
          </span>
          <motion.span
            className="font-mono text-[11px] uppercase tracking-wider text-text-2"
            animate={{ opacity: [0.55, 1, 0.55] }}
            transition={{ duration: 2.4, repeat: Infinity, ease: EASE_OUT_EXPO }}
          >
            {step.label}
          </motion.span>
        </div>
        <button
          type="button"
          aria-expanded={open}
          aria-controls={panelId}
          onClick={() => setOpen(value => !value)}
          className="ml-auto flex min-h-11 shrink-0 items-center gap-1 rounded-sm px-2 font-mono text-[11px] text-text-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
        >
          {open ? "Hide details" : "See details"}
          <ChevronDown size={14} aria-hidden className={open ? "rotate-180" : "rotate-0"} />
        </button>
      </div>
      {open && (
        <div id={panelId} className="pb-3 pt-1">
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={step.label}
              initial={reduced ? false : { opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={reduced ? undefined : { opacity: 0, y: -4 }}
              transition={{ duration: reduced ? 0 : 0.16, ease: EASE_OUT_EXPO }}
              className="flex items-start gap-3"
            >
              <Icon size={16} aria-hidden className="mt-0.5 shrink-0 text-accent" />
              <div>
                <p className="font-mono text-[11px] uppercase tracking-wider text-text-2">{step.label}</p>
                <p className="mt-1 text-xs text-text-3">{step.caption}</p>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      )}
    </div>
  )
}
