"use client"

import Link from "next/link"
import { cn } from "@/lib/utils"
import { sessionTypeColors } from "@/lib/theme"
import type { Session } from "@/lib/types"

type SessionCardProps = {
  session: Session
  isToday?: boolean
}

const DAY_NAMES = ["", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]

export function SessionCard({ session, isToday }: SessionCardProps) {
  const colors = sessionTypeColors[session.type]

  return (
    <Link href={`/app/session/${session.id}`}>
      <div
        className={cn(
          "flex items-center gap-3 px-4 py-3.5 border-b border-[#1A1A1A] hover:bg-[rgba(255,255,255,0.03)] transition-colors cursor-pointer",
          isToday && "border-l-2 border-l-primary"
        )}
      >
        {/* Type dot */}
        <div
          className="w-1.5 h-1.5 rounded-full flex-shrink-0"
          style={{ backgroundColor: colors.bg }}
        />

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="text-sm font-medium text-white truncate">{session.title}</div>
          <div className="text-xs text-[#6B7280] mt-0.5">
            {DAY_NAMES[session.day]} · {session.duration}
          </div>
        </div>

        {/* Status */}
        {session.status === "completed" && (
          <span className="text-[10px] uppercase tracking-wide text-[#6B7280]">Done</span>
        )}
        {session.status === "skipped" && (
          <span className="text-[10px] uppercase tracking-wide text-[#3D3D3D]">Skip</span>
        )}
      </div>
    </Link>
  )
}
