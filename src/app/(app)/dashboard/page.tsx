"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { PageHeader, MonoLabel, EmptyState, Section, Skeleton } from "@/components/shell/primitives"
import { TrainSegments, NextSessionHero, WeekStrip, WeekSummaryBar, SessionRow } from "@/components/train/train-components"
import { getTodayIsoWeekday, getNextSession, getWeekSummary, getRaceCountdownDays } from "@/lib/train/selectors"
import { useAthleteStore } from "@/stores/athlete-store"
import { usePlanStore } from "@/stores/plan-store"

export default function DashboardPage() {
  const router = useRouter()
  const { profile, onboardingComplete } = useAthleteStore()
  const { plan, currentWeek, setCurrentWeek } = usePlanStore()

  useEffect(() => {
    if (!onboardingComplete || !profile) {
      router.replace("/onboarding")
    }
  }, [onboardingComplete, profile, router])

  if (!plan || !profile) return <Skeleton />
  const now = new Date()
  const today = getTodayIsoWeekday(now)
  const raceDays = getRaceCountdownDays(profile.raceDate, now)
  const actualWeek = Math.max(1, Math.min(plan.totalWeeks, plan.totalWeeks - Math.ceil((raceDays ?? plan.totalWeeks*7)/7) + 1))
  const week = plan.weeks.find(w => w.week === currentWeek) ?? plan.weeks[0]
  const next = getNextSession(plan, actualWeek, today)
  const upcoming = plan.weeks.filter(w => w.week > currentWeek).flatMap(w => w.sessions).filter(s => s.status === "pending").sort((a,b)=>a.week-b.week||a.day-b.day).slice(0,3)
  return <>
    <PageHeader title="Train" meta={`WK ${String(currentWeek).padStart(2,"0")} · ${week?.phase ?? "PLAN"} ${week?.phaseWeek ?? 0}/${week?.totalPhaseWeeks ?? 0}`} action={raceDays !== null && <MonoLabel>{raceDays} DAYS</MonoLabel>} />
    <TrainSegments />
    {next ? <NextSessionHero session={next} today={today} currentWeek={actualWeek}/> : <EmptyState label="PLAN COMPLETE" action={<Link href="/plan" className="inline-flex min-h-11 items-center text-accent">View plan</Link>}>Every session is logged. Race day is next.</EmptyState>}
    {week && <><WeekStrip week={week} totalWeeks={plan.totalWeeks} onChange={setCurrentWeek} today={today} actualWeek={actualWeek}/><WeekSummaryBar summary={getWeekSummary(week)}/></>}
    <Section label="THIS WEEK">{week?.sessions.length ? [...week.sessions].sort((a,b)=>a.day-b.day).map(s=><SessionRow key={s.id} session={s} anchor/>) : <EmptyState label="REST WEEK">No sessions planned this week.</EmptyState>}</Section>
    <Section label="COMING UP">{upcoming.map(s=><SessionRow key={s.id} session={s}/>)}</Section>
    <Link href="/plan" className="mt-4 inline-flex min-h-11 items-center text-text-2">Full plan →</Link>
  </>
}
