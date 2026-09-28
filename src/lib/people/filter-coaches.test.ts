import { expect, test } from "vitest"
import { COACHES } from "./mock-people"
import {
  DEFAULT_FILTERS as d,
  filterCoaches,
  sortCoaches,
  countActiveFilters,
} from "./filter-coaches"
test("query matches name headline and location without case", () => {
  for (const query of ["ELIN", "progressive", "MANILA"]) {
    const rows = filterCoaches(COACHES, { ...d, query })
    expect(rows.length).toBeGreaterThan(0)
    expect(
      rows.every((c) =>
        [c.name, c.headline, c.location]
          .join(" ")
          .toLowerCase()
          .includes(query.toLowerCase()),
      ),
    ).toBe(true)
  }
})
test("specialties match any selected", () =>
  expect(
    filterCoaches(COACHES, { ...d, specialties: ["engine", "strength"] }).every(
      (c) => c.specialties.some((s) => ["engine", "strength"].includes(s)),
    ),
  ).toBe(true))
test("level availability and verification filters", () => {
  expect(
    filterCoaches(COACHES, { ...d, level: "pro" }).every((c) =>
      c.levels.includes("pro"),
    ),
  ).toBe(true)
  expect(
    filterCoaches(COACHES, { ...d, availability: "full" }).every(
      (c) => c.availability === "full",
    ),
  ).toBe(true)
  expect(
    filterCoaches(COACHES, { ...d, verifiedOnly: true }).every(
      (c) => c.verified,
    ),
  ).toBe(true)
})
test("combined filters and empty results", () => {
  expect(
    filterCoaches(COACHES, {
      ...d,
      query: "Elin",
      verifiedOnly: true,
      level: "beginner",
      specialties: ["engine"],
      availability: "open",
    }),
  ).toHaveLength(1)
  expect(filterCoaches(COACHES, { ...d, query: "nonexistent" })).toEqual([])
})
test("verified first then availability and name without mutation", () => {
  const original = COACHES.map((c) => c.id)
  const rows = sortCoaches(COACHES)
  const firstUnverified = rows.findIndex((c) => !c.verified)
  expect(rows.slice(firstUnverified).every((c) => !c.verified)).toBe(true)
  expect(rows[0].availability).toBe("open")
  expect(COACHES.map((c) => c.id)).toEqual(original)
})
test("active filters counted", () =>
  expect(
    countActiveFilters({
      ...d,
      query: "a",
      specialties: ["engine", "running"],
      level: "pro",
      availability: "open",
      verifiedOnly: true,
    }),
  ).toBe(6))
