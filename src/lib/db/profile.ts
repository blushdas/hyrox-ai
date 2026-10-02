import { getDb } from "@/lib/api/db-client";
import { timeToSeconds, secondsToTime, weightToKg, kgToWeight } from "@/lib/api/convert";
import type { AthleteProfile } from "@/lib/types";
type Row = {
 race_date: string; location: string; category: AthleteProfile["category"]; fitness_level: AthleteProfile["fitnessLevel"];
 five_k_sec: number | null; ten_k_sec: number | null; hyrox_sec: number | null; age: number | null; gender: string;
 weight_kg: number | null; weight_unit: AthleteProfile["weightUnit"]; days_per_week: AthleteProfile["daysPerWeek"];
 session_length_min: AthleteProfile["sessionLength"]; onboarding_completed_at: number | null;
};
export async function getProfile(userId: string) {
 const db = await getDb();
 const row = await db.prepare("SELECT * FROM athlete_profiles WHERE user_id = ?").bind(userId).first<Row>();
 if (!row) return { profile: null, onboardingCompletedAt: null };
 const profile: AthleteProfile = {
  raceDate: row.race_date, location: row.location, category: row.category, fitnessLevel: row.fitness_level,
  fiveKTime: secondsToTime(row.five_k_sec), tenKTime: secondsToTime(row.ten_k_sec), hyroxTime: secondsToTime(row.hyrox_sec),
  age: row.age, gender: row.gender, weight: kgToWeight(row.weight_kg, row.weight_unit), weightUnit: row.weight_unit,
  daysPerWeek: row.days_per_week, sessionLength: row.session_length_min,
 };
 return { profile, onboardingCompletedAt: row.onboarding_completed_at };
}
export async function upsertProfile(userId: string, input: AthleteProfile, options: { onboardingComplete?: boolean } = {}) {
 const db = await getDb(); const now = Date.now();
 await db.prepare(`INSERT INTO athlete_profiles (user_id, race_date, location, category, fitness_level, five_k_sec, ten_k_sec, hyrox_sec, age, gender, weight_kg, weight_unit, days_per_week, session_length_min, onboarding_completed_at, created_at, updated_at)
 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
 ON CONFLICT(user_id) DO UPDATE SET race_date=excluded.race_date, location=excluded.location, category=excluded.category,
 fitness_level=excluded.fitness_level, five_k_sec=excluded.five_k_sec, ten_k_sec=excluded.ten_k_sec, hyrox_sec=excluded.hyrox_sec,
 age=excluded.age, gender=excluded.gender, weight_kg=excluded.weight_kg, weight_unit=excluded.weight_unit,
 days_per_week=excluded.days_per_week, session_length_min=excluded.session_length_min,
 onboarding_completed_at=COALESCE(athlete_profiles.onboarding_completed_at, excluded.onboarding_completed_at), updated_at=excluded.updated_at
 WHERE athlete_profiles.user_id = ?`).bind(userId, input.raceDate, input.location, input.category, input.fitnessLevel,
 timeToSeconds(input.fiveKTime), timeToSeconds(input.tenKTime), timeToSeconds(input.hyroxTime), input.age, input.gender,
 weightToKg(input.weight, input.weightUnit), input.weightUnit, input.daysPerWeek, input.sessionLength,
 options.onboardingComplete ? now : null, now, now, userId).run();
 return getProfile(userId);
}
