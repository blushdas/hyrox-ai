"use client"

import { ChevronLeft, ChevronRight } from "lucide-react"
import { sessionTypeColors } from "@/lib/theme"
import { cn } from "@/lib/utils"
import type { WeekPlan } from "@/lib/types"
import { SessionCard } from "./session-card"

type CalendarViewProps = {
  weekPlan: WeekPlan
  currentWeek: number
  totalWeeks: number
  onPrevWeek: () => void
  onNextWeek: () => void
}

const DAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
const today = new Date()
const todayDayOfWeek = today.getDay() === 0 ? 7 : today.getDay() // 1=Mon, 7=Sun

export function CalendarView({ weekPlan, currentWeek, totalWeeks, onPrevWeek, onNextWeek }: CalendarViewProps) {
  const sessionsByDay = weekPlan.sessions.reduce<Record<number, typeof weekPlan.sessions[0]>>((acc, s) => {
    acc[s.day] = s
    return acc
  }, {})

  return (
    <div className="space-y-4">
      {/* Week navigation */}
      <div className="flex items-center justify-between px-4 pt-4">
        <button
          onClick={onPrevWeek}
          disabled={currentWeek <= 1}
          className="p-2 rounded-md disabled:opacity-30 hover:text-white transition-colors text-[#6B7280]"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
        <div className="text-center">
          <div className="text-sm font-semibold text-white">Week {currentWeek}</div>
          <div className="text-xs text-[#6B7280]">{weekPlan.phase.charAt(0).toUpperCase() + weekPlan.phase.slice(1)} Phase</div>
        </div>
        <button
          onClick={onNextWeek}
          disabled={currentWeek >= totalWeeks}
          className="p-2 rounded-md disabled:opacity-30 hover:text-white transition-colors text-[#6B7280]"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* Day chips row */}
      <div className="grid grid-cols-7 gap-1 px-4">
        {DAY_LABELS.map((label, i) => {
          const dayNum = i + 1
          const session = sessionsByDay[dayNum]
          const isToday = currentWeek === 1 && dayNum === todayDayOfWeek
          const dotColor = session ? sessionTypeColors[session.type].bg : "transparent"

          return (
            <div key={dayNum} className="w-full py-2 flex flex-col items-center gap-1">
              <span className={cn("text-[11px]", isToday ? "text-primary font-semibold" : "text-[#6B7280]")}>
                {label}
              </span>
              <div
                className="w-1.5 h-1.5 rounded-full"
                style={{ backgroundColor: dotColor }}
              />
            </div>
          )
        })}
      </div>

      {/* Session list */}
      <div className="space-y-1 px-4 pb-4">
        <div className="text-[10px] text-[#6B7280] font-medium uppercase tracking-[0.1em] mb-2">Sessions</div>
        {weekPlan.sessions.length === 0 && (
          <div className="text-sm text-[#6B7280] py-4 text-center">Rest week</div>
        )}
        {weekPlan.sessions.length > 0 && (
          <div className="border border-[#1A1A1A] rounded-md overflow-hidden">
            {weekPlan.sessions.map((session) => (
              <SessionCard
                key={session.id}
                session={session}
                isToday={currentWeek === 1 && session.day === todayDayOfWeek}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
