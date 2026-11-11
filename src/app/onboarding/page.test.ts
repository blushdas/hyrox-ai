import React from "react"
import { beforeEach, afterEach, expect, it, vi } from "vitest"
import type { ReactElement } from "react"

const mocks = vi.hoisted(() => ({
  stateIndex: 0, step: 1, redo: false, completed: false, status: "ready", effects: [] as (() => void)[],
  push: vi.fn(), replace: vi.fn(), skip: vi.fn(), save: vi.fn(), generate: vi.fn(), setProfile: vi.fn(), complete: vi.fn(),
}))
vi.mock("react", async original => ({ ...await original<typeof import("react")>(),
  useState: (initial: unknown) => {
    const values = [mocks.redo, false, mocks.step, undefined, false, 0, undefined]
    const index = mocks.stateIndex++
    return [values[index] === undefined ? (typeof initial === "function" ? initial() : initial) : values[index], vi.fn()]
  },
  useEffect: (effect: () => void) => { mocks.effects.push(effect) },
  useRef: (current: unknown) => ({ current }),
}))
vi.mock("next/navigation", () => ({ useRouter: () => ({ push: mocks.push, replace: mocks.replace }) }))
vi.mock("@/stores/athlete-store", () => ({ useAthleteStore: (selector?: (s: unknown) => unknown) => {
  const state = { setProfile: mocks.setProfile, setOnboardingComplete: mocks.complete, onboardingComplete: mocks.completed, syncStatus: mocks.status }
  return selector ? selector(state) : state
} }))
vi.mock("@/hooks/use-plan-generator", () => ({ usePlanGenerator: () => ({ generatePlan: mocks.generate }) }))
vi.mock("@/lib/account/sync", async original => ({ ...await original<typeof import("@/lib/account/sync")>(), saveSkippedOnboarding: mocks.skip, saveProfileAndPlan: mocks.save }))
vi.mock("framer-motion", () => ({ motion: { div: "div" }, useReducedMotion: () => true }))
import OnboardingPage from "./page"
import { Skeleton } from "@/components/shell/primitives"
function find(node: unknown, predicate: (element: ReactElement<Record<string, unknown>>) => boolean): ReactElement<Record<string, unknown>> | undefined {
  if (Array.isArray(node)) { for (const child of node) { const found = find(child, predicate); if (found) return found } return }
  if (!React.isValidElement<Record<string, unknown>>(node)) return
  if (predicate(node)) return node
  return find(node.props.children, predicate)
}
beforeEach(() => {
  vi.clearAllMocks(); vi.stubGlobal("React", React)
  mocks.stateIndex = 0; mocks.step = 1; mocks.redo = false; mocks.completed = false; mocks.status = "ready"; mocks.effects = []
  mocks.skip.mockResolvedValue("saved")
})
afterEach(() => vi.unstubAllGlobals())
it("completed accounts render only a skeleton and replace onboarding after sync", () => {
  mocks.completed = true
  const tree = OnboardingPage()
  expect(tree.type).toBe(Skeleton)
  mocks.effects[1]()
  expect(mocks.replace).toHaveBeenCalledWith("/dashboard")
})
it("waits for account sync without flashing step one", () => {
  mocks.status = "loading"
  expect(OnboardingPage().type).toBe(Skeleton)
  mocks.effects[1]()
  expect(mocks.replace).not.toHaveBeenCalled()
})
it("explicit redo renders the form for a completed account", () => {
  mocks.redo = true; mocks.completed = true
  expect(OnboardingPage().type).not.toBe(Skeleton)
  mocks.effects[1]()
  expect(mocks.replace).not.toHaveBeenCalled()
})
it.each([1, 2, 3, 4, 5])("step %i offers Skip and prevents duplicate saves before navigating", async step => {
  mocks.step = step
  let resolve!: (value: string) => void
  mocks.skip.mockImplementation(() => new Promise(done => { resolve = done }))
  const tree = OnboardingPage()
  const button = find(tree, element => element.props.children === "Skip for now")!
  expect(button).toBeDefined()
  const click = button.props.onClick as () => Promise<void>
  const first = click(); await click()
  expect(mocks.skip).toHaveBeenCalledOnce()
  expect(mocks.replace).not.toHaveBeenCalled()
  resolve("saved"); await first
  expect(mocks.replace).toHaveBeenCalledWith("/dashboard")
})

it("redo completion generates and saves a normal profile and plan", async () => {
  mocks.redo = true; mocks.completed = true; mocks.step = 5
  const plan = { id: "new-plan" }; mocks.generate.mockReturnValue(plan); mocks.save.mockResolvedValue("saved")
  const tree = OnboardingPage()
  const button = find(tree, element => element.props.children === "Build My Plan")!
  await (button.props.onClick as () => Promise<void>)()
  expect(mocks.generate).toHaveBeenCalledOnce()
  expect(mocks.save).toHaveBeenCalledWith(expect.objectContaining({ fitnessLevel: "beginner_mid" }), plan, { onboardingComplete: true })
  expect(mocks.complete).not.toHaveBeenCalled()
})

it("account-fetch error offers the exact Try again action", () => {
 mocks.status = "error"
 expect(find(OnboardingPage(), element => element.props.children === "Try again")).toBeDefined()
})
