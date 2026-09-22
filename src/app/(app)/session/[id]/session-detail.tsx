"use client"

import { use } from "react"
import { useRouter } from "next/navigation"
import { ChevronLeft, CheckCircle2, SkipForward, ChevronDown, ChevronUp } from "lucide-react"
import { useState } from "react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { sessionTypeColors } from "@/lib/theme"
import { usePlanStore } from "@/stores/plan-store"
import type { Session, ExerciseSet } from "@/lib/types"

function ExerciseRow({ ex }: { ex: ExerciseSet }) {
  return (
    <div className="flex items-start justify-between py-3 border-b border-[#1A1A1A] last:border-0 gap-3 hover:bg-[rgba(255,255,255,0.03)] transition-colors px-4">
      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium text-white">{ex.exercise}</div>
        {ex.notes && <div className="text-xs text-[#6B7280] mt-0.5">{ex.notes}</div>}
      </div>
      <div className="text-right shrink-0 space-y-0.5">
        {ex.sets && <div className="text-xs text-primary font-semibold tnum">{ex.sets} sets</div>}
        {ex.reps && <div className="text-xs text-white tnum">{ex.reps}</div>}
        {ex.duration && <div className="text-xs text-white tnum">{ex.duration}</div>}
        {ex.distance && <div className="text-xs text-white tnum">{ex.distance}</div>}
        {ex.pace && <div className="text-xs text-[#6B7280] tnum">@ {ex.pace}</div>}
        {ex.rpe && <div className="text-xs text-[#6B7280] tnum">RPE {ex.rpe}/10</div>}
        {ex.rest && <div className="text-xs text-[#6B7280] tnum">Rest: {ex.rest}</div>}
      </div>
    </div>
  )
}

function SessionBlock({ block, defaultOpen = true }: { block: Session["warmup"]; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen)

  return (
    <div className="border-b border-[#1A1A1A] last:border-0">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-4 py-3.5 hover:text-white transition-colors"
      >
        <div className="flex items-center gap-2">
          <span className="text-xs uppercase tracking-[0.1em] text-[#6B7280] font-medium">{block.title}</span>
          <span className="text-xs text-[#6B7280] tnum">· {block.duration}</span>
        </div>
        {open ? <ChevronUp className="w-4 h-4 text-[#6B7280]" /> : <ChevronDown className="w-4 h-4 text-[#6B7280]" />}
      </button>
      {open && (
        <div className="pb-2">
          {block.exercises.map((ex, i) => (
            <ExerciseRow key={i} ex={ex} />
          ))}
        </div>
      )}
    </div>
  )
}

export default function SessionDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const { plan, updateSessionStatus } = usePlanStore()

  const session = plan?.weeks.flatMap((w) => w.sessions).find((s) => s.id === id)

  if (!session) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 px-4">
        <div className="text-[#6B7280]">Session not found</div>
        <Button variant="ghost" onClick={() => router.back()}>Go back</Button>
      </div>
    )
  }

  const colors = sessionTypeColors[session.type]

  function handleComplete() {
    updateSessionStatus(id, "completed")
    toast.success("Session complete!", { description: "Logged. Keep stacking those sessions." })
    router.push("/dashboard")
  }

  function handleSkip() {
    updateSessionStatus(id, "skipped")
    toast("Session skipped", { description: "That's fine. Back at it next time." })
    router.push("/dashboard")
  }

  return (
    <div className="min-h-screen bg-background pb-8">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background/90 backdrop-blur-md border-b border-[#1A1A1A] px-4 py-3">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-1 text-[#6B7280] hover:text-white transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
          <span className="text-sm">Back</span>
        </button>
      </div>

      <div className="px-4 py-4 space-y-4">
        {/* Session header */}
        <div>
          <div className="flex items-center gap-2 mb-2">
            <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: colors.bg }} />
            <span className="text-[10px] uppercase tracking-[0.12em] text-[#6B7280]">
              {colors.label} · {session.duration}
              {session.status !== "pending" && (
                <span className="ml-2 text-primary">
                  {session.status === "completed" ? "· Completed" : "· Skipped"}
                </span>
              )}
            </span>
          </div>
          <h1 className="text-xl font-semibold text-white">{session.title}</h1>
        </div>

        {/* Coach note */}
        <div className="py-4 border-y border-[#1A1A1A]">
          <div className="text-[10px] uppercase tracking-[0.12em] text-[#6B7280] mb-2">Coach&apos;s Note</div>
          <p className="text-sm text-[#A0A0A0] leading-relaxed">{session.coachNote}</p>
        </div>

        {/* Blocks */}
        <div className="border border-[#1A1A1A] rounded-md overflow-hidden">
          <SessionBlock block={session.warmup} defaultOpen={false} />
          <SessionBlock block={session.mainSet} defaultOpen={true} />
          <SessionBlock block={session.cooldown} defaultOpen={false} />
        </div>

        {/* Action buttons */}
        {session.status === "pending" && (
          <div className="flex gap-3 pt-2">
            <Button
              onClick={handleComplete}
              className="flex-1 h-10 bg-primary text-primary-foreground font-semibold"
            >
              <CheckCircle2 className="w-4 h-4 mr-2" />
              Mark Complete
            </Button>
            <Button
              onClick={handleSkip}
              variant="outline"
              className="h-10 px-4 border-[#1F1F1F] text-[#6B7280] hover:text-white"
            >
              <SkipForward className="w-4 h-4" />
            </Button>
          </div>
        )}

        {session.status !== "pending" && (
          <Button
            onClick={() => updateSessionStatus(id, "pending")}
            variant="ghost"
            className="w-full text-[#6B7280] hover:text-white"
          >
            Mark as pending
          </Button>
        )}
      </div>
    </div>
  )
}
