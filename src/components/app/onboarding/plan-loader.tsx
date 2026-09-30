"use client"

import { motion, useReducedMotion } from "framer-motion"
import { motionTransition, planSequence, planStages } from "@/lib/motion"
import { Logo } from "@/components/shared/logo"

export function PlanLoader({ elapsed = 0 }: { elapsed?: number }) {
  const reduced = useReducedMotion()
  const stage = planSequence(elapsed)
  return (
    <motion.div initial={{ opacity: reduced ? 1 : 0 }} animate={{ opacity: 1 }} transition={motionTransition(reduced)} className="fixed inset-0 z-50 flex min-h-dvh items-start pt-[24vh] justify-center bg-background px-6 text-foreground">
      <div
        role="status"
        aria-live="polite"
        className="flex w-full max-w-sm flex-col items-start text-left"
      >
        <Logo size="lg" />
        <h1 className="mt-8 text-[22px] font-semibold tracking-tight">
          Building your plan...
        </h1>
        <div
          aria-hidden="true"
          className="my-5 h-0.5 w-full overflow-hidden bg-hairline"
        >
          <motion.div className="h-full origin-left bg-accent" initial={false} animate={{ scaleX: reduced ? 1 : stage.progress }} transition={motionTransition(reduced)} />
        </div>
        <p className="sr-only">{reduced ? "Preparing your training plan" : stage.complete ? "Your plan is ready" : planStages[stage.index].label}</p>
        <ol aria-hidden="true" className="w-full space-y-4 text-sm">
          {planStages.map((item, index) => {
            const done = stage.complete || index < stage.index
            return <li key={item.label} className={`flex items-center gap-3 ${!reduced && index === stage.index ? "text-foreground" : "text-text-2"}`}>
              <span className="w-4 font-mono text-accent">{!reduced && done ? "✓" : String(index + 1).padStart(2, "0")}</span>
              {item.label}
            </li>
          })}
        </ol>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
          Your training starts here. Getting everything ready for race day.
        </p>
      </div>
    </motion.div>
  )
}
