export type SessionType = "engine_builder" | "threshold" | "stations" | "race_sim" | "recovery" | "rest"
export type Phase = "foundation" | "base" | "build" | "peak" | "taper"
export type RaceCategory = "open" | "pro" | "doubles"
export type FitnessLevel = "beginner_low" | "beginner_mid" | "beginner_high"
export type SessionStatus = "pending" | "completed" | "skipped"

export type ExerciseSet = {
  exercise: string
  sets?: number
  reps?: string
  duration?: string
  distance?: string
  pace?: string
  rpe?: number
  rest?: string
  notes?: string
}

export type SessionBlock = {
  title: string
  duration: string
  exercises: ExerciseSet[]
}

export type Session = {
  id: string
  week: number
  day: number // 1=Mon, 7=Sun
  type: SessionType
  phase: Phase
  title: string
  duration: string
  warmup: SessionBlock
  mainSet: SessionBlock
  cooldown: SessionBlock
  coachNote: string
  status: SessionStatus
}

export type WeekPlan = {
  week: number
  phase: Phase
  phaseWeek: number
  totalPhaseWeeks: number
  sessions: Session[]
}

export type TrainingPlan = {
  id: string
  totalWeeks: number
  raceDate: string
  weeks: WeekPlan[]
}

export type AthleteProfile = {
  raceDate: string
  location: string
  category: RaceCategory
  fiveKTime: string
  tenKTime: string
  hyroxTime: string
  age: number | null
  gender: string
  weight: number | null
  weightUnit: "kg" | "lbs"
  daysPerWeek: 3 | 4 | 5
  sessionLength: 45 | 60 | 75 | 90
  fitnessLevel: FitnessLevel
}
