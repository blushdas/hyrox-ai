import { getDb } from "@/lib/api/db-client";
export async function deleteAccount(userId: string) {
 const db = await getDb();
 await db.batch([
  db.prepare("DELETE FROM verification_tokens WHERE identifier IN (SELECT email FROM users WHERE id = ?)").bind(userId),
  ...["native_auth_codes", "sessions", "accounts"].map(table => db.prepare(`DELETE FROM ${table} WHERE userId = ?`).bind(userId)),
  ...["coach_messages", "coach_threads", "plan_sessions", "training_plans", "athlete_profiles", "rate_limits"].map(table => db.prepare(`DELETE FROM ${table} WHERE user_id = ?`).bind(userId)),
  db.prepare("DELETE FROM users WHERE id = ?").bind(userId),
 ]);
}
