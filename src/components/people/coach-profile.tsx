"use client"
import { use } from "react"
import Link from "next/link"
import { COACHES } from "@/lib/people/mock-people"
import { Section, MonoLabel, EmptyState } from "@/components/shell/primitives"
import {
  Avatar,
  VerifiedBadge,
  CoachStatGrid,
  Availability,
  coachPrice,
  RequestToTrainButton,
} from "./people-components"
export function CoachProfile({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const c = COACHES.find((c) => c.id === id)
  if (!c)
    return (
      <EmptyState
        label="COACH NOT FOUND"
        action={
          <Link
            className="inline-flex min-h-11 items-center text-accent"
            href="/people/coaches"
          >
            Back to coaches
          </Link>
        }
      >
        This coach is not in the directory.
      </EmptyState>
    )
  return (
    <>
      <Link
        href="/people/coaches"
        aria-label="Back to coaches"
        className="inline-flex min-h-16 items-center text-text-2"
      >
        ← Coaches
      </Link>
      <div className="flex items-center gap-4">
        <Avatar initials={c.initials} large />
        <h1 className="min-w-0 text-[22px] font-semibold leading-7">
          {c.name}
        </h1>
      </div>
      <div className="mt-4">
        {c.verified ? (
          <>
            <VerifiedBadge />
            <p className="mt-2">
              <MonoLabel>
                VERIFIED BY FINISHER ·{" "}
                {new Date(
                  c.verification!.verifiedOn + "T00:00:00",
                ).toLocaleDateString("en-GB", {
                  month: "short",
                  year: "numeric",
                })}
              </MonoLabel>
            </p>
          </>
        ) : (
          <MonoLabel>NOT YET VERIFIED</MonoLabel>
        )}
      </div>
      <p className="my-4 text-text-2">{c.headline}</p>
      <MonoLabel>
        {c.location}
        {c.remote ? " · REMOTE" : ""}
      </MonoLabel>
      <CoachStatGrid coach={c} />
      <Section label="CREDENTIALS">
        <ul>
          {c.credentials.map((x) => (
            <li key={x} className="border-b py-3 text-text-2">
              {x}
            </li>
          ))}
        </ul>
      </Section>
      <Section label="SPECIALTIES">
        <div className="flex flex-wrap gap-2">
          {c.specialties.map((x) => (
            <span key={x} className="rounded-sm border px-2 py-2">
              <MonoLabel>{x.replaceAll("_", " ")}</MonoLabel>
            </span>
          ))}
        </div>
      </Section>
      <Section label="LEVELS">
        <MonoLabel>{c.levels.join(" · ")}</MonoLabel>
      </Section>
      <Section label="AVAILABILITY & PRICE">
        <div className="flex justify-between">
          <Availability coach={c} />
          <MonoLabel>{coachPrice(c)}</MonoLabel>
        </div>
        <p className="mt-3 text-sm text-text-2">
          Pricing and payments are coming soon.
        </p>
      </Section>
      <Section label="ABOUT">
        <p className="text-text-2">{c.bio}</p>
      </Section>
      <RequestToTrainButton coach={c} />
    </>
  )
}
