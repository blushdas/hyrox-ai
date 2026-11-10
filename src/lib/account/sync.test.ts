import { beforeEach, afterEach, describe, expect, it, vi } from "vitest"
import { generateOpenPlan } from "@/lib/mock-data"
import type { AthleteProfile, TrainingPlan } from "@/lib/types"

const mocks = vi.hoisted(() => {
  // zustand persist only exposes its API when window.localStorage exists; node has neither.
  const data = new Map<string, string>()
  const localStorage = {
    getItem: (key: string) => data.get(key) ?? null,
    setItem: (key: string, value: string) => void data.set(key, value),
    removeItem: (key: string) => void data.delete(key),
  }
  Object.defineProperty(globalThis, "window", { configurable: true, value: { localStorage } })
  return { native: vi.fn(() => false), reset: vi.fn() }
})
vi.mock("@capacitor/core", () => ({ Capacitor: { isNativePlatform: mocks.native } }))
vi.mock("@/stores/coach-ai-store", () => ({ useCoachAIStore: { getState: () => ({ reset: mocks.reset }) } }))

import { useAthleteStore } from "@/stores/athlete-store"
import { usePlanStore } from "@/stores/plan-store"
import { hydrateFromAccount, isSyncSettled, saveProfileAndPlan, saveSessionStatus, saveSkippedOnboarding, shouldRedirectToOnboarding } from "./sync"

const profile = (location: string): AthleteProfile => ({
  raceDate: "2027-03-01", location, category: "open", fiveKTime: "28:00", tenKTime: "", hyroxTime: "",
  age: 32, gender: "Female", weight: 70, weightUnit: "kg", daysPerWeek: 4, sessionLength: 60, fitnessLevel: "beginner_mid",
})
const planWith = (id: string): TrainingPlan => ({ id, totalWeeks: 12, raceDate: "2027-03-01", weeks: generateOpenPlan("2027-03-01") })
const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } })

type Routes = Record<string, () => Response | Promise<Response>>
const fetcher = vi.fn<typeof fetch>()
function route(routes: Routes) {
  fetcher.mockImplementation(async (input, init) => {
    const key = `${init?.method ?? "GET"} ${String(input)}`
    const handler = routes[key]
    if (!handler) throw new Error(`unexpected request ${key}`)
    return handler()
  })
}
const calls = () => fetcher.mock.calls.map(([url, init]) => `${init?.method ?? "GET"} ${String(url)}`)

beforeEach(() => {
  fetcher.mockReset()
  mocks.native.mockReturnValue(false)
  mocks.reset.mockClear()
  vi.stubGlobal("fetch", fetcher)
  useAthleteStore.setState({ profile: null, onboardingComplete: false, ownerUserId: null, syncStatus: "idle", sessionUserId: null })
  usePlanStore.setState({ plan: null, currentWeek: 1, ownerUserId: null })
})
afterEach(() => {
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
})

const signedIn = (id: string): Routes => ({ "GET /api/auth/session": () => json({ user: { id }, expires: "x" }) })

describe("hydrateFromAccount", () => {
  it("discards another owner's local data before applying server data, then owns it", async () => {
    useAthleteStore.setState({ profile: profile("Local"), onboardingComplete: true, ownerUserId: "alice" })
    usePlanStore.setState({ plan: planWith("local-plan"), ownerUserId: "alice" })
    const seenAtServerRead: (string | null)[] = []
    route({
      ...signedIn("bob"),
      "GET /api/me/profile": () => {
        seenAtServerRead.push(useAthleteStore.getState().profile?.location ?? null, usePlanStore.getState().plan?.id ?? null)
        return json({ profile: profile("Bob"), onboardingCompletedAt: 7 })
      },
      "GET /api/me/plan": () => json({ plan: planWith("bob-plan") }),
    })
    await hydrateFromAccount({ native: false })
    expect(seenAtServerRead).toEqual([null, null])
    expect(mocks.reset).toHaveBeenCalledOnce()
    expect(useAthleteStore.getState()).toMatchObject({ ownerUserId: "bob", onboardingComplete: true, syncStatus: "ready", sessionUserId: "bob" })
    expect(useAthleteStore.getState().profile?.location).toBe("Bob")
    expect(usePlanStore.getState()).toMatchObject({ ownerUserId: "bob" })
    expect(usePlanStore.getState().plan?.id).toBe("bob-plan")
  })

  it("treats pre-feature local data with no owner as foreign and never uploads it", async () => {
    useAthleteStore.setState({ profile: profile("Legacy"), onboardingComplete: true })
    usePlanStore.setState({ plan: planWith("legacy") })
    route({
      ...signedIn("bob"),
      "GET /api/me/profile": () => json({ profile: null, onboardingCompletedAt: null }),
      "GET /api/me/plan": () => json({ plan: null }),
    })
    await hydrateFromAccount({ native: false })
    expect(useAthleteStore.getState().profile).toBeNull()
    expect(usePlanStore.getState().plan).toBeNull()
    expect(calls().every((c) => c.startsWith("GET "))).toBe(true)
  })

  it("backfills owned profile and plan once into an empty account", async () => {
    useAthleteStore.setState({ profile: profile("Local"), onboardingComplete: true, ownerUserId: "backfill" })
    usePlanStore.setState({ plan: planWith("local"), ownerUserId: "backfill" })
    route({
      ...signedIn("backfill"),
      "GET /api/me/profile": () => json({ profile: null, onboardingCompletedAt: null }),
      "GET /api/me/plan": () => json({ plan: null }),
      "PUT /api/me/profile": () => json({ profile: profile("Local"), onboardingCompletedAt: 10 }),
      "POST /api/me/plan": () => json({ plan: planWith("server") }),
    })
    await hydrateFromAccount({ native: false })
    await hydrateFromAccount({ native: false })
    expect(calls().filter(c => c === "PUT /api/me/profile")).toHaveLength(1)
    expect(calls().filter(c => c === "POST /api/me/plan")).toHaveLength(1)
    expect(fetcher.mock.calls.find(([, init]) => init?.method === "PUT")?.[1]?.headers).toMatchObject({ "If-None-Match": "*" })
    expect(useAthleteStore.getState()).toMatchObject({ onboardingComplete: true, syncStatus: "ready" })
    expect(usePlanStore.getState().plan?.id).toBe("server")
  })

  it("hydrates a skipped account without a profile or a plan", async () => {
    route({ ...signedIn("skip"), "GET /api/me/profile": () => json({ profile: null, onboardingCompletedAt: 12 }), "GET /api/me/plan": () => json({ plan: null }) })
    await hydrateFromAccount({ native: false })
    expect(useAthleteStore.getState()).toMatchObject({ profile: null, onboardingComplete: true, ownerUserId: "skip", syncStatus: "ready" })
    expect(shouldRedirectToOnboarding(true, "ready", null, useAthleteStore.getState().onboardingComplete)).toBe(false)
  })

  it("never backfills over an existing account profile", async () => {
    useAthleteStore.setState({ profile: profile("Local"), ownerUserId: "existing" })
    usePlanStore.setState({ plan: planWith("local"), ownerUserId: "existing" })
    route({ ...signedIn("existing"), "GET /api/me/profile": () => json({ profile: profile("Remote"), onboardingCompletedAt: 1 }), "GET /api/me/plan": () => json({ plan: null }) })
    await hydrateFromAccount({ native: false })
    expect(calls().every(c => c.startsWith("GET"))).toBe(true)
    expect(useAthleteStore.getState().profile?.location).toBe("Remote")
  })

  it("server data replaces same-owner local data", async () => {
    useAthleteStore.setState({ profile: profile("Stale"), ownerUserId: "bob" })
    usePlanStore.setState({ plan: planWith("stale"), ownerUserId: "bob" })
    route({
      ...signedIn("bob"),
      "GET /api/me/profile": () => json({ profile: profile("Fresh"), onboardingCompletedAt: null }),
      "GET /api/me/plan": () => json({ plan: planWith("fresh") }),
    })
    await hydrateFromAccount({ native: false })
    expect(useAthleteStore.getState().profile?.location).toBe("Fresh")
    expect(useAthleteStore.getState().onboardingComplete).toBe(false)
    expect(usePlanStore.getState().plan?.id).toBe("fresh")
    expect(mocks.reset).not.toHaveBeenCalled()
  })

  it("leaves local data untouched when signed out", async () => {
    useAthleteStore.setState({ profile: profile("Local"), ownerUserId: "alice" })
    usePlanStore.setState({ plan: planWith("local"), ownerUserId: "alice" })
    route({ "GET /api/auth/session": () => json(null) })
    await hydrateFromAccount({ native: false })
    expect(useAthleteStore.getState()).toMatchObject({ syncStatus: "signedOut", sessionUserId: null, ownerUserId: "alice" })
    expect(useAthleteStore.getState().profile?.location).toBe("Local")
    expect(usePlanStore.getState().plan?.id).toBe("local")
    expect(calls()).toEqual(["GET /api/auth/session"])
  })

  it.each([
    ["5xx", () => json({}, 500)],
    ["network error", () => Promise.reject(new TypeError("offline"))],
  ] as const)("hides owned local data and pushes nothing when the session lookup fails: %s", async (_, failing) => {
    vi.spyOn(console, "error").mockImplementation(() => undefined)
    useAthleteStore.setState({ profile: profile("Alice"), onboardingComplete: true, ownerUserId: "alice", sessionUserId: "alice" })
    usePlanStore.setState({ plan: planWith("alice-plan"), ownerUserId: "alice" })
    route({ "GET /api/auth/session": failing })
    await hydrateFromAccount({ native: false })
    expect(useAthleteStore.getState()).toMatchObject({ syncStatus: "error", sessionUserId: null, profile: null, ownerUserId: null })
    expect(usePlanStore.getState().plan).toBeNull()
    expect(mocks.reset).toHaveBeenCalledOnce()
    expect(calls()).toEqual(["GET /api/auth/session"])
    expect(await saveProfileAndPlan(profile("X"), planWith("x"), {})).toBe("failed")
    expect(calls()).toEqual(["GET /api/auth/session"])
  })

  it("on a failed session lookup keeps unowned local data but still errors", async () => {
    vi.spyOn(console, "error").mockImplementation(() => undefined)
    useAthleteStore.setState({ profile: profile("Draft") })
    usePlanStore.setState({ plan: planWith("draft") })
    route({ "GET /api/auth/session": () => json({}, 502) })
    await hydrateFromAccount({ native: false })
    expect(useAthleteStore.getState().syncStatus).toBe("error")
    expect(usePlanStore.getState().plan?.id).toBe("draft")
  })

  it("settles to error when hydrate throws unexpectedly", async () => {
    vi.spyOn(console, "error").mockImplementation(() => undefined)
    route({
      ...signedIn("bob"),
      "GET /api/me/profile": () => json({ profile: profile("Bob"), onboardingCompletedAt: 1 }),
      "GET /api/me/plan": () => json({ plan: planWith("p") }),
    })
    const original = usePlanStore.getState().setPlan
    usePlanStore.setState({ setPlan: () => { throw new RangeError("boom") } })
    try {
      await hydrateFromAccount({ native: false })
    } finally {
      usePlanStore.setState({ setPlan: original })
    }
    expect(useAthleteStore.getState().syncStatus).toBe("error")
  })

  it("issues zero requests on native", async () => {
    useAthleteStore.setState({ profile: profile("Local") })
    await hydrateFromAccount({ native: true })
    expect(fetcher).not.toHaveBeenCalled()
    expect(useAthleteStore.getState().syncStatus).toBe("ready")
    expect(useAthleteStore.getState().profile?.location).toBe("Local")
  })

  it("marks loading synchronously before any await", () => {
    route({ "GET /api/auth/session": () => new Promise<Response>(() => undefined) })
    void hydrateFromAccount({ native: false })
    expect(useAthleteStore.getState().syncStatus).toBe("loading")
  })

  it.each([
    ["malformed profile", { "GET /api/me/profile": () => json({ profile: { raceDate: 1 }, onboardingCompletedAt: null }), "GET /api/me/plan": () => json({ plan: null }) }],
    ["malformed plan", { "GET /api/me/profile": () => json({ profile: profile("S"), onboardingCompletedAt: 1 }), "GET /api/me/plan": () => json({ plan: { id: 1 } }) }],
    ["server error", { "GET /api/me/profile": () => json({}, 500), "GET /api/me/plan": () => json({ plan: null }) }],
  ] as const)("ends in error with same-owner local data kept: %s", async (_, routes) => {
    useAthleteStore.setState({ profile: profile("Local"), ownerUserId: "bob" })
    usePlanStore.setState({ plan: planWith("local"), ownerUserId: "bob" })
    route({ ...signedIn("bob"), ...routes })
    await hydrateFromAccount({ native: false })
    expect(useAthleteStore.getState().syncStatus).toBe("error")
    expect(useAthleteStore.getState().profile?.location).toBe("Local")
    expect(usePlanStore.getState().plan?.id).toBe("local")
  })

  it("a stale overlapping run never applies its results", async () => {
    const sessionGates: ((r: Response) => void)[] = []
    let sessionCalls = 0
    fetcher.mockImplementation(async (input) => {
      const url = String(input)
      if (url === "/api/auth/session") {
        sessionCalls += 1
        return new Promise<Response>((resolve) => sessionGates.push(resolve))
      }
      if (url === "/api/me/profile") return json({ profile: profile(`run${sessionCalls}`), onboardingCompletedAt: 1 })
      return json({ plan: planWith(`plan${sessionCalls}`) })
    })
    const first = hydrateFromAccount({ native: false })
    const second = hydrateFromAccount({ native: false })
    sessionGates[1](json({ user: { id: "bob" } }))
    await second
    sessionGates[0](json({ user: { id: "alice" } }))
    await first
    expect(useAthleteStore.getState()).toMatchObject({ ownerUserId: "bob", sessionUserId: "bob", syncStatus: "ready" })
    expect(useAthleteStore.getState().profile?.location).toBe("run2")
    expect(calls().filter((c) => c === "GET /api/me/profile")).toHaveLength(1)
  })
})

describe("saveProfileAndPlan", () => {
  const local = planWith("plan-123")
  beforeEach(() => {
    useAthleteStore.setState({ sessionUserId: "bob", profile: profile("Mine") })
    usePlanStore.setState({ plan: local })
  })

  it("PUTs the profile then POSTs the plan, adopts the server id and owns the data", async () => {
    route({
      "PUT /api/me/profile": () => json({ profile: profile("Mine"), onboardingCompletedAt: 1 }),
      "POST /api/me/plan": () => json({ plan: { ...local, id: "server-uuid" } }, 201),
    })
    expect(await saveProfileAndPlan(profile("Mine"), local, { onboardingComplete: true })).toBe("saved")
    expect(calls()).toEqual(["PUT /api/me/profile", "POST /api/me/plan"])
    const [[, put], [, post]] = fetcher.mock.calls
    expect(put?.headers).toEqual({ "Content-Type": "application/json" })
    expect(JSON.parse(String(put?.body))).toEqual({ profile: profile("Mine"), onboardingComplete: true })
    expect(JSON.parse(String(post?.body))).toEqual({ plan: local, source: "template" })
    expect(usePlanStore.getState().plan?.id).toBe("server-uuid")
    expect(usePlanStore.getState().plan?.weeks).toEqual(local.weeks)
    expect(useAthleteStore.getState().ownerUserId).toBe("bob")
    expect(usePlanStore.getState().ownerUserId).toBe("bob")
  })

  it("omits the onboarding flag when not requested", async () => {
    route({
      "PUT /api/me/profile": () => json({ profile: profile("Mine"), onboardingCompletedAt: 1 }),
      "POST /api/me/plan": () => json({ plan: local }, 201),
    })
    await saveProfileAndPlan(profile("Mine"), local, {})
    expect(Object.keys(JSON.parse(String(fetcher.mock.calls[0][1]?.body)))).toEqual(["profile"])
  })

  it("on quota adopts the server's active plan and reports quota", async () => {
    route({
      "PUT /api/me/profile": () => json({ profile: profile("Mine"), onboardingCompletedAt: 1 }),
      "POST /api/me/plan": () => json({ error: "Quota exceeded" }, 409),
      "GET /api/me/plan": () => json({ plan: planWith("server-active") }),
    })
    expect(await saveProfileAndPlan(profile("Mine"), local, {})).toBe("quota")
    expect(calls()).toEqual(["PUT /api/me/profile", "POST /api/me/plan", "GET /api/me/plan"])
    expect(usePlanStore.getState().plan?.id).toBe("server-active")
  })

  it("keeps the local plan on quota when the server has no active plan", async () => {
    route({
      "PUT /api/me/profile": () => json({ profile: profile("Mine"), onboardingCompletedAt: 1 }),
      "POST /api/me/plan": () => json({ error: "Quota exceeded" }, 409),
      "GET /api/me/plan": () => json({ plan: null }),
    })
    expect(await saveProfileAndPlan(profile("Mine"), local, {})).toBe("quota")
    expect(usePlanStore.getState().plan?.id).toBe("plan-123")
  })

  it("returns failed, not quota, when the quota follow-up read fails", async () => {
    route({
      "PUT /api/me/profile": () => json({ profile: profile("Mine"), onboardingCompletedAt: 1 }),
      "POST /api/me/plan": () => json({ error: "Quota exceeded" }, 409),
      "GET /api/me/plan": () => json({}, 500),
    })
    expect(await saveProfileAndPlan(profile("Mine"), local, {})).toBe("failed")
    expect(usePlanStore.getState().plan?.id).toBe("plan-123")
  })

  it("does not patch the server id onto a newer plan when saves race", async () => {
    const newer = planWith("plan-456")
    let release: (r: Response) => void = () => undefined
    route({
      "PUT /api/me/profile": () => json({ profile: profile("Mine"), onboardingCompletedAt: 1 }),
      "POST /api/me/plan": () => new Promise<Response>((resolve) => { release = resolve }),
    })
    const first = saveProfileAndPlan(profile("Mine"), local, {})
    await vi.waitFor(() => expect(calls()).toContain("POST /api/me/plan"))
    usePlanStore.setState({ plan: newer })
    release(json({ plan: { ...local, id: "server-first" } }, 201))
    expect(await first).toBe("saved")
    expect(usePlanStore.getState().plan?.id).toBe("plan-456")
  })

  it.each([500, 401, 429])("returns failed on a %i from the profile PUT and posts nothing", async (status) => {
    route({ "PUT /api/me/profile": () => json({ error: "x" }, status) })
    expect(await saveProfileAndPlan(profile("Mine"), local, {})).toBe("failed")
    expect(calls()).toEqual(["PUT /api/me/profile"])
    expect(usePlanStore.getState().plan?.id).toBe("plan-123")
    expect(usePlanStore.getState().ownerUserId).toBeNull()
  })

  it.each([500, 401, 429])("returns failed on a %i from the plan POST with local kept", async (status) => {
    route({
      "PUT /api/me/profile": () => json({ profile: profile("Mine"), onboardingCompletedAt: 1 }),
      "POST /api/me/plan": () => json({ error: "x" }, status),
    })
    expect(await saveProfileAndPlan(profile("Mine"), local, {})).toBe("failed")
    expect(usePlanStore.getState().plan?.id).toBe("plan-123")
    expect(usePlanStore.getState().ownerUserId).toBeNull()
  })

  it("returns failed on a network error", async () => {
    fetcher.mockRejectedValue(new TypeError("offline"))
    expect(await saveProfileAndPlan(profile("Mine"), local, {})).toBe("failed")
    expect(usePlanStore.getState().plan?.id).toBe("plan-123")
  })

  it("returns failed without fetching when no session user is known", async () => {
    useAthleteStore.setState({ sessionUserId: null })
    expect(await saveProfileAndPlan(profile("Mine"), local, {})).toBe("failed")
    expect(fetcher).not.toHaveBeenCalled()
  })

  it("skips on native without fetching", async () => {
    mocks.native.mockReturnValue(true)
    expect(await saveProfileAndPlan(profile("Mine"), local, {})).toBe("skipped")
    expect(fetcher).not.toHaveBeenCalled()
  })
})

describe("saveSessionStatus", () => {
  beforeEach(() => useAthleteStore.setState({ sessionUserId: "bob" }))

  it("PATCHes the encoded session url with the status body", async () => {
    route({ "PATCH /api/me/plan/sessions/w1-d1": () => json({ session: { id: "w1-d1", status: "skipped", completedAt: null } }) })
    expect(await saveSessionStatus("w1-d1", "skipped")).toBe(true)
    const [url, init] = fetcher.mock.calls[0]
    expect(url).toBe("/api/me/plan/sessions/w1-d1")
    expect(init?.headers).toEqual({ "Content-Type": "application/json" })
    expect(JSON.parse(String(init?.body))).toEqual({ status: "skipped" })
  })

  it("encodes ids that need it", async () => {
    route({ "PATCH /api/me/plan/sessions/a%2Fb": () => json({ session: { id: "a/b", status: "pending", completedAt: null } }) })
    expect(await saveSessionStatus("a/b", "pending")).toBe(true)
  })

  it.each([404, 500, 429, 401])("returns false on %i", async (status) => {
    route({ "PATCH /api/me/plan/sessions/w1-d1": () => json({ error: "x" }, status) })
    expect(await saveSessionStatus("w1-d1", "completed")).toBe(false)
  })

  it("returns false on network failure and without a session user, never throwing", async () => {
    fetcher.mockRejectedValue(new TypeError("offline"))
    expect(await saveSessionStatus("w1-d1", "completed")).toBe(false)
    fetcher.mockClear()
    useAthleteStore.setState({ sessionUserId: null })
    expect(await saveSessionStatus("w1-d1", "completed")).toBe(false)
    expect(fetcher).not.toHaveBeenCalled()
  })

  it("is a no-op success on native", async () => {
    mocks.native.mockReturnValue(true)
    expect(await saveSessionStatus("w1-d1", "completed")).toBe(true)
    expect(fetcher).not.toHaveBeenCalled()
  })
})

describe("redirect rules", () => {
  it("settles only on ready, signedOut and error", () => {
    expect(["idle", "loading", "ready", "signedOut", "error"].map((s) => isSyncSettled(s as never))).toEqual([false, false, true, true, true])
  })
  it("redirects only when hydrated, settled and plan-less", () => {
    const plan = planWith("p")
    for (const hydrated of [true, false]) {
      for (const status of ["idle", "loading", "ready", "signedOut", "error"] as const) {
        for (const p of [plan, null]) {
          for (const completed of [true, false]) {
            const expected = hydrated && ["ready", "signedOut"].includes(status) && p === null && !completed
            expect(shouldRedirectToOnboarding(hydrated, status, p, completed)).toBe(expected)
          }
        }
      }
    }
  })
  it("never redirects on error, so a failed lookup shows retry instead of onboarding", () => {
    expect(shouldRedirectToOnboarding(true, "error", null)).toBe(false)
  })
  it("never redirects while idle even though hydration finished", () => {
    expect(shouldRedirectToOnboarding(true, "idle", null)).toBe(false)
  })
})

describe("store ownership", () => {
  it("clearProfile and clearPlan drop the owner but clearProfile keeps the session user", () => {
    useAthleteStore.setState({ ownerUserId: "bob", sessionUserId: "bob" })
    usePlanStore.setState({ ownerUserId: "bob" })
    useAthleteStore.getState().clearProfile()
    usePlanStore.getState().clearPlan()
    expect(useAthleteStore.getState().ownerUserId).toBeNull()
    expect(useAthleteStore.getState().sessionUserId).toBe("bob")
    expect(usePlanStore.getState().ownerUserId).toBeNull()
  })
})

describe("saveSkippedOnboarding", () => {
  it("deduplicates double taps and persists completion before resolving", async () => {
    useAthleteStore.setState({ sessionUserId: "skip-save" })
    route({ "PUT /api/me/profile": () => json({ profile: null, onboardingCompletedAt: 1 }) })
    const first = saveSkippedOnboarding()
    expect(saveSkippedOnboarding()).toBe(first)
    expect(await first).toBe("saved")
    expect(calls()).toEqual(["PUT /api/me/profile"])
    expect(JSON.parse(String(fetcher.mock.calls[0][1]?.body))).toEqual({ skipOnboarding: true })
    expect(useAthleteStore.getState()).toMatchObject({ onboardingComplete: true, ownerUserId: "skip-save", profile: null })
  })
  it("failed skip leaves completion false and allows retry", async () => {
    useAthleteStore.setState({ sessionUserId: "skip-fail" })
    route({ "PUT /api/me/profile": () => json({}, 500) })
    expect(await saveSkippedOnboarding()).toBe("failed")
    expect(useAthleteStore.getState().onboardingComplete).toBe(false)
    route({ "PUT /api/me/profile": () => json({ profile: null, onboardingCompletedAt: 1 }) })
    expect(await saveSkippedOnboarding()).toBe("saved")
  })
  it("does not apply a delayed skip response after the account changes", async () => {
    useAthleteStore.setState({ sessionUserId: "alice" })
    let release!: (r: Response) => void
    route({ "PUT /api/me/profile": () => new Promise(resolve => { release = resolve }) })
    const pending = saveSkippedOnboarding()
    useAthleteStore.setState({ sessionUserId: "bob" })
    release(json({ profile: profile("Alice"), onboardingCompletedAt: 1 }))
    expect(await pending).toBe("failed")
    expect(useAthleteStore.getState()).toMatchObject({ profile: null, onboardingComplete: false })
  })
})

it("overlapping hydration shares one backfill without leaving loading or applying stale data", async () => {
 useAthleteStore.setState({ profile: profile("Local"), onboardingComplete: true, ownerUserId: "overlap" })
 usePlanStore.setState({ plan: planWith("local"), ownerUserId: "overlap" })
 let release!: (value: Response) => void
 route({ ...signedIn("overlap"),
  "GET /api/me/profile": () => json({ profile: null, onboardingCompletedAt: null }),
  "GET /api/me/plan": () => json({ plan: null }),
  "PUT /api/me/profile": () => new Promise(resolve => { release = resolve }),
  "POST /api/me/plan": () => json({ plan: planWith("saved") }),
 })
 const first = hydrateFromAccount({ native: false })
 await vi.waitFor(() => expect(calls()).toContain("PUT /api/me/profile"))
 const second = hydrateFromAccount({ native: false })
 release(json({ profile: profile("Local"), onboardingCompletedAt: 1 }))
 await Promise.all([first, second])
 expect(calls().filter(c => c === "PUT /api/me/profile")).toHaveLength(1)
 expect(calls().filter(c => c === "POST /api/me/plan")).toHaveLength(1)
 expect(useAthleteStore.getState().syncStatus).toBe("ready")
 expect(usePlanStore.getState().plan?.id).toBe("saved")
})

it("backfill loses a concurrent profile claim without posting a stale plan", async () => {
 useAthleteStore.setState({ profile: profile("Local"), ownerUserId: "racing" })
 usePlanStore.setState({ plan: planWith("local"), ownerUserId: "racing" })
 let reads = 0
 route({ ...signedIn("racing"),
  "GET /api/me/profile": () => json(++reads === 1 ? { profile: null, onboardingCompletedAt: null } : { profile: profile("Remote"), onboardingCompletedAt: 1 }),
  "GET /api/me/plan": () => json({ plan: null }),
  "PUT /api/me/profile": () => json({ error: "Profile already exists" }, 412),
 })
 await hydrateFromAccount({ native: false })
 expect(useAthleteStore.getState().profile?.location).toBe("Remote")
 expect(calls()).not.toContain("POST /api/me/plan")
})
