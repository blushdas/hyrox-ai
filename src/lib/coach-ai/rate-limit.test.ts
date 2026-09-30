import { expect, test } from "vitest"
import { createRateLimiter, RATE_LIMIT_MESSAGE } from "./rate-limit"
test("twenty messages per rolling five minutes, separated by user, window expires", () => {
  const allow = createRateLimiter()
  for (let i=0;i<20;i++) expect(allow("a", 1000+i)).toBe(true)
  expect(allow("a", 1020)).toBe(false)
  expect(allow("b", 1020)).toBe(true)
  expect(allow("a", 300999)).toBe(false)
  expect(allow("a", 301000)).toBe(true)
  expect(allow("a", 301000)).toBe(false)
  expect(RATE_LIMIT_MESSAGE).toBe("Too many messages. Wait a minute and try again.")
})
