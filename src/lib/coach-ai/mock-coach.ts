import type { SuggestedPrompt } from "./types"
export const MAX_MESSAGE_CHARS = 2000
export const SUGGESTED_PROMPTS: SuggestedPrompt[] = [
  {
    id: "week",
    label: "Why is this week built like this?",
    prompt: "Why is this week built like this?",
  },
  {
    id: "next",
    label: "What should I focus on in my next session?",
    prompt: "What should I focus on in my next session?",
  },
  {
    id: "pace",
    label: "How do I pace the sled push?",
    prompt: "How do I pace the sled push?",
  },
  {
    id: "race",
    label: "Am I on track for race day?",
    prompt: "Am I on track for race day?",
  },
]
