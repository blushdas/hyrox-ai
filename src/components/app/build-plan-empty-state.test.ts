import React from "react"
import { renderToStaticMarkup } from "react-dom/server"
import { beforeEach, afterEach, describe, expect, it, vi } from "vitest"
import type { SyncStatus } from "@/stores/athlete-store"

const state = vi.hoisted(() => ({ completed: true, status: "ready" as SyncStatus }))
vi.mock("react", async original => ({ ...await original<typeof import("react")>(), use: () => ({ id: "missing-session" }) }))
vi.mock("next/navigation", () => ({ useRouter: () => ({ push: vi.fn(), back: vi.fn() }), useSearchParams: () => new URLSearchParams() }))
vi.mock("@/stores/athlete-store", () => ({ useAthleteStore: (selector: (s: { onboardingComplete: boolean; syncStatus: SyncStatus; profile: null }) => unknown) => {
  const value = { onboardingComplete: state.completed, syncStatus: state.status, profile: null }
  return selector ? selector(value) : value
} }))
vi.mock("@/stores/plan-store", () => ({ usePlanStore: () => ({ plan: null, currentWeek: 1, setCurrentWeek: vi.fn(), updateSessionStatus: vi.fn() }) }))
vi.mock("@/stores/coach-ai-store", () => ({ useCoachAIStore: () => ({ messages: [] }) }))
import PlanPage from "@/app/(app)/plan/page"
import CoachPage from "@/app/(app)/coach-ai/page"
import SessionDetailPage from "@/app/(app)/session/[id]/session-detail"
import DashboardPage from "@/app/(app)/dashboard/page"
const pages = [
  ["Plan", () => React.createElement(PlanPage)],
  ["Coach AI", () => React.createElement(CoachPage)],
  ["Session", () => React.createElement(SessionDetailPage, { params: Promise.resolve({ id: "missing-session" }) })],
  ["Train", () => React.createElement(DashboardPage)],
] as const
beforeEach(() => { state.completed = true; state.status = "ready"; vi.stubGlobal("React", React) })
afterEach(() => vi.unstubAllGlobals())
describe.each(pages)("%s without a plan", (title, page) => {
  it.each(["ready", "signedOut"] as const)("shows the shared plan-building link when completed and %s", status => {
    state.status = status
    const html = renderToStaticMarkup(page())
    expect(html).toContain(`>${title}</h1>`)
    expect(html).toContain('>Build my plan</h2>')
    expect(html).toContain('href="/onboarding?redo=1"')
    expect(html).not.toContain('role="status"')
  })
  it.each(["idle", "loading", "error"] as const)("keeps the skeleton while sync is %s", status => {
    state.status = status
    const html = renderToStaticMarkup(page())
    expect(html).toContain('role="status"')
    expect(html).not.toContain('>Build my plan</h2>')
  })
  it("does not show the completed-account empty state for an incomplete account", () => {
    state.completed = false
    const html = renderToStaticMarkup(page())
    expect(html).toContain('role="status"')
    expect(html).not.toContain('href="/onboarding?redo=1"')
  })
})
