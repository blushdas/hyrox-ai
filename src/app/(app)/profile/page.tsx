"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { signOut } from "next-auth/react"
import { Capacitor } from "@capacitor/core"
import { getAuthOrigin } from "@/lib/auth/auth-origin"
import { toast } from "sonner"
import { Edit2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { PageHeader, Section, MonoLabel } from "@/components/shell/primitives"
import { Avatar } from "@/components/people/people-components"
import { getRaceCountdownDays } from "@/lib/train/selectors"
import { useAthleteStore } from "@/stores/athlete-store"
import { usePlanStore } from "@/stores/plan-store"
import { usePlanGenerator } from "@/hooks/use-plan-generator"

export default function ProfilePage() {
  const router = useRouter()
  const { profile, setProfile } = useAthleteStore()
  const { clearPlan } = usePlanStore()
  const { generatePlan } = usePlanGenerator()
  const [editingRaceDate, setEditingRaceDate] = useState(false)
  const [newRaceDate, setNewRaceDate] = useState(profile?.raceDate ?? "")

  useEffect(() => {
    if (!profile) router.replace("/onboarding")
  }, [profile, router])

  if (!profile) return null

  function handleRaceDateSave() {
    if (!newRaceDate || !profile) return
    const weeks = Math.floor(
      (new Date(newRaceDate).getTime() - Date.now()) /
        (7 * 24 * 60 * 60 * 1000),
    )
    if (weeks < 4) {
      toast.error("Race must be at least 4 weeks away")
      return
    }
    const updated = { ...profile, raceDate: newRaceDate }
    setProfile(updated)
    clearPlan()
    generatePlan(updated)
    setEditingRaceDate(false)
    toast.success("Plan regenerated!", {
      description: "Your new plan is ready.",
    })
  }

  function handleResetOnboarding() {
    clearPlan()
    router.push("/onboarding")
  }

  const stats = [
    {
      label: "Race Date",
      value: profile.raceDate
        ? new Date(profile.raceDate).toLocaleDateString("en-GB", {
            day: "numeric",
            month: "long",
            year: "numeric",
          })
        : "Not set",
    },
    { label: "Location", value: profile.location || "Not set" },
    {
      label: "Category",
      value:
        profile.category.charAt(0).toUpperCase() + profile.category.slice(1),
    },
    { label: "5K Time", value: profile.fiveKTime || "—" },
    { label: "10K Time", value: profile.tenKTime || "—" },
    { label: "HYROX Time", value: profile.hyroxTime || "—" },
    { label: "Age", value: profile.age?.toString() || "—" },
    { label: "Gender", value: profile.gender || "—" },
    {
      label: "Weight",
      value: profile.weight ? `${profile.weight} ${profile.weightUnit}` : "—",
    },
    { label: "Training Days", value: `${profile.daysPerWeek} days/week` },
    { label: "Session Length", value: `${profile.sessionLength} min` },
    {
      label: "Fitness Level",
      value: {
        beginner_low: "Just starting out",
        beginner_mid: "Some base fitness",
        beginner_high: "Decent fitness",
      }[profile.fitnessLevel],
    },
  ]

  return (
    <>
      <PageHeader title="Profile" />
      <div className="flex items-center gap-4 py-6">
        <Avatar initials={profile.category.slice(0, 2).toUpperCase()} large />
        <div>
          <MonoLabel>
            {profile.category} · {profile.location || "LOCATION NOT SET"}
          </MonoLabel>
          <p className="mt-2">
            <MonoLabel>
              RACE {profile.raceDate} ·{" "}
              {getRaceCountdownDays(profile.raceDate, new Date()) ?? "—"} DAYS
            </MonoLabel>
          </p>
        </div>
      </div>
      {[
        ["RACE", 0, 3],
        ["BENCHMARKS", 3, 6],
        ["ATHLETE", 6, 9],
        ["TRAINING", 9, 12],
      ].map(([label, start, end]) => (
        <Section key={label} label={String(label)}>
          {stats.slice(Number(start), Number(end)).map((stat) => (
            <div key={stat.label}>
              <div className="flex min-h-16 items-center justify-between gap-4 border-b py-3">
                <span className="text-sm text-text-2">{stat.label}</span>
                <div className="flex min-w-0 items-center gap-2">
                  <span className="text-right font-mono text-[13px]">
                    {stat.value}
                  </span>
                  {stat.label === "Race Date" && (
                    <Button
                      aria-label="Edit race date"
                      variant="ghost"
                      size="icon"
                      onClick={() => setEditingRaceDate(!editingRaceDate)}
                    >
                      <Edit2 />
                    </Button>
                  )}
                </div>
              </div>
              {stat.label === "Race Date" && editingRaceDate && (
                <div className="space-y-3 border-b py-4">
                  <Input
                    aria-label="Race date"
                    type="date"
                    value={newRaceDate}
                    onChange={(e) => setNewRaceDate(e.target.value)}
                    min={new Date().toISOString().split("T")[0]}
                  />
                  <div className="flex flex-wrap gap-2">
                    <Button onClick={handleRaceDateSave}>
                      Save and regenerate plan
                    </Button>
                    <Button
                      variant="ghost"
                      onClick={() => setEditingRaceDate(false)}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </Section>
      ))}
      <Section label="ACCOUNT">
        <Button
          variant="ghost"
          className="w-full justify-start rounded-none border-b"
          onClick={handleResetOnboarding}
        >
          Redo onboarding
        </Button>
        <Button
          variant="ghost"
          className="w-full justify-start rounded-none border-b text-danger"
          onClick={async () => {
            if (Capacitor.isNativePlatform()) {
              const origin = getAuthOrigin()
              if (!origin) {
                toast.error("Hosted authentication is not configured")
                return
              }
              window.location.href = `${origin}/api/auth/signout?callbackUrl=${encodeURIComponent(`${origin}/sign-in`)}`
              return
            }
            await signOut({ callbackUrl: "/sign-in" })
          }}
        >
          Sign out
        </Button>
      </Section>
    </>
  )
}
