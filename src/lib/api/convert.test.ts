import { describe, it, expect } from "vitest";
import { timeToSeconds, secondsToTime, weightToKg, kgToWeight, epochToIso } from "./convert";
describe("display conversions", () => {
 it.each([["5:30",330],["1:02:10",3730],["",null],["0:00",0],["59:59",3599]])("round trips %s", (text, seconds) => { expect(timeToSeconds(text as string)).toBe(seconds); expect(secondsToTime(seconds as number | null)).toBe(text); });
 it.each(["5:60", "1:99:00", "oops", "NaN", "5:3", "-1:30", "1.5:30", "99999999999999999:00"])("rejects %s", text => expect(() => timeToSeconds(text)).toThrow());
 it("normalizes hours", () => expect(secondsToTime(timeToSeconds("62:10"))).toBe("1:02:10"));
 it("round trips pounds, kg and null", () => { expect(weightToKg(180,"lbs")).toBeCloseTo(81.6466); expect(kgToWeight(weightToKg(180,"lbs"),"lbs")).toBe(180); expect(kgToWeight(81.66,"kg")).toBe(81.7); expect(weightToKg(null,"lbs")).toBeNull(); expect(kgToWeight(null,"kg")).toBeNull(); });
 it("returns ISO timestamps", () => expect(epochToIso(0)).toBe("1970-01-01T00:00:00.000Z"));
});
