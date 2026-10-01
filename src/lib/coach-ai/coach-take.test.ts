import { expect, test } from "vitest"
import { parseCoachTake } from "./coach-take"
const full = `Coach's take
Keep one run for now.
Build consistently before adding load.
Pros and cons
- More recovery [1]
- Less mileage
Watch-outs
- Watch fatigue
What's working
- Consistency
Next move
Keep the scheduled run this week.
Confidence: High - Grounded in your plan`
test("full card", () => expect(parseCoachTake(full)).toMatchObject({ headline: "Keep one run for now.", summary: "Build consistently before adding load.", nextMove: "Keep the scheduled run this week.", confidence: { level: "High", basis: "Grounded in your plan" }, sections: [{label: "Pros and cons", items: ["More recovery [1]", "Less mileage"]}, {label: "Watch-outs", items: ["Watch fatigue"]}, {label: "What's working", items: ["Consistency"]}] }))
test.each(["# ", "## ", "###### "])("hash headers %s", prefix => expect(parseCoachTake(`${prefix}Coach's take\nYes\n${prefix}Next move\nRun.`)?.headline).toBe("Yes"))
test("bold headers", () => expect(parseCoachTake("**Coach's take:**\nYes\n**Next move**\nRun.")?.nextMove).toBe("Run."))
test("mixed case", () => expect(parseCoachTake("COACH'S TAKE\nYes\nnext MOVE\nRun.")).not.toBeNull())
test("duplicate sections merge", () => expect(parseCoachTake("Pros and cons\n- A\nWatch-outs\n- B\nPros and cons\n- C")?.sections[0].items).toEqual(["A", "C"]))
test("empty sections omitted", () => expect(parseCoachTake("Coach's take\nYes\nPros and cons\nWatch-outs\nNext move\nRun.")?.sections).toEqual([]))
test("confidence optional", () => expect(parseCoachTake("Coach's take\nYes\nNext move\nRun.")?.confidence).toBeUndefined())
test("list next move becomes prose", () => expect(parseCoachTake("Coach's take\nYes\nNext move\n- Run.\n2. Recover.")?.nextMove).toBe("Run. Recover."))
test.each(["", "Today's session is easy.", "Coach's take\nRun.", "Coach's take\nNext move"])("fallback: %s", text => expect(parseCoachTake(text)).toBeNull())
test("linear long line", () => { const start = performance.now(); expect(parseCoachTake("x".repeat(20000))).toBeNull(); expect(performance.now() - start).toBeLessThan(50) })
test("preamble survives card conversion", () => expect(parseCoachTake("Web unavailable.\n\n" + full)?.preamble).toBe("Web unavailable."))
test("CRLF", () => expect(parseCoachTake(full.replace(/\n/g, "\r\n"))?.headline).toBe("Keep one run for now."))
