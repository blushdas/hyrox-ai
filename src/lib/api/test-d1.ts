// Test-only SQLite adapter. No Node modules are reachable from production routes.
import { createRequire } from "node:module";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import type { Db, Statement } from "./db-client";
import type { AthleteProfile, TrainingPlan, SessionBlock } from "@/lib/types";
type Value = string | number | null;
type Sqlite = { exec(sql: string): void; close(): void; prepare(sql: string): { get(...v: Value[]): unknown; all(...v: Value[]): unknown[]; run(...v: Value[]): unknown } };
const { DatabaseSync } = createRequire(import.meta.url)("node:sqlite") as { DatabaseSync: new (path: string) => Sqlite };
export function createTestDb() {
 const sqlite = new DatabaseSync(":memory:"); sqlite.exec("PRAGMA foreign_keys = ON");
 for (const migration of ["0001_auth.sql", "0002_native_auth_codes.sql", "0003_core_schema.sql", "0004_auth_hardening.sql", "0005_rate_limits.sql"]) sqlite.exec(readFileSync(resolve("migrations", migration), "utf8"));
 class Prepared implements Statement {
  constructor(readonly sql: string, readonly values: Value[] = []) {}
  bind(...values: Value[]): Statement { return new Prepared(this.sql, values); }
  async first<T>(): Promise<T | null> { return (sqlite.prepare(this.sql).get(...this.values) as T | undefined) ?? null; }
  async all<T>(): Promise<{ results: T[] }> { return { results: sqlite.prepare(this.sql).all(...this.values) as T[] }; }
  async run() { return sqlite.prepare(this.sql).run(...this.values); }
 }
 const db: Db = {
  prepare: sql => new Prepared(sql),
  async batch(statements) {
   sqlite.exec("BEGIN");
   try {
    const results = [];
    for (const statement of statements) results.push(await statement.run());
    sqlite.exec("COMMIT"); return results;
   } catch (error) { sqlite.exec("ROLLBACK"); throw error; }
  },
 };
 sqlite.exec("INSERT INTO users (id) VALUES ('alice'), ('bob')");
 return { db, sqlite, close: () => sqlite.close() };
}
export const profile: AthleteProfile = { raceDate: "2027-01-01", location: "Manila", category: "open", fitnessLevel: "beginner_mid", fiveKTime: "5:30", tenKTime: "", hyroxTime: "1:02:10", age: 30, gender: "male", weight: 180, weightUnit: "lbs", daysPerWeek: 4, sessionLength: 60 };
const block: SessionBlock = { title: "Warmup", duration: "5 min", exercises: [{ exercise: "Run", distance: "1 km", rpe: 3 }] };
export const plan: TrainingPlan = { id: "client-id", totalWeeks: 1, raceDate: "2027-01-01", weeks: [{ week: 1, phase: "foundation", phaseWeek: 2, totalPhaseWeeks: 4, sessions: [{ id: "session-1", week: 1, day: 1, type: "engine_builder", phase: "foundation", title: "Easy engine", duration: "60 min", warmup: block, mainSet: block, cooldown: block, coachNote: "Easy effort", status: "pending" }] }] };
