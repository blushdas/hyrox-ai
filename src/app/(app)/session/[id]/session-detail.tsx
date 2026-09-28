"use client"

import { use } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { ChevronLeft, SkipForward } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { sessionTypeMeta } from "@/lib/theme"
import { parseDurationMinutes } from "@/lib/train/selectors"
import { usePlanStore } from "@/stores/plan-store"
import {
  PageHeader,
  Section,
  EmptyState,
  MonoLabel,
  IntensityTicks,
  Skeleton,
} from "@/components/shell/primitives"
import { StepList, DAYS } from "@/components/train/train-components"

export default function SessionDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = use(params)
  const router = useRouter()
  const { plan, updateSessionStatus } = usePlanStore()

  const session = plan?.weeks
    .flatMap((w) => w.sessions)
    .find((s) => s.id === id)

  if (!plan) return <Skeleton />
  if (!session)
    return (
      <EmptyState
        label="SESSION NOT FOUND"
        action={
          <Link
            href="/dashboard"
            className="inline-flex min-h-11 items-center text-accent"
          >
            Back to Train
          </Link>
        }
      >
        This session is not in your current plan.
      </EmptyState>
    )
  const meta = sessionTypeMeta[session.type]

  function handleComplete() {
    updateSessionStatus(id, "completed")
    toast.success("Session complete!", {
      description: "Logged. Keep stacking those sessions.",
    })
    router.push("/dashboard")
  }

  function handleSkip() {
    updateSessionStatus(id, "skipped")
    toast("Session skipped", {
      description: "That's fine. Back at it next time.",
    })
    router.push("/dashboard")
  }

  return (
    <>
      <PageHeader
        title={session.title}
        meta={`WK ${String(session.week).padStart(2, "0")} · ${DAYS[session.day - 1]} · ${session.phase}`}
        action={
          <Button
            variant="ghost"
            size="icon"
            aria-label="Back"
            onClick={() => router.back()}
          >
            <ChevronLeft />
          </Button>
        }
      />
      <div className="py-4">
        <MonoLabel>
          {session.status === "pending" ? "PLANNED" : session.status}
        </MonoLabel>
      </div>
      <div className="flex flex-wrap gap-5 border-y py-5 font-mono text-[13px]">
        <span>DURATION {session.duration.toUpperCase()}</span>
        <span>TYPE {meta.code}</span>
        <span className="flex items-center gap-2">
          INTENSITY <IntensityTicks intensity={meta.intensity} />
        </span>
        <span>
          LOAD{" "}
          {Math.round(
            (meta.intensity * parseDurationMinutes(session.duration)) / 10,
          )}
        </span>
      </div>
      <Section label="WHY THIS SESSION">
        <p className="text-text-2">{session.coachNote}</p>
        <Link
          className="my-3 inline-flex min-h-11 items-center text-sm text-accent"
          href={`/coach-ai?session=${id}`}
        >
          Ask Coach AI about this session →
        </Link>
      </Section>
      <StepList block={session.warmup} label="WARM-UP" />
      <StepList block={session.mainSet} label="MAIN SET" defaultOpen />
      <StepList block={session.cooldown} label="COOL-DOWN" />
      <div className="sticky bottom-[calc(var(--tab-bar-h)+env(safe-area-inset-bottom))] mt-8 flex gap-3 border-t bg-background py-4 lg:bottom-0">
        {session.status === "pending" ? (
          <>
            <Button className="flex-1" onClick={handleComplete}>
              Mark complete
            </Button>
            <Button
              variant="outline"
              size="icon"
              aria-label="Skip session"
              onClick={handleSkip}
            >
              <SkipForward />
            </Button>
          </>
        ) : (
          <Button
            className="w-full"
            variant="ghost"
            onClick={() => updateSessionStatus(id, "pending")}
          >
            Mark as pending
          </Button>
        )}
      </div>
    </>
  )
}
