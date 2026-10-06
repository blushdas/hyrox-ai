import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { generateOpenPlan } from "@/lib/mock-data"
import type { AthleteProfile, TrainingPlan } from "@/lib/types"
import {
  getAccountPlan,
  getAccountProfile,
  getSessionUserId,
  isAccountProfile,
  isTrainingPlan,
  patchAccountSession,
  postAccountPlan,
  putAccountProfile,
} from "./client"

const profile: AthleteProfile = {
  raceDate: "2027-03-01", location: "London", category: "open", fiveKTime: "28:00", tenKTime: "", hyroxTime: "",
  age: 32, gender: "Female", weight: 70, weightUnit: "kg", daysPerWeek: 4, sessionLength: 60, fitnessLevel: "beginner_mid",
}
const plan: TrainingPlan = { id: "p1", totalWeeks: 12, raceDate: "2027-03-01", weeks: generateOpenPlan("2027-03-01") }
const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } })
const fetcher = vi.fn<typeof fetch>()
beforeEach(() => {
  fetcher.mockReset()
  vi.stubGlobal("fetch", fetcher)
})
afterEach(() => vi.unstubAllGlobals())

describe("getSessionUserId", () => {
  it("returns the user id and bypasses the cache", async () => {
    fetcher.mockResolvedValue(json({ user: { id: "u1", email: "a@b.c" }, expires: "x" }))
    expect(await getSessionUserId()).toBe("u1")
    expect(fetcher).toHaveBeenCalledExactlyOnceWith("/api/auth/session", { cache: "no-store" })
  })
  it.each([null, {}, { user: {} }, { user: { id: "" } }, { user: { id: 5 } }, { user: null }, []])("returns null for body %j", async (body) => {
    fetcher.mockResolvedValue(json(body))
    expect(await getSessionUserId()).toBeNull()
  })
  it("returns null for non-JSON, non-2xx and thrown fetch", async () => {
    fetcher.mockResolvedValueOnce(new Response("<html>", { status: 200 }))
    expect(await getSessionUserId()).toBeNull()
    fetcher.mockResolvedValueOnce(json({ user: { id: "u1" } }, 500))
    expect(await getSessionUserId()).toBeNull()
    fetcher.mockRejectedValueOnce(new TypeError("offline"))
    expect(await getSessionUserId()).toBeNull()
  })
})

describe("status mapping", () => {
  it.each([[401, "unauthorized"], [404, "notFound"], [409, "quota"], [400, "invalid"], [500, "failed"], [429, "failed"], [403, "failed"]] as const)(
    "maps %i to %s",
    async (status, kind) => {
      fetcher.mockResolvedValue(json({ error: "x" }, status))
      expect(await getAccountPlan()).toEqual({ kind })
    },
  )
  it("maps a thrown fetch to failed", async () => {
    fetcher.mockRejectedValue(new TypeError("offline"))
    expect(await getAccountProfile()).toEqual({ kind: "failed" })
  })
})

describe("requests", () => {
  it("GETs the profile and accepts a null profile", async () => {
    fetcher.mockResolvedValue(json({ profile: null, onboardingCompletedAt: null }))
    expect(await getAccountProfile()).toEqual({ kind: "ok", value: { profile: null, onboardingCompletedAt: null } })
    expect(fetcher).toHaveBeenCalledWith("/api/me/profile", expect.objectContaining({ method: "GET" }))
  })
  it("PUTs the profile with the onboarding flag only when given", async () => {
    fetcher.mockResolvedValue(json({ profile, onboardingCompletedAt: 5 }))
    await putAccountProfile(profile, true)
    await putAccountProfile(profile)
    const [, first] = fetcher.mock.calls[0]
    const [url, second] = fetcher.mock.calls[1]
    expect(url).toBe("/api/me/profile")
    expect(first?.method).toBe("PUT")
    expect(first?.headers).toEqual({ "Content-Type": "application/json" })
    expect(JSON.parse(String(first?.body))).toEqual({ profile, onboardingComplete: true })
    expect(Object.keys(JSON.parse(String(second?.body)))).toEqual(["profile"])
  })
  it("POSTs the plan as a template and returns the server plan", async () => {
    fetcher.mockResolvedValue(json({ plan: { ...plan, id: "server-uuid" } }, 201))
    const result = await postAccountPlan(plan)
    expect(result.kind === "ok" && result.value.plan.id).toBe("server-uuid")
    const [url, init] = fetcher.mock.calls[0]
    expect(url).toBe("/api/me/plan")
    expect(init?.method).toBe("POST")
    expect(init?.headers).toEqual({ "Content-Type": "application/json" })
    expect(JSON.parse(String(init?.body))).toEqual({ plan, source: "template" })
  })
  it("PATCHes a session with an encoded id", async () => {
    fetcher.mockResolvedValue(json({ session: { id: "w1-d1", status: "completed", completedAt: 9 } }))
    expect((await patchAccountSession("w1/d 1", "completed")).kind).toBe("ok")
    const [url, init] = fetcher.mock.calls[0]
    expect(url).toBe("/api/me/plan/sessions/w1%2Fd%201")
    expect(init?.method).toBe("PATCH")
    expect(JSON.parse(String(init?.body))).toEqual({ status: "completed" })
  })
  it("treats malformed success bodies as failed", async () => {
    fetcher.mockResolvedValueOnce(json({ plan: { id: "x" } }))
    expect(await getAccountPlan()).toEqual({ kind: "failed" })
    fetcher.mockResolvedValueOnce(json({ profile: { raceDate: 5 }, onboardingCompletedAt: null }))
    expect(await getAccountProfile()).toEqual({ kind: "failed" })
    fetcher.mockResolvedValueOnce(new Response("nope", { status: 200 }))
    expect(await getAccountPlan()).toEqual({ kind: "failed" })
    fetcher.mockResolvedValueOnce(json({ session: { id: "w1-d1", status: "bogus" } }))
    expect(await patchAccountSession("w1-d1", "pending")).toEqual({ kind: "failed" })
  })
})

describe("runtime guards", () => {
  it("isAccountProfile requires every field with the right type", () => {
    expect(isAccountProfile({ profile, onboardingCompletedAt: 1 })).toBe(true)
    expect(isAccountProfile({ profile: { ...profile, age: undefined }, onboardingCompletedAt: 1 })).toBe(false)
    expect(isAccountProfile({ profile: { ...profile, weight: "70" }, onboardingCompletedAt: 1 })).toBe(false)
    expect(isAccountProfile({ profile, onboardingCompletedAt: "1" })).toBe(false)
    expect(isAccountProfile({ onboardingCompletedAt: null })).toBe(false)
  })
  it("isTrainingPlan rejects plans with malformed sessions", () => {
    expect(isTrainingPlan(plan)).toBe(true)
    const broken = structuredClone(plan)
    broken.weeks[0].sessions[0].status = "done" as never
    expect(isTrainingPlan(broken)).toBe(false)
    expect(isTrainingPlan({ ...plan, weeks: "x" })).toBe(false)
    expect(isTrainingPlan(null)).toBe(false)
  })
})
