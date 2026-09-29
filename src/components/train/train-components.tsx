"use client"
import Link from "next/link"
import { useState } from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { sessionTypeMeta } from "@/lib/theme"
import type { Session, SessionBlock, WeekPlan } from "@/lib/types"
import type { WeekSummary } from "@/lib/train/selectors"
import {
  MonoLabel,
  StatusGlyph,
  IntensityTicks,
  Segments,
} from "@/components/shell/primitives"
export const DAYS = ["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"]
export function TrainSegments({ plan = false }: { plan?: boolean }) {
  return (
    <Segments
      items={[
        { href: "/dashboard", label: "This week", active: !plan },
        { href: "/plan", label: "Plan", active: plan },
      ]}
    />
  )
}
export function NextSessionHero({
  session,
  today,
  currentWeek,
}: {
  session: Session
  today: number
  currentWeek: number
}) {
  const meta = sessionTypeMeta[session.type]
  return (
    <article className="rounded-md border bg-surface-1 p-4">
      <div className="flex justify-between gap-3">
        <MonoLabel>
          {session.day === today && session.week === currentWeek
            ? "TODAY"
            : `NEXT · ${DAYS[session.day - 1]}`}
        </MonoLabel>
        <span className="flex items-center gap-2">
          <MonoLabel>{meta.code}</MonoLabel>
          <IntensityTicks intensity={meta.intensity} accent />
        </span>
      </div>
      <h2 className="mt-5 text-[28px] font-semibold leading-8 tracking-[-0.02em]">
        {session.title}
      </h2>
      <p className="my-3 font-mono text-[13px] uppercase text-text-2">
        {session.duration} · {session.phase} · WK{" "}
        {String(session.week).padStart(2, "0")}
      </p>
      <ol className="mb-5 space-y-2 text-[13px] text-text-2">
        {session.mainSet.exercises.slice(0, 3).map((e, i) => (
          <li key={i}>
            <span className="mr-3 font-mono text-text-3">0{i + 1}</span>
            {e.exercise}
          </li>
        ))}
      </ol>
      <Link
        className="flex min-h-11 items-center justify-center rounded-md bg-accent px-4 font-medium text-accent-ink"
        href={`/session/${session.id}`}
      >
        Start session
      </Link>
      <Link
        className="mt-2 flex min-h-11 items-center text-sm text-text-2"
        href={`/coach-ai?session=${session.id}`}
      >
        Why this session →
      </Link>
    </article>
  )
}
export function WeekStrip({
  week,
  totalWeeks,
  onChange,
  today,
  actualWeek,
}: {
  week: WeekPlan
  totalWeeks: number
  onChange: (n: number) => void
  today: number
  actualWeek: number
}) {
  return (
    <section className="mt-7">
      <div className="flex items-center justify-between">
        <button
          className="flex size-11 items-center justify-center disabled:opacity-30"
          disabled={week.week <= 1}
          aria-label="Previous week"
          onClick={() => onChange(week.week - 1)}
        >
          <ChevronLeft size={20} />
        </button>
        <MonoLabel>
          WEEK {String(week.week).padStart(2, "0")} / {totalWeeks} ·{" "}
          {week.phase}
        </MonoLabel>
        <button
          className="flex size-11 items-center justify-center disabled:opacity-30"
          disabled={week.week >= totalWeeks}
          aria-label="Next week"
          onClick={() => onChange(week.week + 1)}
        >
          <ChevronRight size={20} />
        </button>
      </div>
      <div className="grid grid-cols-7 border-y">
        {DAYS.map((d, i) => (
          <button
            key={d}
            aria-label={`${d}: ${week.sessions.find((s) => s.day === i + 1)?.status ?? "Rest"}`}
            onClick={() =>
              document
                .getElementById(`day-${i + 1}`)
                ?.scrollIntoView({ block: "center" })
            }
            className={`flex min-h-20 flex-col items-center justify-center gap-3 border-b-2 ${week.week === actualWeek && i + 1 === today ? "border-accent bg-accent-soft" : "border-transparent"}`}
          >
            <MonoLabel>{d[0]}</MonoLabel>
            <StatusGlyph
              status={week.sessions.find((s) => s.day === i + 1)?.status}
            />
          </button>
        ))}
      </div>
    </section>
  )
}
export function WeekSummaryBar({ summary: s }: { summary: WeekSummary }) {
  return (
    <div className="grid grid-cols-4 border-b py-5">
      {[
        [`${s.completed}/${s.planned}`, "SESSIONS"],
        [`${s.completedMinutes}/${s.plannedMinutes}`, "TIME · MIN"],
        [`${s.completedLoad}/${s.load}`, "LOAD"],
        [`${s.compliancePct}%`, "DONE"],
      ].map(([v, k]) => (
        <div key={k} className="min-w-0 border-r px-2 first:pl-0 last:border-0">
          <div className="mb-1 font-mono text-[13px]">{v}</div>
          <MonoLabel className="tracking-normal">{k}</MonoLabel>
        </div>
      ))}
    </div>
  )
}
export function SessionRow({
  session: s,
  anchor = false,
}: {
  session: Session
  anchor?: boolean
}) {
  return (
    <Link
      id={anchor ? `day-${s.day}` : undefined}
      href={`/session/${s.id}`}
      className="flex min-h-24 scroll-mt-28 items-center gap-4 border-b py-4 hover:bg-surface-2"
    >
      <MonoLabel className="w-8 shrink-0">{DAYS[s.day - 1]}</MonoLabel>
      <div className="min-w-0 flex-1">
        <div
          className={`font-semibold ${s.status === "completed" ? "text-text-2" : ""}`}
        >
          {s.title}
        </div>
        <div className="mt-2 flex items-center gap-3">
          <MonoLabel>
            {sessionTypeMeta[s.type].code} · {s.duration}
          </MonoLabel>
          <IntensityTicks intensity={sessionTypeMeta[s.type].intensity} />
        </div>
      </div>
      <StatusGlyph status={s.status} />
      <ChevronRight size={16} className="shrink-0 text-text-3" />
    </Link>
  )
}
export function StepList({
  block,
  defaultOpen = false,
  label,
}: {
  block: SessionBlock
  defaultOpen?: boolean
  label: string
}) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <section className="border-b">
      <button
        aria-expanded={open}
        onClick={() => setOpen(!open)}
        className="flex min-h-16 w-full items-center justify-between gap-3 text-left"
      >
        <MonoLabel>
          {label} · {block.duration}
        </MonoLabel>
        <span>{open ? "−" : "+"}</span>
      </button>
      {open && (
        <ol>
          {block.exercises.map((e, i) => (
            <li key={i} className="flex gap-3 border-t py-4">
              <span className="font-mono text-[11px] text-text-3">
                {String(i + 1).padStart(2, "0")}
              </span>
              <div className="min-w-0 flex-1">
                <p className="font-medium">{e.exercise}</p>
                {e.notes && (
                  <p className="mt-1 text-[13px] leading-[18px] text-text-2">
                    {e.notes}
                  </p>
                )}
              </div>
              <div className="max-w-[42%] text-right font-mono text-[13px] leading-5">
                {[
                  e.sets ? `${e.sets} SETS` : null,
                  e.reps,
                  e.duration,
                  e.distance,
                  e.pace ? `@ ${e.pace}` : null,
                  e.rpe ? `RPE ${e.rpe}` : null,
                  e.rest ? `REST ${e.rest}` : null,
                ]
                  .filter(Boolean)
                  .map((v, j) => (
                    <div key={j}>{v}</div>
                  ))}
              </div>
            </li>
          ))}
        </ol>
      )}
    </section>
  )
}
export function PlanWeekRow({
  row: r,
  maxLoad,
  active,
  onSelect,
}: {
  row: WeekSummary & { week: number }
  maxLoad: number
  active: boolean
  onSelect: () => void
}) {
  return (
    <button
      onClick={onSelect}
      aria-current={active ? "true" : undefined}
      className={`grid min-h-24 w-full grid-cols-[56px_1fr_44px] items-center gap-3 border-b px-3 py-4 text-left ${active ? "bg-accent-soft text-accent" : ""}`}
    >
      <span className="font-mono text-[13px]">
        WK {String(r.week).padStart(2, "0")}
      </span>
      <div>
        <p className="font-mono text-[11px] text-text-2">
          {r.completed}/{r.planned} SESS · {r.completedMinutes}/
          {r.plannedMinutes} MIN
        </p>
        <div
          className="mt-3 h-2 border border-accent-line"
          style={{ width: `${maxLoad ? (r.load / maxLoad) * 100 : 0}%` }}
        >
          <div
            className="h-full bg-accent"
            style={{
              width: `${r.load ? (r.completedLoad / r.load) * 100 : 0}%`,
            }}
          />
        </div>
      </div>
      <span className="text-right font-mono text-[13px]">
        {r.compliancePct}%
      </span>
    </button>
  )
}
