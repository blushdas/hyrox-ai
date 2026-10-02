export type ThinkingCategory = "understand" | "web" | "review"
export type ThinkingStep = { category: ThinkingCategory; label: string; caption: string }

export const deriveThinkingStep = ({ searching, sourceCount }: { searching: boolean; sourceCount: number }): ThinkingStep => {
  if (sourceCount > 0) return {
    category: "review",
    label: `Reviewing ${sourceCount} ${sourceCount === 1 ? "source" : "sources"}`,
    caption: "Checking what the sources say before answering.",
  }
  if (searching) return {
    category: "web",
    label: "Searching the web",
    caption: "Looking up current sources.",
  }
  return {
    category: "understand",
    label: "Coach is thinking",
    caption: "Reading your question against your plan.",
  }
}
