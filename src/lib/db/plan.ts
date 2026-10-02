import { getDb } from "@/lib/api/db-client";
import type { PlanMeta } from "@/lib/api/validate";
import type { TrainingPlan, Session, SessionStatus, WeekPlan } from "@/lib/types";
type PlanRow = { id: string; total_weeks: number; race_date: string };
type SessionRow = {
 session_key: string; week: number; day: number; type: Session["type"]; phase: Session["phase"];
 title: string; duration: string; warmup: string; main_set: string; cooldown: string; coach_note: string;
 status: SessionStatus; phase_week: number; total_phase_weeks: number;
};
export async function createPlan(userId: string, plan: TrainingPlan, meta: PlanMeta = { source: "template" }): Promise<TrainingPlan> {
 const db = await getDb(); const id = crypto.randomUUID(); const now = Date.now();
 const statements = [
  db.prepare("UPDATE training_plans SET status = 'archived' WHERE user_id = ? AND status = 'active'").bind(userId),
  db.prepare("INSERT INTO training_plans (id, user_id, status, source, template_id, total_weeks, race_date, start_date, created_at) VALUES (?, ?, 'active', ?, ?, ?, ?, NULL, ?)").bind(id, userId, meta.source, meta.templateId ?? null, plan.totalWeeks, plan.raceDate, now),
 ];
 for (const week of plan.weeks) for (const s of week.sessions) {
  statements.push(db.prepare(`INSERT INTO plan_sessions (id, plan_id, user_id, session_key, week, day, type, phase, title, duration, warmup, main_set, cooldown, coach_note, status, completed_at, phase_week, total_phase_weeks)
   VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`).bind(crypto.randomUUID(), id, userId, s.id, s.week, s.day, s.type, s.phase, s.title, s.duration, JSON.stringify(s.warmup), JSON.stringify(s.mainSet), JSON.stringify(s.cooldown), s.coachNote, s.status, s.status === "completed" ? now : null, week.phaseWeek, week.totalPhaseWeeks));
 }
 await db.batch(statements);
 return { ...plan, id };
}
export async function getActivePlan(userId: string): Promise<TrainingPlan | null> {
 const db = await getDb();
 const plan = await db.prepare("SELECT * FROM training_plans WHERE user_id = ? AND status = 'active'").bind(userId).first<PlanRow>();
 if (!plan) return null;
 const { results } = await db.prepare("SELECT * FROM plan_sessions WHERE user_id = ? AND plan_id = ? ORDER BY week, day, rowid").bind(userId, plan.id).all<SessionRow>();
 const weeks = new Map<number, WeekPlan>();
 for (const row of results) {
  let week = weeks.get(row.week);
  if (!week) { week = { week: row.week, phase: row.phase, phaseWeek: row.phase_week, totalPhaseWeeks: row.total_phase_weeks, sessions: [] }; weeks.set(row.week, week); }
  week.sessions.push({ id: row.session_key, week: row.week, day: row.day, type: row.type, phase: row.phase, title: row.title, duration: row.duration,
   warmup: JSON.parse(row.warmup), mainSet: JSON.parse(row.main_set), cooldown: JSON.parse(row.cooldown), coachNote: row.coach_note, status: row.status });
 }
 return { id: plan.id, totalWeeks: plan.total_weeks, raceDate: plan.race_date, weeks: [...weeks.values()] };
}
export async function updateSessionStatus(userId: string, sessionKey: string, status: SessionStatus) {
 const db = await getDb(); const completedAt = status === "completed" ? Date.now() : null;
 const row = await db.prepare(`UPDATE plan_sessions SET status = ?, completed_at = ? WHERE user_id = ? AND session_key = ?
 AND plan_id IN (SELECT id FROM training_plans WHERE user_id = ? AND status = 'active') RETURNING session_key, status, completed_at`)
 .bind(status, completedAt, userId, sessionKey, userId).first<{ session_key: string; status: SessionStatus; completed_at: number | null }>();
 return row ? { id: row.session_key, status: row.status, completedAt: row.completed_at } : null;
}
