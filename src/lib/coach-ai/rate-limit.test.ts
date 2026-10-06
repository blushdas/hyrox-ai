import { expect, it } from "vitest";
import { RATE_LIMIT_MESSAGE, ME_WRITE_LIMIT, ME_WRITE_WINDOW_MS, COACH_LIMIT, COACH_WINDOW_MS } from "./rate-limit";
it("retains the UI message and named fixed limits", () => {
 expect(RATE_LIMIT_MESSAGE).toBe("Too many messages. Wait a minute and try again.");
 expect([ME_WRITE_LIMIT,ME_WRITE_WINDOW_MS,COACH_LIMIT,COACH_WINDOW_MS]).toEqual([60,60000,20,300000]);
});
