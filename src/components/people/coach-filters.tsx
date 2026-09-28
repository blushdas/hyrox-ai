"use client"
import { useState } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Section, Sheet } from "@/components/shell/primitives"
import {
  countActiveFilters,
  DEFAULT_FILTERS,
} from "@/lib/people/filter-coaches"
import type {
  CoachFilters,
  CoachSpecialty,
  CoachLevel,
  CoachAvailability,
} from "@/lib/people/types"
const specialties: CoachSpecialty[] = [
  "running",
  "engine",
  "strength",
  "stations",
  "race_strategy",
  "doubles",
]
export function CoachFilterSheet({
  open,
  onClose,
  filters: f,
  onChange,
  count,
}: {
  open: boolean
  onClose: () => void
  filters: CoachFilters
  onChange: (f: CoachFilters) => void
  count: number
}) {
  return (
    <Sheet open={open} onClose={onClose} title="Filter coaches">
      <Section label="SPECIALTIES">
        <div className="flex flex-wrap gap-2">
          {specialties.map((s) => (
            <Button
              key={s}
              variant="secondary"
              aria-pressed={f.specialties.includes(s)}
              className={
                f.specialties.includes(s)
                  ? "border-accent-line bg-accent-soft"
                  : ""
              }
              onClick={() =>
                onChange({
                  ...f,
                  specialties: f.specialties.includes(s)
                    ? f.specialties.filter((x) => x !== s)
                    : [...f.specialties, s],
                })
              }
            >
              {s.replaceAll("_", " ")}
            </Button>
          ))}
        </div>
      </Section>
      <Section label="LEVEL">
        <div className="flex flex-wrap gap-2">
          {(["any", "beginner", "intermediate", "pro"] as const).map(
            (s: CoachLevel | "any") => (
              <Button
                key={s}
                variant="secondary"
                aria-pressed={f.level === s}
                className={
                  f.level === s ? "border-accent-line bg-accent-soft" : ""
                }
                onClick={() => onChange({ ...f, level: s })}
              >
                {s[0].toUpperCase() + s.slice(1)}
              </Button>
            ),
          )}
        </div>
      </Section>
      <Section label="AVAILABILITY">
        <div className="flex flex-wrap gap-2">
          {(["any", "open", "waitlist", "full"] as const).map(
            (s: CoachAvailability | "any") => (
              <Button
                key={s}
                variant="secondary"
                aria-pressed={f.availability === s}
                className={
                  f.availability === s
                    ? "border-accent-line bg-accent-soft"
                    : ""
                }
                onClick={() => onChange({ ...f, availability: s })}
              >
                {s[0].toUpperCase() + s.slice(1)}
              </Button>
            ),
          )}
        </div>
      </Section>
      <button
        role="switch"
        aria-checked={f.verifiedOnly}
        onClick={() => onChange({ ...f, verifiedOnly: !f.verifiedOnly })}
        className="my-6 flex min-h-11 w-full items-center justify-between border-y py-3"
      >
        Verified only
        <span
          className={`size-4 border ${f.verifiedOnly ? "border-accent bg-accent" : "border-hairline-strong"}`}
        />
      </button>
      <div className="flex gap-3">
        <Button
          variant="secondary"
          onClick={() => onChange({ ...DEFAULT_FILTERS })}
        >
          Clear filters
        </Button>
        <Button className="flex-1" onClick={onClose}>
          Show {count} coaches
        </Button>
      </div>
    </Sheet>
  )
}
export function CoachFilterBar({
  filters: f,
  onChange,
  count,
}: {
  filters: CoachFilters
  onChange: (f: CoachFilters) => void
  count: number
}) {
  const [open, setOpen] = useState(false)
  const active = countActiveFilters(f)
  const chips = [
    ...f.specialties,
    f.level !== "any" ? f.level : "",
    f.availability !== "any" ? f.availability : "",
    f.verifiedOnly ? "Verified only" : "",
    f.query ? `Search: ${f.query}` : "",
  ].filter(Boolean)
  return (
    <div className="my-5 min-w-0">
      <div className="flex gap-3">
        <Input
          aria-label="Search coaches"
          placeholder="Search coaches"
          value={f.query}
          onChange={(e) => onChange({ ...f, query: e.target.value })}
        />
        <Button variant="secondary" onClick={() => setOpen(true)}>
          Filters{active ? ` · ${active}` : ""}
        </Button>
      </div>
      {!!chips.length && (
        <div className="mt-3 flex max-w-full gap-2 overflow-x-auto pb-2">
          {chips.map((c, i) => (
            <span
              key={`${c}-${i}`}
              className="shrink-0 rounded-sm border bg-accent-soft px-2 py-1 font-mono text-[11px]"
            >
              {c.replaceAll("_", " ")}
            </span>
          ))}
        </div>
      )}
      <CoachFilterSheet
        open={open}
        onClose={() => setOpen(false)}
        filters={f}
        onChange={onChange}
        count={count}
      />
    </div>
  )
}
