import type { Athlete, Coach, CoachSpecialty, Relationship } from "./types"
const athleteNames = [
  "Mara Vellin",
  "Tomas Edrin",
  "Nila Corven",
  "Evan Solten",
  "Rae Bexley",
  "Levi Darnell",
  "Iona Fenn",
  "Arlo Marden",
  "Cora Elwin",
  "Jules Arven",
]
const relationships: Relationship[] = [
  "incoming",
  "incoming",
  "friend",
  "friend",
  "friend",
  "friend",
  "outgoing",
  "none",
  "none",
  "none",
]
export const ATHLETES: Athlete[] = athleteNames.map((name, i) => ({
  id: `a-${String(i + 1).padStart(3, "0")}`,
  name,
  handle: name.toLowerCase().replace(" ", "."),
  initials: name
    .split(" ")
    .map((n) => n[0])
    .join(""),
  location: ["London", "Manila", "Bristol"][i % 3],
  category: i % 3 === 0 ? "pro" : i % 3 === 1 ? "open" : "doubles",
  nextRace: { name: "Autumn race", date: "2026-11-14" },
  relationship: relationships[i],
  mutualCount: i % 5,
  weeklySessions: 3 + (i % 3),
}))
const names = [
  "Elin Voss",
  "Dara Fenwick",
  "Owen Mire",
  "Talia Brant",
  "Soren Vale",
  "Mina Calder",
  "Kit Ashen",
  "Nora Pell",
  "Remy Northen",
  "Ada Wynne",
  "Luca Berin",
  "Thea Carrick",
]
const specialties: CoachSpecialty[][] = [
  ["engine", "stations"],
  ["running", "race_strategy"],
  ["strength", "stations"],
  ["doubles", "engine"],
  ["running", "strength"],
  ["race_strategy", "stations"],
]
export const COACHES: Coach[] = names.map((name, i) => ({
  id: `c-${String(i + 1).padStart(3, "0")}`,
  name,
  initials: name
    .split(" ")
    .map((n) => n[0])
    .join(""),
  verified: i % 3 !== 2,
  verification:
    i % 3 !== 2 ? { body: "FINISHER", verifiedOn: "2026-08-15" } : undefined,
  headline:
    i === 4
      ? "Patient, structured preparation for athletes building their first complete race season"
      : "Progressive training for repeatable race-day effort",
  credentials: [
    "Strength and conditioning certificate",
    "Endurance coaching diploma",
  ],
  specialties: specialties[i % 6],
  levels:
    i % 3 === 0
      ? ["beginner", "intermediate"]
      : i % 3 === 1
        ? ["intermediate", "pro"]
        : ["beginner", "pro"],
  availability:
    i === 3 || i === 9 ? "full" : i === 2 || i === 7 ? "waitlist" : "open",
  location: ["London", "Manila", "Bristol", "Leeds"][i % 4],
  remote: i % 4 !== 3,
  yearsCoaching: 3 + i,
  athletesCoached: 28 + i * 14,
  medianImprovementMin: i === 2 ? null : 4 + i / 3,
  priceFromMonthly: i === 5 ? null : 180 + i * 10,
  currency: i % 3 === 0 ? "USD" : i % 3 === 1 ? "GBP" : "EUR",
  bio: `${name} builds training around consistent weeks, clear targets and recovery. Sessions combine running development with station practice, with regular reviews of effort and progress. This is a fictional coach profile for the FINISHER directory preview.`,
}))
