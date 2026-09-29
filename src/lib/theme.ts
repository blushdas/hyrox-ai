import type { SessionType } from "./types"

export const tokens = {
  bg: "#0A0B0A",
  "surface-1": "#101210",
  "surface-2": "#161916",
  "surface-3": "#1D211D",
  hairline: "#232823",
  "hairline-strong": "#323832",
  "text-1": "#EDEFEA",
  "text-2": "#A6ADA3",
  "text-3": "#838A80",
  accent: "#3DDC84",
  "accent-ink": "#04140A",
  "accent-soft": "rgba(61, 220, 132, 0.10)",
  "accent-line": "rgba(61, 220, 132, 0.35)",
  "status-skip": "#838A80",
  "status-warn": "#E3B341",
  danger: "#EF5A4F",
} as const

export const sessionTypeMeta: Record<
  SessionType,
  { code: string; label: string; intensity: 0 | 1 | 2 | 3 | 4 | 5 }
> = {
  engine_builder: { code: "ENG", label: "Engine Builder", intensity: 3 },
  threshold: { code: "THR", label: "Threshold", intensity: 4 },
  stations: { code: "STN", label: "Stations", intensity: 4 },
  race_sim: { code: "SIM", label: "Race Sim", intensity: 5 },
  recovery: { code: "REC", label: "Recovery", intensity: 1 },
  rest: { code: "REST", label: "Rest", intensity: 0 },
}
