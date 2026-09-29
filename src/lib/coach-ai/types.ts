export type CitationKind = "session" | "week" | "phase"
export type Citation = {
  id: string
  kind: CitationKind
  label: string
  href: string
  sessionId?: string
  week?: number
  excerpt: string
}
export type ChatMessage = {
  id: string
  role: "user" | "assistant"
  content: string
  citations: Citation[]
  status: "complete" | "streaming" | "error"
  errorMessage?: string
  createdAt: string
}
export type SuggestedPrompt = { id: string; label: string; prompt: string }
