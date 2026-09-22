"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { signOut } from "next-auth/react"
import { Capacitor } from "@capacitor/core"
import { getAuthOrigin } from "@/lib/auth/auth-origin"
import { toast } from "sonner"
import { Edit2, RotateCcw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Logo } from "@/components/shared/logo"
import { useAthleteStore } from "@/stores/athlete-store"
import { usePlanStore } from "@/stores/plan-store"
import { usePlanGenerator } from "@/hooks/use-plan-generator"

export default function ProfilePage() {
  const router = useRouter()
  const { profile, updateProfile, setProfile } = useAthleteStore()
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
    const weeks = Math.floor((new Date(newRaceDate).getTime() - Date.now()) / (7 * 24 * 60 * 60 * 1000))
    if (weeks < 4) {
      toast.error("Race must be at least 4 weeks away")
      return
    }
    const updated = { ...profile, raceDate: newRaceDate }
    setProfile(updated)
    clearPlan()
    generatePlan(updated)
    setEditingRaceDate(false)
    toast.success("Plan regenerated!", { description: "Your new plan is ready." })
  }

  function handleResetOnboarding() {
    clearPlan()
    router.push("/onboarding")
  }

  const stats = [
    { label: "Race Date", value: profile.raceDate ? new Date(profile.raceDate).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" }) : "Not set" },
    { label: "Location", value: profile.location || "Not set" },
    { label: "Category", value: profile.category.charAt(0).toUpperCase() + profile.category.slice(1) },
    { label: "5K Time", value: profile.fiveKTime || "—" },
    { label: "10K Time", value: profile.tenKTime || "—" },
    { label: "HYROX Time", value: profile.hyroxTime || "—" },
    { label: "Age", value: profile.age?.toString() || "—" },
    { label: "Gender", value: profile.gender || "—" },
    { label: "Weight", value: profile.weight ? `${profile.weight} ${profile.weightUnit}` : "—" },
    { label: "Training Days", value: `${profile.daysPerWeek} days/week` },
    { label: "Session Length", value: `${profile.sessionLength} min` },
    { label: "Fitness Level", value: {
      beginner_low: "Just starting out",
      beginner_mid: "Some base fitness",
      beginner_high: "Decent fitness",
    }[profile.fitnessLevel] },
  ]

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background/90 backdrop-blur-md border-b border-border px-4 py-3">
        <Logo size="sm" />
      </div>

      <div className="px-4 py-4 space-y-6">
        <div>
          <h1 className="text-2xl font-black text-white">Profile</h1>
          <p className="text-sm text-muted-foreground mt-1">Your training inputs</p>
        </div>

        {/* Race date edit */}
        <div className="bg-surface border border-border rounded-xl p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="text-sm font-semibold text-white">Race Date</div>
            <button
              onClick={() => setEditingRaceDate(!editingRaceDate)}
              className="text-muted-foreground hover:text-white transition-colors"
            >
              <Edit2 className="w-4 h-4" />
            </button>
          </div>

          {editingRaceDate ? (
            <div className="space-y-3">
              <Input
                type="date"
                value={newRaceDate}
                onChange={(e) => setNewRaceDate(e.target.value)}
                className="bg-background border-border text-white"
                min={new Date().toISOString().split("T")[0]}
              />
              <div className="flex gap-2">
                <Button onClick={handleRaceDateSave} size="sm" className="flex-1 bg-primary text-primary-foreground">
                  Save & Regenerate Plan
                </Button>
                <Button onClick={() => setEditingRaceDate(false)} variant="ghost" size="sm">Cancel</Button>
              </div>
            </div>
          ) : (
            <div className="text-muted-foreground text-sm">
              {profile.raceDate ? new Date(profile.raceDate).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" }) : "Not set"}
            </div>
          )}
        </div>

        {/* All stats */}
        <div className="bg-surface border border-border rounded-xl overflow-hidden">
          {stats.map((stat, i) => (
            <div
              key={stat.label}
              className={`flex items-center justify-between px-4 py-3 ${i < stats.length - 1 ? "border-b border-border" : ""}`}
            >
              <span className="text-sm text-muted-foreground">{stat.label}</span>
              <span className="text-sm text-white font-medium">{stat.value}</span>
            </div>
          ))}
        </div>

        {/* Reset */}
        <div className="pt-2">
          <Button
            onClick={handleResetOnboarding}
            variant="outline"
            className="w-full border-border text-muted-foreground hover:text-white"
          >
            <RotateCcw className="w-4 h-4 mr-2" />
            Redo Onboarding
          </Button>
          <Button variant="outline" className="w-full mt-3" onClick={async () => {
            if (Capacitor.isNativePlatform()) {
              const origin = getAuthOrigin()
              if (!origin) { toast.error("Hosted authentication is not configured"); return }
              window.location.href = `${origin}/api/auth/signout?callbackUrl=${encodeURIComponent(`${origin}/sign-in`)}`
              return
            }
            await signOut({ callbackUrl: "/sign-in" })
          }}>Sign out</Button>
        </div>
      </div>
    </div>
  )
}
