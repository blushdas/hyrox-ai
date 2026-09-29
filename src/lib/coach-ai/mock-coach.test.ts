import { expect, test } from "vitest"
import { generateBeginnerPlan } from "@/lib/mock-data"
import {
  buildCoachReply,
  chunkForStreaming,
  MAX_MESSAGE_CHARS,
} from "./mock-coach"
const plan = {
  id: "test",
  raceDate: "2026-12-20",
  totalWeeks: 12,
  weeks: generateBeginnerPlan("2026-12-20"),
}
test("citations resolve and use two-digit week labels", () => {
  for (const prompt of [
    "next session",
    "week structure",
    "sled pacing",
    "race readiness",
    "hello",
  ]) {
    const r = buildCoachReply(prompt, plan, 1, 1)
    expect(r.citations.length).toBeGreaterThan(0)
    for (const c of r.citations) {
      const s = plan.weeks
        .flatMap((w) => w.sessions)
        .find((s) => s.id === c.sessionId)
      expect(s).toBeDefined()
      expect(c.href).toBe(`/session/${s!.id}`)
      expect(c.label).toBe(`W${String(s!.week).padStart(2, "0")} · ${s!.title}`)
    }
  }
})
test("session context is cited first", () => {
  const s = plan.weeks[4].sessions[1]
  expect(buildCoachReply("why", plan, 1, 1, s.id).citations[0].sessionId).toBe(
    s.id,
  )
})
test("over-limit is explicit", () =>
  expect(
    buildCoachReply("x".repeat(MAX_MESSAGE_CHARS + 1), plan, 1, 1),
  ).toMatchObject({
    status: "error",
    errorMessage: "Message too long. Keep it under 2000 characters.",
  }))
test.each([
  "A reply with spaces.\n\nAnd another line.",
  "  leading and trailing  ",
  "",
])("chunks round-trip %s", (text) =>
  expect(chunkForStreaming(text, 3).join("")).toBe(text),
)
