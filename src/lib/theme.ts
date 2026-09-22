import type { SessionType } from "./types"

export const colors = {
  background: "#0A0A0A",
  surface: "#111111",
  surfaceAlt: "#161616",
  primary: "#22C55E",
  primaryDark: "#16A34A",
  accent: "#22C55E",
  textPrimary: "#FFFFFF",
  textMuted: "#6B7280",
  border: "#1F1F1F",
  destructive: "#EF4444",
} as const

export const sessionTypeColors: Record<SessionType, { bg: string; text: string; label: string }> = {
  engine_builder: { bg: "#3B82F6", text: "#FFFFFF", label: "Engine Builder" },
  threshold: { bg: "#F97316", text: "#FFFFFF", label: "Threshold" },
  stations: { bg: "#EF4444", text: "#FFFFFF", label: "Stations" },
  race_sim: { bg: "#8B5CF6", text: "#FFFFFF", label: "Race Sim" },
  recovery: { bg: "#22C55E", text: "#0F1A0E", label: "Recovery" },
  rest: { bg: "#374151", text: "#9CA3AF", label: "Rest" },
}
