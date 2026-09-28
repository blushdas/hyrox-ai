import { describe, expect, test } from "vitest"
import { generateBeginnerPlan } from "@/lib/mock-data"
import { getNextSession, getTodayIsoWeekday, getWeekSummary, parseDurationMinutes, getRaceCountdownDays } from "./selectors"
describe("train selectors", () => {
  const makePlan = () => ({ id: "test", totalWeeks: 12, raceDate: "2026-12-20", weeks: generateBeginnerPlan("2026-12-20") })
  test("today wins over yesterday and rolls into next week", () => {
    const p = makePlan(); const s = p.weeks[0].sessions[1]
    expect(getNextSession(p,1,s.day)?.id).toBe(s.id)
    expect(getNextSession(p,1,8)?.week).toBe(2)
  })
  test("catch-up and all done", () => {
    const p = makePlan(); const first = p.weeks[0].sessions[0]
    p.weeks.forEach(w => w.sessions.forEach(s => { if(s !== first) s.status = "completed" }))
    expect(getNextSession(p,12,7)?.id).toBe(first.id)
    first.status = "completed"; expect(getNextSession(p,12,7)).toBeNull()
  })
  test.each([["60 min",60],["45-60 min",60],["1 hr",60],["1h 15m",75],["unknown",0]])("parses %s",(s,n) => expect(parseDurationMinutes(s as string)).toBe(n))
  test("empty week has zero compliance", () => expect(getWeekSummary({ week:1,phase:"base",phaseWeek:1,totalPhaseWeeks:4,sessions:[] }).compliancePct).toBe(0))
  test("ISO Sunday and calendar countdown", () => { expect(getTodayIsoWeekday(new Date(2026,8,27))).toBe(7); expect(getRaceCountdownDays("2026-09-28",new Date(2026,8,27,23))).toBe(1) })
})
