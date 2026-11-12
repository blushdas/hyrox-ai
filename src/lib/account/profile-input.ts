import type { AthleteProfile } from "@/lib/types"
import { timeToSeconds, weightToKg } from "@/lib/api/convert"

export const PROFILE_MESSAGES = {
  time: "Enter times as MM:SS or H:MM:SS",
  age: "Age must be between 13 and 100",
  location: "Location must be 120 characters or fewer",
  weight: "Enter a weight above 0 and under 500 kg",
} as const

export const SAVE_FAILED_MESSAGE = "Couldn't save to your account. Changes are only on this device."
export const QUOTA_MESSAGE = "Plan limit reached. Your previous plan was kept."

export type ProfileField = "fiveKTime" | "tenKTime" | "hyroxTime" | "age" | "location" | "weight"
export type ProfileFieldError = { field: ProfileField; message: string }
export type ProfileCheck = { ok: true } | { ok: false; errors: ProfileFieldError[] }

const MAX_TEXT = 120
const MAX_TIME_LENGTH = 32
const MAX_WEIGHT_KG = 500

export function checkTime(value: string): string | null {
  if (value.length > MAX_TIME_LENGTH) return PROFILE_MESSAGES.time
  try {
    timeToSeconds(value)
    return null
  } catch {
    // timeToSeconds signals bad input by throwing; the message is the result.
    return PROFILE_MESSAGES.time
  }
}

function weightError(weight: number | null, unit: AthleteProfile["weightUnit"]): string | null {
  if (weight === null) return null
  if (typeof weight !== "number" || !Number.isFinite(weight) || weight <= 0) return PROFILE_MESSAGES.weight
  const kg = weightToKg(weight, unit)
  return kg === null || kg > MAX_WEIGHT_KG ? PROFILE_MESSAGES.weight : null
}

export function checkProfile(input: Partial<AthleteProfile>): ProfileCheck {
  const errors: ProfileFieldError[] = []
  const add = (field: ProfileField, message: string | null) => {
    if (message) errors.push({ field, message })
  }
  if (input.location !== undefined) {
    add("location", input.location.length > MAX_TEXT ? PROFILE_MESSAGES.location : null)
  }
  for (const field of ["fiveKTime", "tenKTime", "hyroxTime"] as const) {
    const value = input[field]
    if (value !== undefined) add(field, checkTime(value))
  }
  if (input.age !== undefined && input.age !== null) {
    const valid = Number.isInteger(input.age) && input.age >= 13 && input.age <= 100
    add("age", valid ? null : PROFILE_MESSAGES.age)
  }
  if (input.weight !== undefined) add("weight", weightError(input.weight, input.weightUnit ?? "kg"))
  return errors.length === 0 ? { ok: true } : { ok: false, errors }
}
