import type { TrainingPlan, WeekPlan } from "@/lib/types"
import { sessionTypeMeta } from "@/lib/theme"
export const getTodayIsoWeekday = (date: Date): number => date.getDay() || 7
export function getNextSession(
  plan: TrainingPlan,
  currentWeek: number,
  todayIsoWeekday: number,
) {
  const pending = plan.weeks
    .flatMap((w) => w.sessions)
    .filter((s) => s.status === "pending")
    .sort((a, b) => a.week - b.week || a.day - b.day)
  return (
    pending.find((s) => s.week === currentWeek && s.day >= todayIsoWeekday) ??
    pending.find((s) => s.week > currentWeek) ??
    pending[0] ??
    null
  )
}
export function parseDurationMinutes(duration: string): number {
  const range = duration.match(/(\d+)\s*[-–]\s*(\d+)\s*m/i)
  if (range) return Number(range[2])
  const hours = duration.match(/(\d+(?:\.\d+)?)\s*h(?:r|ours?)?/i)
  const minutes = duration.match(/(\d+(?:\.\d+)?)\s*m(?:in(?:utes?)?)?/i)
  return (
    (hours ? Number(hours[1]) * 60 : 0) + (minutes ? Number(minutes[1]) : 0)
  )
}
export function getWeekSummary(week: WeekPlan) {
  const planned = week.sessions.length
  const completed = week.sessions.filter((s) => s.status === "completed").length
  const skipped = week.sessions.filter((s) => s.status === "skipped").length
  const plannedMinutes = week.sessions.reduce(
    (n, s) => n + parseDurationMinutes(s.duration),
    0,
  )
  const completedMinutes = week.sessions
    .filter((s) => s.status === "completed")
    .reduce((n, s) => n + parseDurationMinutes(s.duration), 0)
  const load = Math.round(
    week.sessions.reduce(
      (n, s) =>
        n +
        (sessionTypeMeta[s.type].intensity * parseDurationMinutes(s.duration)) /
          10,
      0,
    ),
  )
  const completedLoad = Math.round(
    week.sessions
      .filter((s) => s.status === "completed")
      .reduce(
        (n, s) =>
          n +
          (sessionTypeMeta[s.type].intensity *
            parseDurationMinutes(s.duration)) /
            10,
        0,
      ),
  )
  return {
    planned,
    completed,
    skipped,
    plannedMinutes,
    completedMinutes,
    load,
    completedLoad,
    compliancePct: planned ? Math.round((completed / planned) * 100) : 0,
  }
}
export type WeekSummary = ReturnType<typeof getWeekSummary>
export const getPlanOverview = (plan: TrainingPlan) =>
  plan.weeks.map(({ sessions, ...week }) => ({
    ...week,
    ...getWeekSummary({ ...week, sessions }),
  }))
export function getRaceCountdownDays(
  raceDate: string,
  now: Date,
): number | null {
  const date = new Date(`${raceDate.slice(0, 10)}T00:00:00`)
  if (!raceDate || !Number.isFinite(date.getTime())) return null
  const today = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate())
  return Math.max(
    0,
    Math.round(
      (Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()) - today) /
        86400000,
    ),
  )
}
