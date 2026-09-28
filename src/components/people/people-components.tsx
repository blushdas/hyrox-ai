"use client"
import { useState } from "react"
import Link from "next/link"
import { BadgeCheck, X } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { MonoLabel, Sheet } from "@/components/shell/primitives"
import { usePeopleStore } from "@/stores/people-store"
import type { Athlete, Coach } from "@/lib/people/types"
export function Avatar({
  initials,
  large = false,
}: {
  initials: string
  large?: boolean
}) {
  return (
    <span
      className={`flex shrink-0 items-center justify-center rounded-full bg-surface-2 font-mono text-sm ${large ? "size-14" : "size-10"}`}
    >
      {initials}
    </span>
  )
}
export function VerifiedBadge() {
  return (
    <span
      aria-label="Verified coach"
      className="inline-flex items-center gap-1 text-accent"
    >
      <BadgeCheck size={14} strokeWidth={1.5} />
      <span className="font-mono text-[11px]">VERIFIED</span>
    </span>
  )
}
export function PersonRow({ athlete: a }: { athlete: Athlete }) {
  const store = usePeopleStore()
  return (
    <div className="flex flex-wrap items-center gap-3 border-b py-4">
      <Avatar initials={a.initials} />
      <div className="min-w-0 flex-1">
        <p className="font-semibold">{a.name}</p>
        <MonoLabel className="tracking-normal">
          {a.category} · {a.location}
          {a.nextRace
            ? ` · RACE ${new Date(a.nextRace.date + "T00:00:00").toLocaleDateString("en-GB", { day: "2-digit", month: "short" })}`
            : ""}
        </MonoLabel>
      </div>
      <div className="flex items-center gap-1">
        {a.relationship === "none" ? (
          <Button variant="secondary" onClick={() => store.add(a.id)}>
            Add
          </Button>
        ) : a.relationship === "outgoing" ? (
          <>
            <Button variant="secondary" disabled>
              Requested
            </Button>
            <Button
              variant="ghost"
              size="icon"
              aria-label="Cancel request"
              onClick={() => store.cancel(a.id)}
            >
              <X />
            </Button>
          </>
        ) : a.relationship === "incoming" ? (
          <>
            <Button variant="secondary" onClick={() => store.accept(a.id)}>
              Accept
            </Button>
            <Button variant="ghost" onClick={() => store.decline(a.id)}>
              Decline
            </Button>
          </>
        ) : (
          <span aria-hidden className="text-text-3">
            →
          </span>
        )}
      </div>
    </div>
  )
}
export function InviteSheet({
  open,
  onClose,
}: {
  open: boolean
  onClose: () => void
}) {
  const [handle, setHandle] = useState("")
  const link = "finisher.app/i/athlete"
  return (
    <Sheet open={open} onClose={onClose} title="Invite athletes">
      <label className="block">
        <MonoLabel>INVITE LINK</MonoLabel>
        <Input
          aria-label="Invite link"
          readOnly
          value={link}
          className="mt-2 font-mono"
        />
      </label>
      <Button
        variant="secondary"
        className="mt-3"
        onClick={async () => {
          try {
            await navigator.clipboard.writeText(link)
            toast.success("Link copied")
          } catch (error) {
            console.error("Invite copy failed", error)
            toast.error("Could not copy link")
          }
        }}
      >
        Copy link
      </Button>
      <form
        className="mt-8 space-y-3"
        onSubmit={(e) => {
          e.preventDefault()
          if (handle.trim()) {
            toast.success("Invite sent")
            setHandle("")
            onClose()
          }
        }}
      >
        <label className="block">
          <MonoLabel>ATHLETE HANDLE</MonoLabel>
          <Input
            aria-label="Athlete handle"
            placeholder="athlete.handle"
            value={handle}
            onChange={(e) => setHandle(e.target.value)}
            className="mt-2"
          />
        </label>
        <Button disabled={!handle.trim()} type="submit" className="w-full">
          Send invite
        </Button>
      </form>
    </Sheet>
  )
}
export function coachPrice(c: Coach) {
  return c.priceFromMonthly === null
    ? "PRICE ON REQUEST"
    : `FROM ${{ USD: "$", GBP: "£", EUR: "€" }[c.currency]}${c.priceFromMonthly}/MO`
}
export function Availability({ coach: c }: { coach: Coach }) {
  return (
    <span
      className={`font-mono text-[11px] uppercase ${c.availability === "open" ? "text-accent" : c.availability === "waitlist" ? "text-status-warn" : "text-text-3"}`}
    >
      {c.availability}
    </span>
  )
}
export function CoachRow({ coach: c }: { coach: Coach }) {
  return (
    <Link
      href={`/people/coaches/${c.id}`}
      className="flex items-start gap-3 border-b py-5 hover:bg-surface-2"
    >
      <Avatar initials={c.initials} />
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
          <h2 className="truncate font-semibold">{c.name}</h2>
          {c.verified && <VerifiedBadge />}
        </div>
        <p className="mt-1 truncate text-[13px] text-text-2">{c.headline}</p>
        <div className="mt-2">
          <MonoLabel className="tracking-normal">
            {c.specialties.join(" · ").replaceAll("_", " ")}
          </MonoLabel>
        </div>
        <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
          <Availability coach={c} />
          <MonoLabel className="tracking-normal">{coachPrice(c)}</MonoLabel>
        </div>
      </div>
    </Link>
  )
}
export function CoachStatGrid({ coach: c }: { coach: Coach }) {
  const gain = c.medianImprovementMin
  const total = gain === null ? null : Math.round(gain * 60)
  return (
    <div className="my-7 grid grid-cols-3 border-y py-5">
      {[
        [c.yearsCoaching, "YEARS"],
        [c.athletesCoached, "ATHLETES"],
        [
          total === null
            ? "—"
            : `-${Math.floor(total / 60)}:${String(total % 60).padStart(2, "0")}`,
          "MEDIAN PR GAIN",
        ],
      ].map(([v, k]) => (
        <div key={k} className="border-r px-3 first:pl-0 last:border-0">
          <div className="mb-2 font-mono text-2xl">{v}</div>
          <MonoLabel className="tracking-normal">{k}</MonoLabel>
        </div>
      ))}
    </div>
  )
}
export function RequestToTrainButton({ coach: c }: { coach: Coach }) {
  const { coachRequests, requestCoach, cancelCoachRequest } = usePeopleStore()
  const pending = coachRequests[c.id]
  return (
    <div className="sticky bottom-[calc(var(--tab-bar-h)+env(safe-area-inset-bottom))] mt-8 border-t bg-background py-4 lg:bottom-0">
      <Button
        className="w-full"
        variant={pending ? "secondary" : "default"}
        disabled={pending}
        onClick={() => requestCoach(c.id)}
      >
        {pending
          ? "Request pending"
          : c.availability === "full"
            ? "Join waitlist"
            : "Request to train"}
      </Button>
      {pending && (
        <button
          className="min-h-11 w-full text-sm text-text-2"
          onClick={() => cancelCoachRequest(c.id)}
        >
          Cancel request
        </button>
      )}
    </div>
  )
}
