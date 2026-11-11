import { describe, it, expect, vi, afterEach } from "vitest"
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

afterEach(() => { vi.useRealTimers(); vi.unstubAllEnvs() })
it.each([0, 23])("27/28 calendar-day boundary at local hour %i with seconds", hour => {
 vi.stubEnv("TZ", "Asia/Manila")
 vi.useFakeTimers(); vi.setSystemTime(new Date(2026, 10, 10, hour, hour === 0 ? 0 : 59, 30))
 expect(weeksUntilRace("2026-12-07")).toBe(3)
 expect(weeksUntilRace("2026-12-08")).toBe(4)
})
it("counts calendar days across pinned New York daylight-saving transition", () => {
 vi.stubEnv("TZ", "America/New_York")
 vi.useFakeTimers(); vi.setSystemTime(new Date(2027, 1, 28, 23, 59, 30))
 expect(new Date(2027, 1, 28).getTimezoneOffset()).not.toBe(new Date(2027, 2, 28).getTimezoneOffset())
 expect(weeksUntilRace("2027-03-27")).toBe(3)
 expect(weeksUntilRace("2027-03-28")).toBe(4)
})
