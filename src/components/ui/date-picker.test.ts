import { describe, it, expect } from "vitest"
import { dateKey, isPastDate, weeksUntilRace } from "./date-picker"

describe("race calendar boundaries", () => {
  const now = new Date(2026, 10, 10, 23, 59)
  it("disables yesterday, permits today and tomorrow using local dates", () => {
    expect(dateKey(now)).toBe("2026-11-10")
    expect(isPastDate("2026-11-09", now)).toBe(true)
    expect(isPastDate("2026-11-10", now)).toBe(false)
    expect(isPastDate("2026-11-11", now)).toBe(false)
  })
  it("blocks 27 days and accepts exactly 28 days regardless of current time", () => {
    expect(weeksUntilRace("2026-12-07", now)).toBe(3)
    expect(weeksUntilRace("2026-12-08", now)).toBe(4)
  })
  it("counts through leap days and year boundaries", () => {
    expect(weeksUntilRace("2028-03-15", new Date(2028, 1, 16, 23))).toBe(4)
    expect(weeksUntilRace("2027-01-07", new Date(2026, 11, 10, 23))).toBe(4)
  })
})
