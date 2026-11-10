"use client"

import { useEffect, useRef, useState, type KeyboardEvent } from "react"
import { Popover } from "@base-ui/react/popover"
import { motion, useReducedMotion } from "framer-motion"
import { CalendarDays, ChevronLeft, ChevronRight } from "lucide-react"
import { motionTransition } from "@/lib/motion"

export function dateKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`
}
export function parseDate(value: string): Date {
  const [year, month, day] = value.split("-").map(Number)
  return new Date(year, month - 1, day)
}
export function isPastDate(value: string, now = new Date()): boolean {
  return value < dateKey(now)
}
export function weeksUntilRace(value: string, now = new Date()): number {
  const target = parseDate(value)
  // Compare calendar days, independent of time of day and daylight saving changes.
  return Math.floor((Date.UTC(target.getFullYear(), target.getMonth(), target.getDate())
    - Date.UTC(now.getFullYear(), now.getMonth(), now.getDate())) / (7 * 86400000))
}
const weekdays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]
const focusClass = "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"

export function DatePicker({ value, onChange, label = "Race Date" }: {
  value: string; onChange: (value: string) => void; label?: string
}) {
  const [open, setOpen] = useState(false)
  const [focused, setFocused] = useState(() => value && !isPastDate(value) ? value : dateKey(new Date()))
  const active = useRef<HTMLButtonElement>(null)
  const reduced = useReducedMotion()
  const date = parseDate(focused)
  const first = new Date(date.getFullYear(), date.getMonth(), 1)
  const last = new Date(date.getFullYear(), date.getMonth() + 1, 0)
  const count = Math.ceil((first.getDay() + last.getDate()) / 7) * 7
  const month = first.toLocaleDateString("en-GB", { month: "long", year: "numeric" })

  useEffect(() => { if (open) active.current?.focus() }, [focused, open])

  function move(days: number) {
    const next = parseDate(focused)
    next.setDate(next.getDate() + days)
    const key = dateKey(next)
    if (!isPastDate(key)) setFocused(key)
  }
  function changeMonth(delta: number) {
    const next = new Date(date.getFullYear(), date.getMonth() + delta, 1)
    const key = dateKey(next)
    setFocused(isPastDate(key) ? dateKey(new Date()) : key)
  }
  function handleKey(event: KeyboardEvent) {
    const offsets: Record<string, number> = { ArrowLeft: -1, ArrowRight: 1, ArrowUp: -7, ArrowDown: 7 }
    if (event.key in offsets) { event.preventDefault(); move(offsets[event.key]) }
    else if (event.key === "Home") { event.preventDefault(); move(-date.getDay()) }
    else if (event.key === "End") { event.preventDefault(); move(6 - date.getDay()) }
    else if (event.key === "PageUp" || event.key === "PageDown") {
      event.preventDefault(); changeMonth(event.key === "PageUp" ? -1 : 1)
    }
  }

  return <Popover.Root open={open} onOpenChange={next => {
    if (next) setFocused(value && !isPastDate(value) ? value : dateKey(new Date()))
    setOpen(next)
  }}>
    <Popover.Trigger aria-label={label} className={`flex min-h-11 w-full items-center justify-between gap-3 rounded-lg border border-border bg-surface-2 px-3 text-sm ${focusClass}`}>
      <span>{value ? parseDate(value).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" }) : "Choose race date"}</span>
      <CalendarDays aria-hidden="true" className="size-4 text-muted-foreground" />
    </Popover.Trigger>
    <Popover.Portal>
      <Popover.Positioner sideOffset={8} collisionPadding={2} align="start" className="z-50">
        <Popover.Popup aria-label="Choose race date" initialFocus={active} className="w-[316px] max-w-[calc(100vw-4px)] border border-border bg-surface-1 p-[3px] text-foreground">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={motionTransition(reduced, true)}>
            <div className="flex items-center justify-between">
              <button type="button" aria-label="Previous month" disabled={date.getFullYear() === new Date().getFullYear() && date.getMonth() === new Date().getMonth()} onClick={() => changeMonth(-1)} className={`flex size-11 items-center justify-center disabled:opacity-30 ${focusClass}`}><ChevronLeft className="size-4" /></button>
              <span aria-live="polite" className="text-sm font-semibold">{month}</span>
              <button type="button" aria-label="Next month" onClick={() => changeMonth(1)} className={`flex size-11 items-center justify-center ${focusClass}`}><ChevronRight className="size-4" /></button>
            </div>
            <div role="grid" aria-label={month} onKeyDown={handleKey}>
              <div role="row" className="grid grid-cols-7">{weekdays.map(day => <span key={day} role="columnheader" className="py-2 text-center text-xs text-muted-foreground">{day}</span>)}</div>
              {Array.from({ length: count / 7 }, (_, row) => <div role="row" key={row} className="grid grid-cols-7">
                {Array.from({ length: 7 }, (_, column) => {
                  const day = row * 7 + column - first.getDay() + 1
                  if (day < 1 || day > last.getDate()) return <span role="gridcell" key={column} />
                  const key = dateKey(new Date(date.getFullYear(), date.getMonth(), day))
                  const disabled = isPastDate(key)
                  return <div role="gridcell" aria-selected={value === key} aria-disabled={disabled} key={column}>
                    <button ref={focused === key ? active : undefined} type="button" aria-label={key} aria-current={key === dateKey(new Date()) ? "date" : undefined} disabled={disabled} tabIndex={focused === key ? 0 : -1}
                      onClick={() => { onChange(key); setOpen(false) }}
                      className={`h-11 w-11 rounded-xs text-sm tabular-nums disabled:text-text-3 ${focusClass} ${value === key ? "bg-primary text-primary-foreground" : "hover:bg-surface-2"}`}>
                      {day}
                    </button>
                  </div>
                })}
              </div>)}
            </div>
            <Popover.Close className={`min-h-11 w-full border-t border-border text-sm text-text-2 ${focusClass}`}>Close calendar</Popover.Close>
          </motion.div>
        </Popover.Popup>
      </Popover.Positioner>
    </Popover.Portal>
  </Popover.Root>
}
