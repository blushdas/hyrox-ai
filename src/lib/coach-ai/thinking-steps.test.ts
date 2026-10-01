import { expect, test } from "vitest"
import { deriveThinkingStep } from "./thinking-steps"

test.each([
  [false, 0, "understand", "Coach is thinking", "Reading your question against your plan."],
  [true, 0, "web", "Searching the web", "Looking up current sources."],
  [false, 1, "review", "Reviewing 1 source", "Checking what the sources say before answering."],
  [true, 3, "review", "Reviewing 3 sources", "Checking what the sources say before answering."],
] as const)("derives exact step for searching=%s, sources=%s", (searching, sourceCount, category, label, caption) => {
  expect(deriveThinkingStep({ searching, sourceCount })).toEqual({ category, label, caption })
})
