"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { ChevronLeft, Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Logo } from "@/components/shared/logo"
import { useAthleteStore } from "@/stores/athlete-store"
import { usePlanGenerator } from "@/hooks/use-plan-generator"
import { StepRace } from "@/components/app/onboarding/step-race"
import { StepFitness } from "@/components/app/onboarding/step-fitness"
import { StepBiometrics } from "@/components/app/onboarding/step-biometrics"
import { StepAvailability } from "@/components/app/onboarding/step-availability"
import { StepAssessment } from "@/components/app/onboarding/step-assessment"
import type { AthleteProfile } from "@/lib/types"

const TOTAL_STEPS = 5
const STEP_LABELS = ["Race Details", "Fitness Baseline", "About You", "Availability", "Self-Assessment"]

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

  function updateData(updates: Partial<AthleteProfile>) {
    setData((prev) => ({ ...prev, ...updates }))
  }

  function validateStep(): boolean {
    if (step === 1) {
      const weeksToRace = data.raceDate
        ? Math.floor((new Date(data.raceDate).getTime() - Date.now()) / (7 * 24 * 60 * 60 * 1000))
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

    setTimeout(() => {
      router.push("/dashboard")
    }, 800)
  }

  const stepComponents = [
    <StepRace key={1} data={data} onChange={updateData} />,
    <StepFitness key={2} data={data} onChange={updateData} />,
    <StepBiometrics key={3} data={data} onChange={updateData} />,
    <StepAvailability key={4} data={data} onChange={updateData} />,
    <StepAssessment key={5} data={data} onChange={updateData} />,
  ]

  return (
    <div className="min-h-screen bg-background flex lg:flex-row flex-col">
      {/* ── Desktop Left Panel ────────────────────────────────── */}
      <div className="hidden lg:flex flex-col w-[380px] border-r border-border p-10 justify-between shrink-0">
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
                    className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 transition-colors ${
                      isDone
                        ? "bg-primary text-primary-foreground"
                        : isActive
                        ? "bg-primary/20 text-primary border border-primary"
                        : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {isDone ? <Check className="w-3.5 h-3.5" /> : stepNum}
                  </div>
                  <span
                    className={`text-sm transition-colors ${
                      isDone
                        ? "text-muted-foreground line-through"
                        : isActive
                        ? "text-white font-semibold"
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
          Race day is counting down.<br />
          Let&apos;s build your plan.
        </p>
      </div>

      {/* ── Right Panel (mobile: full / desktop: flex-1) ─────── */}
      <div className="flex flex-col flex-1">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border">
          <button
            onClick={() => (step > 1 ? setStep(step - 1) : router.push("/"))}
            className="p-2 -ml-2 text-muted-foreground hover:text-white transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <Logo size="sm" className="lg:hidden" />
          <div className="text-xs text-muted-foreground">{step}/{TOTAL_STEPS}</div>
        </div>

        {/* Progress bar — mobile only */}
        <div className="h-1 bg-border lg:hidden">
          <div
            className="h-full bg-primary transition-all duration-500"
            style={{ width: `${(step / TOTAL_STEPS) * 100}%` }}
          />
        </div>

        {/* Step labels — mobile only */}
        <div className="flex px-4 pt-3 gap-1 lg:hidden">
          {STEP_LABELS.map((label, i) => (
            <div
              key={label}
              className={`text-[10px] font-medium transition-colors ${
                i + 1 === step ? "text-primary" : i + 1 < step ? "text-muted-foreground" : "text-border"
              }`}
            >
              {label}{i < STEP_LABELS.length - 1 && " ·"}
            </div>
          ))}
        </div>

        {/* Step content */}
        <div key={step} className="flex-1 px-4 py-6 overflow-y-auto animate-in fade-in slide-in-from-bottom-2 duration-300">
          {stepComponents[step - 1]}
        </div>

        {/* Footer action */}
        <div className="p-4 border-t border-border">
          {step === 1 && data.raceDate && (() => {
            const weeks = Math.floor((new Date(data.raceDate).getTime() - Date.now()) / (7 * 24 * 60 * 60 * 1000))
            if (weeks < 4) {
              return (
                <div className="mb-3 p-3 bg-destructive/10 border border-destructive/30 rounded-lg">
                  <p className="text-xs text-destructive">Race is less than 4 weeks away. We need at least 4 weeks for a meaningful plan.</p>
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
            {loading ? "Building your plan..." : step === TOTAL_STEPS ? "Build My Plan" : "Continue"}
          </Button>
        </div>
      </div>
    </div>
  )
}
