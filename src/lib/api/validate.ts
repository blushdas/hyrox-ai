import type { AthleteProfile, TrainingPlan, SessionStatus, SessionBlock } from "@/lib/types";
import type { ChatMessage, Citation, WebSource } from "@/lib/coach-ai/types";
import { timeToSeconds, weightToKg } from "./convert";
export type Result<T> = { ok: true; value: T } | { ok: false; error: string };
export type MessageInput = Omit<ChatMessage, "id" | "createdAt">;
export type PlanMeta = { source: "template" | "ai" | "pdf"; templateId?: string };
const bad = (error: string): { ok: false; error: string } => ({ ok: false, error });
export const object = (v: unknown): v is Record<string, unknown> => typeof v === "object" && v !== null && !Array.isArray(v);
const str = (v: unknown, max: number): v is string => typeof v === "string" && v.length <= max;
const integer = (v: unknown, min: number, max: number): v is number => typeof v === "number" && Number.isInteger(v) && v >= min && v <= max;
const member = (v: unknown, values: readonly unknown[]) => values.includes(v);
const phases = ["foundation", "base", "build", "peak", "taper"];
const statuses = ["pending", "completed", "skipped"];
const date = (v: unknown) => typeof v === "string" && (v === "" || (/^\d{4}-\d{2}-\d{2}$/.test(v) && !Number.isNaN(Date.parse(v)) && new Date(v).toISOString().slice(0, 10) === v));
export function validateProfile(v: unknown): Result<AthleteProfile> {
 if (!object(v) || !date(v.raceDate) || !str(v.location, 120) || !member(v.category, ["open", "pro", "doubles"]) || !member(v.fitnessLevel, ["beginner_low", "beginner_mid", "beginner_high"]) || !member(v.weightUnit, ["kg", "lbs"]) || !member(v.daysPerWeek, [3,4,5]) || !member(v.sessionLength, [45,60,75,90]) || !(v.age === null || integer(v.age, 13, 100)) || !str(v.gender, 120)) return bad("Invalid profile");
 for (const key of ["fiveKTime", "tenKTime", "hyroxTime"]) {
  if (!str(v[key], 32)) return bad("Invalid race time");
  try { timeToSeconds(v[key]); } catch { return bad("Invalid race time"); }
 }
 if (!(v.weight === null || (typeof v.weight === "number" && Number.isFinite(v.weight) && v.weight > 0 && weightToKg(v.weight, v.weightUnit as "kg" | "lbs")! <= 500))) return bad("Invalid weight");
 return { ok: true, value: v as AthleteProfile };
}
function block(v: unknown): v is SessionBlock {
 if (!object(v) || !str(v.title, 1000) || !str(v.duration, 1000) || !Array.isArray(v.exercises)) return false;
 if (new TextEncoder().encode(JSON.stringify(v)).length > 20 * 1024) return false;
 return v.exercises.every(e => object(e) && str(e.exercise, 1000) && (e.sets === undefined || integer(e.sets, 0, 1000)) && (e.rpe === undefined || (typeof e.rpe === "number" && Number.isFinite(e.rpe) && e.rpe >= 0 && e.rpe <= 10)) && ["reps","duration","distance","pace","rest","notes"].every(k => e[k] === undefined || str(e[k], 20000)));
}
export function validatePlan(v: unknown): Result<TrainingPlan> {
 if (!object(v) || !str(v.id, 200) || !integer(v.totalWeeks, 1, 60) || !date(v.raceDate) || !Array.isArray(v.weeks) || v.weeks.length === 0 || v.weeks.length > 60) return bad("Invalid plan");
 const keys = new Set<string>(); const weeks = new Set<number>();
 for (const w of v.weeks) {
  if (!object(w) || !integer(w.week, 1, v.totalWeeks) || weeks.has(w.week) || !member(w.phase, phases) || !integer(w.phaseWeek, 1, 60) || !integer(w.totalPhaseWeeks, w.phaseWeek, 60) || !Array.isArray(w.sessions) || !w.sessions.length) return bad("Invalid week");
  weeks.add(w.week);
  for (const s of w.sessions) {
   if (!object(s) || !str(s.id, 200) || !s.id || keys.has(s.id) || s.week !== w.week || !integer(s.day, 1, 7) || !member(s.type, ["engine_builder","threshold","stations","race_sim","recovery","rest"]) || s.phase !== w.phase || !member(s.status, statuses) || !str(s.title, 1000) || !str(s.duration, 1000) || !str(s.coachNote, 20000) || !block(s.warmup) || !block(s.mainSet) || !block(s.cooldown)) return bad("Invalid session");
   keys.add(s.id);
  }
 }
 if (keys.size < 1 || keys.size > 400) return bad("Plan must have 1 to 400 sessions");
 return { ok: true, value: v as TrainingPlan };
}
export function validateSessionStatus(v: unknown): Result<SessionStatus> {
 return member(v, statuses) ? { ok: true, value: v as SessionStatus } : bad("Invalid session status");
}
export function validateThread(v: unknown): Result<{ title: string }> {
 if (!object(v) || (v.title !== undefined && !str(v.title, 200))) return bad("Invalid thread title");
 return { ok: true, value: { title: (v.title as string | undefined) ?? "New conversation" } };
}
function citation(v: unknown): v is Citation {
 return object(v) && str(v.id, 200) && member(v.kind, ["session","week","phase"]) && str(v.label, 1000) && str(v.href, 2000) && str(v.excerpt, 20000) && (v.sessionId === undefined || str(v.sessionId, 200)) && (v.week === undefined || integer(v.week, 1, 60));
}
function webSource(v: unknown): v is WebSource { return object(v) && str(v.title, 1000) && str(v.url, 2000) && str(v.host, 1000); }
export function validateMessage(v: unknown): Result<MessageInput> {
 if (!object(v) || !member(v.role, ["user","assistant"]) || !member(v.status, ["complete","streaming","error"]) || !str(v.content, 50000) || (v.citations !== undefined && (!Array.isArray(v.citations) || !v.citations.every(citation))) || (v.webSources !== undefined && (!Array.isArray(v.webSources) || !v.webSources.every(webSource))) || (v.webSearch !== undefined && typeof v.webSearch !== "boolean") || (v.errorMessage !== undefined && !str(v.errorMessage, 50000))) return bad("Invalid message");
 return { ok: true, value: { ...v, citations: v.citations ?? [] } as MessageInput };
}
export function validatePlanMeta(v: Record<string, unknown>): Result<PlanMeta> {
 if ((v.source !== undefined && !member(v.source, ["template","ai","pdf"])) || (v.templateId !== undefined && !str(v.templateId, 200))) return bad("Invalid plan metadata");
 return { ok: true, value: { source: (v.source ?? "template") as PlanMeta["source"], templateId: v.templateId as string | undefined } };
}
// Bound streamed bytes before decoding, including chunked requests.
export async function readBody(request: Request): Promise<Result<Record<string, unknown>>> {
 const reader = request.body?.getReader(); if (!reader) return bad("Missing JSON body");
 const chunks: Uint8Array[] = []; let size = 0;
 try {
  for (;;) {
   const { done, value } = await reader.read(); if (done) break;
   size += value.byteLength;
   if (size > 1024 * 1024) { await reader.cancel(); return bad("Body exceeds 1 MB"); }
   chunks.push(value);
  }
  const bytes = new Uint8Array(size); let offset = 0;
  for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.length; }
  const parsed: unknown = JSON.parse(new TextDecoder().decode(bytes));
  return object(parsed) ? { ok: true, value: parsed } : bad("Expected JSON object");
 } catch { return bad("Invalid JSON body"); }
 finally { reader.releaseLock(); }
}
export async function authenticated(action: (userId: string) => Promise<Response>): Promise<Response> {
 try {
  const { getSessionUserId } = await import("./session-user");
  const userId = await getSessionUserId();
  if (!userId) return Response.json({ error: "Unauthorized" }, { status: 401 });
  return await action(userId);
 } catch (error) {
  console.error("Persistence request failed", error);
  return Response.json({ error: "Internal server error" }, { status: 500 });
 }
}
export const invalid = (error: string) => Response.json({ error }, { status: 400 });
export const missing = () => Response.json({ error: "Not found" }, { status: 404 });
