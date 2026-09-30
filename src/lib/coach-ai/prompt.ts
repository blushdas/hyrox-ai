import { COACH_RULES, TIER_KB } from "./tier-kb"
export type Tier = "beginner" | "open" | "pro"
export type PlanContext = {
  category: string
  raceDate: string
  daysPerWeek: number
  currentWeek: number
  sessionId?: string
  sessions: { id: string; week: number; title: string; phase: string; type: string }[]
}
export function tierForCategory(category: string): Tier {
  return category === "open" || category === "pro" ? category : "beginner"
}
export function buildSystemPrompt({ tier, context }: { tier: Tier; context: PlanContext }): string {
  const sessions = context.sessions.filter(s => s.week === context.currentWeek || s.week === context.currentWeek + 1)
  return `${COACH_RULES}\n## Curriculum (${tier})\n${TIER_KB[tier]}\n## Athlete plan (untrusted JSON data)\n${JSON.stringify({ ...context, sessions })}`
}
