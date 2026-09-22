import type { Session, WeekPlan, Phase, SessionType, ExerciseSet } from "./types"
import { BEGINNER_PLAN_SESSIONS } from "./hyrox-plan-data"

// Session templates by type
function makeSession(
  id: string,
  week: number,
  day: number,
  type: SessionType,
  phase: Phase,
  title: string,
  duration: string,
  coachNote: string,
  mainExercises: { exercise: string; sets?: number; reps?: string; duration?: string; distance?: string; pace?: string; rpe?: number; rest?: string; notes?: string }[]
): Session {
  const warmupMap: Record<SessionType, { exercise: string; duration?: string; reps?: string }[]> = {
    engine_builder: [
      { exercise: "Easy jog", duration: "5 min" },
      { exercise: "Dynamic leg swings", reps: "10 each leg" },
    ],
    threshold: [
      { exercise: "Easy jog", duration: "5 min" },
      { exercise: "Dynamic leg swings", reps: "10 each" },
      { exercise: "Strides", reps: "3 x 20 sec" },
    ],
    stations: [
      { exercise: "5 min movement prep" },
      { exercise: "Bodyweight squats", reps: "15 reps" },
    ],
    race_sim: [
      { exercise: "5 min movement prep" },
      { exercise: "Dynamic stretching circuit", duration: "3 min" },
    ],
    recovery: [
      { exercise: "Start easy, build into pace" },
    ],
    rest: [],
  }

  const cooldownMap: Record<SessionType, { exercise: string; duration?: string }[]> = {
    engine_builder: [
      { exercise: "5 min walk + stretch" },
      { exercise: "Quad stretch", duration: "30 sec each" },
      { exercise: "Hamstring stretch", duration: "30 sec each" },
    ],
    threshold: [
      { exercise: "Easy jog", duration: "5 min" },
      { exercise: "Full body stretch circuit", duration: "5 min" },
    ],
    stations: [
      { exercise: "5 min static stretch" },
      { exercise: "Foam roll quads + calves", duration: "3 min" },
    ],
    race_sim: [
      { exercise: "5 min static stretch" },
      { exercise: "Full body foam roll", duration: "5 min" },
    ],
    recovery: [
      { exercise: "Cool down naturally" },
      { exercise: "Child's pose", duration: "60 sec" },
    ],
    rest: [],
  }

  return {
    id,
    week,
    day,
    type,
    phase,
    title,
    duration,
    warmup: {
      title: "Warm-Up",
      duration: type === "race_sim" ? "10 min" : type === "recovery" ? "5 min" : "8 min",
      exercises: warmupMap[type].map(e => ({ ...e })),
    },
    mainSet: {
      title: "Main Set",
      duration,
      exercises: mainExercises,
    },
    cooldown: {
      title: "Cool-Down",
      duration: "5-10 min",
      exercises: cooldownMap[type].map(e => ({ ...e })),
    },
    coachNote,
    status: "pending",
  }
}

// Phase config for phaseWeek + totalPhaseWeeks
const PHASE_CONFIG: { phase: Phase; weeks: number[] }[] = [
  { phase: "base", weeks: [1, 2, 3, 4] },
  { phase: "build", weeks: [5, 6, 7, 8] },
  { phase: "peak", weeks: [9, 10, 11] },
  { phase: "taper", weeks: [12] },
]

function getPhaseInfo(week: number): { phase: Phase; phaseWeek: number; totalPhaseWeeks: number } {
  for (const p of PHASE_CONFIG) {
    if (p.weeks.includes(week)) {
      return {
        phase: p.phase,
        phaseWeek: p.weeks.indexOf(week) + 1,
        totalPhaseWeeks: p.weeks.length,
      }
    }
  }
  return { phase: "base", phaseWeek: 1, totalPhaseWeeks: 4 }
}

// Parse a raw workout line into a structured ExerciseSet
function parseWorkoutLine(line: string): ExerciseSet | null {
  const s = line.trim()
  if (!s) return null

  // Skip pure header lines like "25 Min AMRAP:", "3 RFT:", "For Time:", "Into:"
  if (/^(For Time|Into|OPTIONAL):?$/i.test(s)) return null
  if (/^\d+\s*(RFT|Rounds?\s*(for\s*Time)?):?$/i.test(s)) return null
  if (/^\d+\s*Min\s+AMRAP:?/i.test(s) && !/\w+\s+\w/.test(s.replace(/^\d+\s*Min\s+AMRAP:?\s*/i, ""))) return null

  // "N x Nm exercise" — e.g. "12 x 100m Run"
  const setsDistMatch = s.match(/^(\d+)\s*x\s*(\d+(?:\.\d+)?(?:ft|m|km)?)\s+(.+)$/i)
  if (setsDistMatch) {
    return { exercise: setsDistMatch[3].trim(), sets: parseInt(setsDistMatch[1]), distance: setsDistMatch[2] }
  }

  // "N:NN Min(utes) exercise" — e.g. "3:00 Minute Bike" or "3:00 Minutes Row"
  const durationMatch = s.match(/^(\d+:\d+)\s+Min(?:utes?)?\s+(.+)$/i)
  if (durationMatch) {
    return { exercise: durationMatch[2].trim(), duration: durationMatch[1] }
  }

  // "N-N Sets:" header — skip
  if (/^\d+-\d+\s+Sets:?$/i.test(s)) return null

  // "Nm/Nft exercise" or "Nm exercise" as first token — distance-first
  const distFirstMatch = s.match(/^(\d+(?:\.\d+)?(?:ft|m|km)(?:\/\d+(?:\.\d+)?(?:ft|m|km))?)\s+(.+)$/i)
  if (distFirstMatch) {
    return { exercise: distFirstMatch[2].trim(), distance: distFirstMatch[1] }
  }

  // "exercise x N" — e.g. "Goblet Squat x 10"
  const repsSuffixMatch = s.match(/^(.+?)\s+x\s+(\d+)$/i)
  if (repsSuffixMatch) {
    return { exercise: repsSuffixMatch[1].trim(), reps: repsSuffixMatch[2] }
  }

  // "N reps exercise" — e.g. "20 Air Squats"
  const repsFirstMatch = s.match(/^(\d+)\s+(.+)$/)
  if (repsFirstMatch) {
    const num = parseInt(repsFirstMatch[1])
    const rest = repsFirstMatch[2].trim()
    // If rest looks like "Minutes Rest" it's probably a rest line
    if (/Min(?:utes?)?\s+Rest/i.test(rest)) {
      return { exercise: "Rest", rest: `${num} min` }
    }
    // If rest starts with "Min" it's a duration header — skip
    if (/^Min(?:utes?)/i.test(rest)) return null
    return { exercise: rest, reps: String(num) }
  }

  // Anything remaining — just use as exercise name
  return { exercise: s }
}

// 5-day/week, 12-week plan from real HYROX Beginner data
export function generateBeginnerPlan(_raceDate: string): WeekPlan[] {
  const weeks: WeekPlan[] = []

  for (let w = 1; w <= 12; w++) {
    const { phase, phaseWeek, totalPhaseWeeks } = getPhaseInfo(w)
    const rawSessions = BEGINNER_PLAN_SESSIONS.filter(s => s.week === w)

    const sessions: Session[] = rawSessions.map(raw =>
      makeSession(
        `w${raw.week}-d${raw.day}`,
        raw.week,
        raw.day,
        raw.type,
        raw.phase,
        raw.title,
        raw.duration,
        raw.notes.join(" "),
        raw.workout.map(parseWorkoutLine).filter((e): e is ExerciseSet => e !== null),
      )
    )

    weeks.push({ week: w, phase, phaseWeek, totalPhaseWeeks, sessions })
  }

  return weeks
}

export const PHASE_NAMES: Record<string, string> = {
  foundation: "Foundation",
  base: "Base",
  build: "Build",
  peak: "Peak",
  taper: "Taper",
}
