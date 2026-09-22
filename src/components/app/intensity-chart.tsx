"use client"

import type { TrainingPlan, SessionType, Phase } from "@/lib/types"

type Props = {
  plan: TrainingPlan
  currentWeek: number
}

const INTENSITY_SCORE: Record<SessionType, number> = {
  rest: 0,
  recovery: 2,
  engine_builder: 5,
  stations: 6,
  threshold: 7,
  race_sim: 9,
}

const PHASE_COLORS: Record<Phase, string> = {
  foundation: "rgba(59,130,246,0.12)",
  base: "rgba(59,130,246,0.12)",
  build: "rgba(249,115,22,0.12)",
  peak: "rgba(239,68,68,0.12)",
  taper: "rgba(34,197,94,0.12)",
}

const PHASE_STROKE: Record<Phase, string> = {
  foundation: "#3B82F6",
  base: "#3B82F6",
  build: "#F97316",
  peak: "#EF4444",
  taper: "#22C55E",
}

const PHASE_LABEL: Record<Phase, string> = {
  foundation: "Foundation",
  base: "Base",
  build: "Build",
  peak: "Peak",
  taper: "Taper",
}

export function IntensityChart({ plan, currentWeek }: Props) {
  const W = 800
  const H = 200
  const PAD_LEFT = 32
  const PAD_RIGHT = 24
  const PAD_TOP = 36
  const PAD_BOTTOM = 32

  const chartW = W - PAD_LEFT - PAD_RIGHT
  const chartH = H - PAD_TOP - PAD_BOTTOM

  // Compute weekly intensity scores
  const weekScores = plan.weeks.map(week => ({
    week: week.week,
    phase: week.phase,
    score: week.sessions.reduce((sum, s) => sum + (INTENSITY_SCORE[s.type] ?? 0), 0),
  }))

  const maxScore = Math.max(...weekScores.map(w => w.score), 1)
  const numWeeks = weekScores.length

  function xPos(weekIdx: number) {
    return PAD_LEFT + (weekIdx / (numWeeks - 1)) * chartW
  }

  function yPos(score: number) {
    return PAD_TOP + chartH - (score / maxScore) * chartH
  }

  // Build area path
  const points = weekScores.map((w, i) => ({ x: xPos(i), y: yPos(w.score) }))
  const areaPath =
    `M ${points[0].x} ${yPos(0)} ` +
    points.map(p => `L ${p.x} ${p.y}`).join(" ") +
    ` L ${points[points.length - 1].x} ${yPos(0)} Z`

  const linePath =
    `M ${points[0].x} ${points[0].y} ` +
    points.slice(1).map(p => `L ${p.x} ${p.y}`).join(" ")

  // Phase bands: group consecutive weeks by phase
  type PhaseBand = { phase: Phase; startIdx: number; endIdx: number }
  const bands: PhaseBand[] = []
  let currentBand: PhaseBand | null = null

  weekScores.forEach((w, i) => {
    if (!currentBand || currentBand.phase !== w.phase) {
      if (currentBand) bands.push(currentBand)
      currentBand = { phase: w.phase, startIdx: i, endIdx: i }
    } else {
      currentBand.endIdx = i
    }
  })
  if (currentBand) bands.push(currentBand)

  function bandX(idx: number, end?: boolean) {
    if (numWeeks === 1) return end ? W - PAD_RIGHT : PAD_LEFT
    const x = xPos(idx)
    const halfStep = (chartW / (numWeeks - 1)) / 2
    return end ? x + halfStep : x - halfStep
  }

  const currentIdx = currentWeek - 1

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      width="100%"
      className="overflow-visible"
      aria-label="12-week training intensity chart"
    >
      {/* Phase band backgrounds */}
      {bands.map((band, bi) => {
        const x1 = bi === 0 ? PAD_LEFT : bandX(band.startIdx)
        const x2 = bi === bands.length - 1 ? W - PAD_RIGHT : bandX(band.endIdx, true)
        return (
          <g key={`band-${bi}`}>
            <rect
              x={x1}
              y={PAD_TOP}
              width={x2 - x1}
              height={chartH}
              fill={PHASE_COLORS[band.phase]}
              rx={4}
            />
            {/* Phase label above band */}
            <text
              x={(x1 + x2) / 2}
              y={PAD_TOP - 8}
              textAnchor="middle"
              fontSize={10}
              fill={PHASE_STROKE[band.phase]}
              fontWeight="600"
              className="select-none"
            >
              {PHASE_LABEL[band.phase]}
            </text>
          </g>
        )
      })}

      {/* Area fill */}
      <path d={areaPath} fill="rgba(34,197,94,0.15)" />

      {/* Line */}
      <path d={linePath} fill="none" stroke="#22C55E" strokeWidth={2} strokeLinejoin="round" />

      {/* Data points */}
      {points.map((p, i) => {
        const isCurrent = i === currentIdx
        return (
          <circle
            key={`dot-${i}`}
            cx={p.x}
            cy={p.y}
            r={isCurrent ? 5 : 3}
            fill={isCurrent ? "#22C55E" : "#0F1A0E"}
            stroke="#22C55E"
            strokeWidth={isCurrent ? 2.5 : 1.5}
          />
        )
      })}

      {/* Current week vertical line */}
      {currentIdx >= 0 && currentIdx < points.length && (
        <line
          x1={points[currentIdx].x}
          y1={PAD_TOP}
          x2={points[currentIdx].x}
          y2={PAD_TOP + chartH}
          stroke="#22C55E"
          strokeWidth={1}
          strokeDasharray="3 3"
          opacity={0.6}
        />
      )}

      {/* X-axis baseline */}
      <line
        x1={PAD_LEFT}
        y1={PAD_TOP + chartH}
        x2={W - PAD_RIGHT}
        y2={PAD_TOP + chartH}
        stroke="rgba(255,255,255,0.1)"
        strokeWidth={1}
      />

      {/* X-axis ticks */}
      {[0, 5, 11].map(i => (
        <text
          key={`tick-${i}`}
          x={xPos(i)}
          y={PAD_TOP + chartH + 16}
          textAnchor="middle"
          fontSize={10}
          fill="rgba(255,255,255,0.4)"
          className="select-none"
        >
          Wk {i + 1}
        </text>
      ))}
    </svg>
  )
}
