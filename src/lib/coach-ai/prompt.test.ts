import { expect, test } from "vitest"
import { readFileSync, existsSync } from "node:fs"
import { buildSystemPrompt, tierForCategory, type PlanContext } from "./prompt"
import { COACH_RULES, TIER_KB } from "./tier-kb"
const context: PlanContext = { category: "open", raceDate: "2026-12-20", daysPerWeek: 4, currentWeek: 4, sessions: [3,4,5,6].map(week => ({ id: `w${week}`, week, title: "Sled Push", phase: "build", type: "stations" })) }
test.each(["open", "pro", "beginner", "doubles", "../pro", "OPEN", "constructor", ""])("allowlists tier %s", category => {
  expect(tierForCategory(category)).toBe(category === "open" || category === "pro" ? category : "beginner")
})
test.each(["beginner", "open", "pro"] as const)("bundles %s curriculum and compact plan", tier => {
  const prompt = buildSystemPrompt({ tier, context })
  expect(prompt).toContain(COACH_RULES)
  expect(prompt).toContain(TIER_KB[tier])
  expect(prompt).toContain('"raceDate":"2026-12-20"')
  expect(prompt).toContain('"id":"w4"')
  expect(prompt).toContain('"id":"w5"')
  expect(prompt).not.toContain('"id":"w3"')
  expect(prompt).not.toContain('"id":"w6"')
  // Ignored original docs need not exist in fresh checkouts; compare when available.
  const source = `docs/hyrox-source/${tier}.md`
  if (existsSync(source)) expect(TIER_KB[tier]).toBe(readFileSync(source, "utf8"))
})
test("bundled rules stay synchronized with versioned markdown", () => {
  expect(COACH_RULES).toBe(readFileSync("src/lib/coach-ai/coach-rules.md", "utf8"))
})
