import { describe, expect, it } from "vitest"
import type { AthleteProfile } from "@/lib/types"
import { validateProfile } from "@/lib/api/validate"
import { checkProfile, checkTime, PROFILE_MESSAGES } from "./profile-input"

const base: AthleteProfile = {
  raceDate: "2027-03-01",
  location: "London",
  category: "open",
  fiveKTime: "28:00",
  tenKTime: "58:00",
  hyroxTime: "1:45:00",
  age: 32,
  gender: "Female",
  weight: 70,
  weightUnit: "kg",
  daysPerWeek: 4,
  sessionLength: 60,
  fitnessLevel: "beginner_mid",
}
const messages = (input: Partial<AthleteProfile>) => {
  const result = checkProfile(input)
  return result.ok ? [] : result.errors.map((e) => `${e.field}:${e.message}`)
}

describe("checkTime", () => {
  it.each(["28:00", "1:45:00", "", "0:59", "10:05"])("accepts %j", (value) => {
    expect(checkTime(value)).toBeNull()
  })
  it.each(["28.00", "28:60", "1:60:00", "abc", "28", "28:5", "1:2:3:4", " 28:00"])("rejects %j with the locked message", (value) => {
    expect(checkTime(value)).toBe("Enter times as MM:SS or H:MM:SS")
  })
  it("rejects values longer than the server's 32 character limit", () => {
    expect(checkTime(`${"1".repeat(31)}:00`)).toBe(PROFILE_MESSAGES.time)
  })
})

describe("checkProfile bounds", () => {
  it("uses the exact user-facing messages", () => {
    expect(PROFILE_MESSAGES).toEqual({
      time: "Enter times as MM:SS or H:MM:SS",
      age: "Age must be between 13 and 100",
      location: "Location must be 120 characters or fewer",
      weight: "Enter a weight above 0 and under 500 kg",
    })
  })
  it("flags each bad time on its own field", () => {
    expect(messages({ fiveKTime: "28.00", tenKTime: "58:00", hyroxTime: "1:60:00" })).toEqual([
      "fiveKTime:Enter times as MM:SS or H:MM:SS",
      "hyroxTime:Enter times as MM:SS or H:MM:SS",
    ])
  })
  it.each([[12, false], [13, true], [100, true], [101, false], [32.5, false], [null, true]])("age %j valid=%j", (age, valid) => {
    expect(checkProfile({ age }).ok).toBe(valid)
  })
  it("rejects age with the age message", () => {
    expect(messages({ age: 12 })).toEqual(["age:Age must be between 13 and 100"])
  })
  it.each([[120, true], [121, false]])("location of %i characters valid=%j", (length, valid) => {
    expect(checkProfile({ location: "a".repeat(length) }).ok).toBe(valid)
  })
  it.each([
    [0, "kg", false],
    [-5, "kg", false],
    [499, "kg", true],
    [500, "kg", true],
    [501, "kg", false],
    [1200, "lbs", false],
    [1000, "lbs", true],
    [null, "kg", true],
    [Number.NaN, "kg", false],
  ] as const)("weight %j %s valid=%j", (weight, weightUnit, valid) => {
    expect(checkProfile({ weight, weightUnit }).ok).toBe(valid)
  })
  it("checks only the fields it is given", () => {
    expect(checkProfile({}).ok).toBe(true)
    expect(checkProfile({ location: "ok" }).ok).toBe(true)
  })
})

describe("parity with the server validator", () => {
  const fixtures: Partial<AthleteProfile>[] = [
    {},
    { fiveKTime: "28:00" },
    { fiveKTime: "28.00" },
    { tenKTime: "28:60" },
    { hyroxTime: "1:60:00" },
    { hyroxTime: "1:45:00" },
    { hyroxTime: "abc" },
    { age: 12 },
    { age: 13 },
    { age: 100 },
    { age: 101 },
    { age: null },
    { location: "a".repeat(120) },
    { location: "a".repeat(121) },
    { weight: 0 },
    { weight: 499, weightUnit: "kg" },
    { weight: 501, weightUnit: "kg" },
    { weight: 1200, weightUnit: "lbs" },
    { weight: 1000, weightUnit: "lbs" },
    { fiveKTime: `${"1".repeat(31)}:00` },
  ]
  it.each(fixtures.map((f, i) => [i, f] as const))("fixture %i agrees", (_, fixture) => {
    const profile = { ...base, ...fixture }
    expect(checkProfile(fixture).ok).toBe(validateProfile(profile).ok)
  })
})
