"use client"
import { useState } from "react"
import Link from "next/link"
import { COACHES } from "@/lib/people/mock-people"
import {
  DEFAULT_FILTERS,
  filterCoaches,
  sortCoaches,
} from "@/lib/people/filter-coaches"
import {
  PageHeader,
  MonoLabel,
  EmptyState,
} from "@/components/shell/primitives"
import { CoachRow } from "@/components/people/people-components"
import { CoachFilterBar } from "@/components/people/coach-filters"
import { Button } from "@/components/ui/button"
export default function CoachesPage() {
  const [filters, setFilters] = useState(DEFAULT_FILTERS)
  const rows = sortCoaches(filterCoaches(COACHES, filters))
  return (
    <>
      <Link
        href="/people"
        aria-label="Back to People"
        className="inline-flex min-h-11 items-center text-sm text-text-2"
      >
        ← People
      </Link>
      <PageHeader title="Coaches" meta="VERIFIED COACHES FIRST" />
      <CoachFilterBar
        filters={filters}
        onChange={setFilters}
        count={rows.length}
      />
      <MonoLabel>{rows.length} COACHES</MonoLabel>
      {rows.length ? (
        rows.map((c) => <CoachRow key={c.id} coach={c} />)
      ) : (
        <EmptyState
          label="NO COACHES MATCH"
          action={
            <Button
              variant="secondary"
              onClick={() => setFilters({ ...DEFAULT_FILTERS })}
            >
              Clear filters
            </Button>
          }
        >
          Try fewer filters or a different search.
        </EmptyState>
      )}
      <Link
        href="/people/coaches/join"
        className="mt-6 flex min-h-16 items-center border-y text-text-2"
      >
        Coach on FINISHER? Apply to coach →
      </Link>
    </>
  )
}
