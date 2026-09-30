"use client"

import { useEffect, useState } from "react"
import { motion, useReducedMotion } from "framer-motion"
import { DURATION_FAST, PLAN_DURATION, motionTransition, planStages } from "@/lib/motion"
import { useRouter } from "next/navigation"
import { ChevronLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Logo } from "@/components/shared/logo"
import { useAthleteStore } from "@/stores/athlete-store"
import { usePlanGenerator } from "@/hooks/use-plan-generator"
import { PlanLoader } from "@/components/app/onboarding/plan-loader"
import { StepRace } from "@/components/app/onboarding/step-race"
import { StepFitness } from "@/components/app/onboarding/step-fitness"
import { StepBiometrics } from "@/components/app/onboarding/step-biometrics"
import { StepAvailability } from "@/components/app/onboarding/step-availability"
import { StepAssessment } from "@/components/app/onboarding/step-assessment"
import type { AthleteProfile } from "@/lib/types"

const TOTAL_STEPS = 5
const STEP_LABELS = [
  "Race Details",
  "Fitness Baseline",
  "About You",
  "Availability",
  "Self-Assessment",
]

const defaults: Partial<AthleteProfile> = {
  raceDate: "",
  location: "",
  category: "open",
  fiveKTime: "",
  tenKTime: "",
  hyroxTime: "",
  age: null,
  gender: "",
  weight: null,
  weightUnit: "kg",
  daysPerWeek: 4,
  sessionLength: 60,
  fitnessLevel: "beginner_mid",
}

export default function OnboardingPage() {
  const router = useRouter()
  const { setProfile, setOnboardingComplete } = useAthleteStore()
  const { generatePlan } = usePlanGenerator()
  const [step, setStep] = useState(1)
  const [data, setData] = useState<Partial<AthleteProfile>>(defaults)
  const [loading, setLoading] = useState(false)
  const [elapsed, setElapsed] = useState(0)
  const [now] = useState(() => Date.now())
  const reduced = useReducedMotion()

  useEffect(() => {
    if (!loading) return
    let boundary = 0
    const timers = planStages.map((stage) => {
      boundary += stage.duration
      const at = boundary
      return setTimeout(() => setElapsed(at), at)
    })
    timers.push(setTimeout(() => router.push("/dashboard"), PLAN_DURATION + DURATION_FAST * 1000))
    return () => timers.forEach(clearTimeout)
  }, [loading, router])

  function updateData(updates: Partial<AthleteProfile>) {
    setData((prev) => ({ ...prev, ...updates }))
  }

  function validateStep(): boolean {
    if (step === 1) {
      const weeksToRace = data.raceDate
        ? Math.floor(
            (new Date(data.raceDate).getTime() - now) /
              (7 * 24 * 60 * 60 * 1000),
          )
        : 0
      return !!data.raceDate && weeksToRace >= 4
    }
    if (step === 4) return !!data.daysPerWeek && !!data.sessionLength
    if (step === 5) return !!data.fitnessLevel
    return true
  }

  async function handleNext() {
    if (!validateStep()) return

    if (step < TOTAL_STEPS) {
      setStep(step + 1)
      return
    }

    // Final step — generate plan
    setLoading(true)
    const profile = data as AthleteProfile
    setProfile(profile)
    generatePlan(profile)
    setOnboardingComplete(true)

  }

  const stepComponents = [
    <StepRace key={1} data={data} onChange={updateData} />,
    <StepFitness key={2} data={data} onChange={updateData} />,
    <StepBiometrics key={3} data={data} onChange={updateData} />,
    <StepAvailability key={4} data={data} onChange={updateData} />,
    <StepAssessment key={5} data={data} onChange={updateData} />,
  ]

  if (loading) return <PlanLoader elapsed={elapsed} />

  return (
    <div className="min-h-screen bg-background flex lg:flex-row flex-col">
      {/* ── Desktop Left Panel ────────────────────────────────── */}
      <div className="hidden lg:flex flex-col w-[320px] border-r border-border p-10 justify-between shrink-0">
        <div>
          <Logo size="md" />

          <div className="mt-12 space-y-5">
            {STEP_LABELS.map((label, i) => {
              const stepNum = i + 1
              const isDone = stepNum < step
              const isActive = stepNum === step
              return (
                <div key={label} className="flex items-center gap-4">
                  <div
                    className={`w-7 h-7 rounded-xs font-mono flex items-center justify-center text-xs font-bold shrink-0 transition-colors ${
                      isDone
                        ? "bg-primary text-primary-foreground"
                        : isActive
                          ? "bg-accent-soft text-primary border border-primary"
                          : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {isDone ? (
                      <span className="size-2 bg-accent-ink" />
                    ) : (
                      String(stepNum).padStart(2, "0")
                    )}
                  </div>
                  <span
                    className={`text-sm transition-colors ${
                      isDone
                        ? "text-text-2"
                        : isActive
                          ? "text-foreground font-semibold"
                          : "text-muted-foreground"
                    }`}
                  >
                    {label}
                  </span>
                </div>
              )
            })}
          </div>
        </div>

        <p className="text-sm text-muted-foreground leading-relaxed">
          Race day is counting down.
          <br />
          Let&apos;s build your plan.
        </p>
      </div>

      {/* ── Right Panel (mobile: full / desktop: flex-1) ─────── */}
      <div className="flex min-w-0 flex-col flex-1">
        {/* Header */}
        <div className="flex items-center gap-3 p-4 pt-[calc(env(safe-area-inset-top)+16px)] border-b border-border">
          <button
            onClick={() => (step > 1 ? setStep(step - 1) : router.push("/"))}
            aria-label="Previous step"
            className="flex size-11 items-center justify-center text-text-2"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div className="font-mono text-[11px] uppercase tracking-wider text-text-3">
            {String(step).padStart(2, "0")} / 05 · {STEP_LABELS[step - 1]}
          </div>
        </div>

        {/* Progress bar — mobile only */}
        <div className="h-0.5 bg-hairline">
          <motion.div
            className="h-full origin-left bg-accent"
            initial={false}
            animate={{ scaleX: step / TOTAL_STEPS }}
            transition={motionTransition(reduced)}
          />
        </div>

        {/* Step content */}
        <motion.div
          key={step}
          data-onboarding-step={step}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={motionTransition(reduced)}
          className="flex-1 w-full max-w-[680px] mx-auto px-4 py-8"
        >
          {stepComponents[step - 1]}
        </motion.div>

        {/* Footer action */}
        <div className="sticky bottom-0 w-full max-w-[680px] mx-auto bg-background p-4 pb-[calc(env(safe-area-inset-bottom)+16px)] border-t border-border">
          {step === 1 &&
            data.raceDate &&
            (() => {
              const weeks = Math.floor(
                (new Date(data.raceDate).getTime() - now) /
                  (7 * 24 * 60 * 60 * 1000),
              )
              if (weeks < 4) {
                return (
                  <div className="mb-3 p-3 bg-surface-1 border-l border-danger">
                    <p className="text-[13px] text-danger">
                      Race is less than 4 weeks away. We need at least 4 weeks
                      for a meaningful plan.
                    </p>
                  </div>
                )
              }
              return null
            })()}

          <Button
            onClick={handleNext}
            disabled={!validateStep() || loading}
            className="w-full h-12 bg-primary text-primary-foreground font-semibold text-base disabled:opacity-40"
          >
            {loading
              ? "Building your plan..."
              : step === TOTAL_STEPS
                ? "Build My Plan"
                : "Continue"}
          </Button>
        </div>
      </div>
    </div>
  )
}
