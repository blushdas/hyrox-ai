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

test("retry delay rounds up to the earliest available slot without extending the window", () => {
  const allow = createRateLimiter(2, 5000)
  expect(allow.retryAfter("a", 1000)).toBe(0)
  allow("a", 1000); allow("a", 2500)
  expect(allow.retryAfter("a", 2500)).toBe(4)
  expect(allow("a", 3000)).toBe(false)
  expect(allow.retryAfter("a", 3000)).toBe(3)
  expect(allow.retryAfter("b", 3000)).toBe(0)
  expect(allow.retryAfter("a", 5999)).toBe(1)
  expect(allow.retryAfter("a", 6000)).toBe(0)
  expect(allow("a", 6000)).toBe(true)
  expect(allow.retryAfter("a", 6000)).toBe(2)
})
