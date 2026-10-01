import { expect, test } from "vitest"
import { generateBeginnerPlan } from "@/lib/mock-data"
import { resolveCitations } from "./citations"
const plan = { id: "test", raceDate: "2026-12-20", totalWeeks: 12, weeks: generateBeginnerPlan("2026-12-20") }
const session = plan.weeks[3].sessions[0]
test("known IDs deduplicate, unknown IDs disappear, labels and href resolve", () => {
  const parsed = resolveCitations(`Work [[session:${session.id}]] repeat [[session:${session.id}]] [[session:unknown]]`, plan)
  expect(parsed.content).toBe("Work [1] repeat [1] ")
  expect(parsed.citations).toHaveLength(1)
  expect(parsed.citations[0]).toMatchObject({ label: `W04 · ${session.title}`, href: `/session/${session.id}` })
})
test("every possible split across a marker stays hidden until complete", () => {
  const marker = `[[session:${session.id}]]`
  for (let i = 1; i < marker.length; i++) {
    expect(resolveCitations("Work " + marker.slice(0,i), plan).content).toBe("Work ")
    expect(resolveCitations("Work " + marker.slice(0,i) + marker.slice(i), plan).content).toBe("Work [1]")
  }
})
