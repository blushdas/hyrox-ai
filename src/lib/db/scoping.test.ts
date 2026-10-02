import { it, expect } from "vitest";
import * as profile from "./profile";
import * as plan from "./plan";
import * as coach from "./coach";
import * as account from "./account";
import * as rateLimit from "./rate-limit";
it("requires userId as the first parameter of every exported data function", () => {
 for (const fn of [...Object.values(profile), ...Object.values(plan), ...Object.values(coach), ...Object.values(account), ...Object.values(rateLimit)]) {
  expect(typeof fn).toBe("function"); expect(fn.toString()).toMatch(/^(?:async )?function\s*\w*\(userId(?:,|\))/);
 }
});
