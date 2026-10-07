import type { AthleteProfile, SessionStatus, TrainingPlan } from "@/lib/types"

export type AccountResult<T> =
  | { kind: "ok"; value: T }
  | { kind: "unauthorized" | "notFound" | "quota" | "invalid" | "failed" }
export type AccountProfile = { profile: AthleteProfile | null; onboardingCompletedAt: number | null }

const record = (value: unknown): value is Record<string, unknown> => !!value && typeof value === "object" && !Array.isArray(value)
const finite = (value: unknown): value is number => typeof value === "number" && Number.isFinite(value)
const text = (value: unknown): value is string => typeof value === "string"
const statuses = ["pending", "completed", "skipped"]

function isAthleteProfile(value: unknown): value is AthleteProfile {
  return record(value)
    && text(value.raceDate) && text(value.location) && text(value.category)
    && text(value.fiveKTime) && text(value.tenKTime) && text(value.hyroxTime)
    && (value.age === null || finite(value.age))
    && text(value.gender)
    && (value.weight === null || finite(value.weight))
    && text(value.weightUnit) && finite(value.daysPerWeek) && finite(value.sessionLength) && text(value.fitnessLevel)
}
export function isAccountProfile(value: unknown): value is AccountProfile {
  return record(value)
    && (value.profile === null || isAthleteProfile(value.profile))
    && (value.onboardingCompletedAt === null || finite(value.onboardingCompletedAt))
}
function isSession(value: unknown): boolean {
  return record(value) && text(value.id) && finite(value.week) && finite(value.day)
    && statuses.includes(String(value.status))
    && record(value.warmup) && record(value.mainSet) && record(value.cooldown)
}
function isWeek(value: unknown): boolean {
  return record(value) && finite(value.week) && text(value.phase) && finite(value.phaseWeek) && finite(value.totalPhaseWeeks)
    && Array.isArray(value.sessions) && value.sessions.every(isSession)
}
export function isTrainingPlan(value: unknown): value is TrainingPlan {
  return record(value) && text(value.id) && finite(value.totalWeeks) && text(value.raceDate)
    && Array.isArray(value.weeks) && value.weeks.every(isWeek)
}
const isNullablePlan = (value: unknown): value is TrainingPlan | null => value === null || isTrainingPlan(value)
const isSessionResult = (value: unknown): value is { id: string; status: SessionStatus; completedAt: number | null } =>
  record(value) && text(value.id) && statuses.includes(String(value.status))

async function request<T>(
  url: string,
  parse: (data: Record<string, unknown>) => T | undefined,
  method = "GET",
  body?: unknown,
): Promise<AccountResult<T>> {
  try {
    const init: RequestInit = { method }
    if (method === "GET") init.cache = "no-store"
    else {
      init.headers = { "Content-Type": "application/json" }
      init.body = JSON.stringify(body)
    }
    const response = await fetch(url, init)
    if (response.status === 401) return { kind: "unauthorized" }
    if (response.status === 404) return { kind: "notFound" }
    if (response.status === 409) return { kind: "quota" }
    if (response.status === 400) return { kind: "invalid" }
    if (!response.ok) return { kind: "failed" }
    const data: unknown = await response.json()
    const value = record(data) ? parse(data) : undefined
    return value === undefined ? { kind: "failed" } : { kind: "ok", value }
  } catch {
    // Transport and JSON errors are reported to the caller, never logged with profile or plan data.
    return { kind: "failed" }
  }
}

export type SessionLookup = { kind: "user"; id: string } | { kind: "signedOut" } | { kind: "failed" }

// Only a clean 200 with no user means signed out; any transport, status or shape problem is "failed".
export async function getSessionUser(): Promise<SessionLookup> {
  try {
    const response = await fetch("/api/auth/session", { cache: "no-store" })
    if (!response.ok) return { kind: "failed" }
    const data: unknown = await response.json()
    if (data === null || (record(data) && (data.user === undefined || data.user === null))) return { kind: "signedOut" }
    if (!record(data) || !record(data.user)) return { kind: "failed" }
    const id = data.user.id
    return typeof id === "string" && id !== "" ? { kind: "user", id } : { kind: "failed" }
  } catch (error) {
    console.error("Session lookup failed", error instanceof Error ? error.name : "unknown")
    return { kind: "failed" }
  }
}

const profileOf = (data: Record<string, unknown>) => (isAccountProfile(data) ? data : undefined)
export const getAccountProfile = () => request("/api/me/profile", profileOf)
export function putAccountProfile(profile: AthleteProfile, onboardingComplete?: boolean) {
  const body = onboardingComplete === undefined ? { profile } : { profile, onboardingComplete }
  return request("/api/me/profile", profileOf, "PUT", body)
}
const planOf = (data: Record<string, unknown>) => (isNullablePlan(data.plan) ? { plan: data.plan } : undefined)
export const getAccountPlan = () => request("/api/me/plan", planOf)
export function postAccountPlan(plan: TrainingPlan) {
  return request(
    "/api/me/plan",
    (data) => (isTrainingPlan(data.plan) ? { plan: data.plan } : undefined),
    "POST",
    { plan, source: "template" },
  )
}
export function patchAccountSession(id: string, status: SessionStatus) {
  return request(
    `/api/me/plan/sessions/${encodeURIComponent(id)}`,
    (data) => (isSessionResult(data.session) ? data.session : undefined),
    "PATCH",
    { status },
  )
}
