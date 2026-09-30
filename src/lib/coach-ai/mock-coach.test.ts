import { expect, test } from "vitest"
import { MAX_MESSAGE_CHARS, SUGGESTED_PROMPTS } from "./mock-coach"
test("composer constants remain available without a mock reply path", () => {
  expect(MAX_MESSAGE_CHARS).toBe(2000)
  expect(SUGGESTED_PROMPTS).toHaveLength(4)
  expect(SUGGESTED_PROMPTS.every(p => p.prompt.length <= MAX_MESSAGE_CHARS)).toBe(true)
})
