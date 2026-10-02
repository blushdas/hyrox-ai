import { describe, it, expect } from "vitest";
import { profile, plan } from "./test-d1";
import { generateBeginnerPlan, generateOpenPlan, generateProPlan } from "@/lib/mock-data";
import { validateProfile, validatePlan, validateSessionStatus, validateThread, validateMessage, validatePlanMeta, readBody } from "./validate";
describe("request validators", () => {
 it("accepts all current generated templates", () => {
  for (const generate of [generateBeginnerPlan, generateOpenPlan, generateProPlan]) {
   expect(validatePlan({ id: "generated", totalWeeks: 12, raceDate: profile.raceDate, weeks: generate(profile.raceDate) })).toMatchObject({ ok: true });
  }
 });
 it("accepts existing shapes", () => { expect(validateProfile(profile).ok).toBe(true); expect(validatePlan(plan).ok).toBe(true); });
 it.each([{ age: 12 }, { age: 101 }, { weight: 0 }, { weight: Infinity }, { weight: 2000 }, { raceDate: "2026-02-30" }, { raceDate: "2026-1-01" }, { location: "x".repeat(121) }, { fiveKTime: "bad" }, { weightUnit: "stone" }, { daysPerWeek: 7 }, { category: "other" }, { fitnessLevel: "elite" }, { sessionLength: 50 }])("rejects invalid profile %j", patch => expect(validateProfile({ ...profile, ...patch }).ok).toBe(false));
 it("accepts nullable and empty profile values", () => expect(validateProfile({ ...profile, raceDate: "", age: null, weight: null, fiveKTime: "" }).ok).toBe(true));
 it("rejects duplicate sessions and invalid blocks", () => {
  const p = structuredClone(plan); p.weeks[0].sessions.push(p.weeks[0].sessions[0]); expect(validatePlan(p).ok).toBe(false);
  const large = structuredClone(plan); large.weeks[0].sessions[0].mainSet.exercises[0].notes = "界".repeat(7000); expect(validatePlan(large).ok).toBe(false);
  const invalid = structuredClone(plan); invalid.weeks[0].sessions[0].day = 8; expect(validatePlan(invalid).ok).toBe(false);
 });
 it("enforces session count and enum bounds", () => {
  for (const key of ["type", "phase", "status"]) { const p = structuredClone(plan); Object.assign(p.weeks[0].sessions[0], { [key]: "invalid" }); expect(validatePlan(p).ok).toBe(false); }
  const p = structuredClone(plan); p.weeks[0].sessions = []; expect(validatePlan(p).ok).toBe(false);
  p.weeks[0].sessions = Array.from({ length: 401 }, (_, i) => ({ ...plan.weeks[0].sessions[0], id: String(i) })); expect(validatePlan(p).ok).toBe(false);
 });
 it("validates status, title, metadata and messages", () => {
  expect(validateSessionStatus("completed").ok).toBe(true); expect(validateSessionStatus("other").ok).toBe(false);
  expect(validateThread({}).ok).toBe(true); expect(validateThread({ title: 2 }).ok).toBe(false);
  expect(validatePlanMeta({ source: "evil" }).ok).toBe(false);
  const m = { role: "user", content: "Hi", status: "complete" };
  expect(validateMessage(m)).toEqual({ ok: true, value: { ...m, citations: [] } });
  for (const patch of [{ role: "system" }, { status: "pending" }, { citations: [null] }, { webSources: [3] }, { content: "x".repeat(50001) }, { webSearch: "true" }]) expect(validateMessage({ ...m, ...patch }).ok).toBe(false);
 });
 it("bounds actual bytes and malformed JSON", async () => {
  const req = (body: string) => new Request("http://localhost", { method: "POST", body });
  expect((await readBody(req('{}'))).ok).toBe(true);
  expect((await readBody(req('oops'))).ok).toBe(false);
  expect((await readBody(req('[]'))).ok).toBe(false);
  expect((await readBody(req(JSON.stringify({ content: "界".repeat(400000) })))).ok).toBe(false);
 });
});
