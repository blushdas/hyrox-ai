"use client"
import { useRef, useState } from "react"
import { Sheet } from "@/components/shell/primitives"
import { useCoachAIStore } from "@/stores/coach-ai-store"
import type { ThreadSummary } from "@/lib/coach-ai/threads-client"

export function relativeTime(time: number, now = Date.now()) {
  const minutes = Math.max(0, Math.floor((now - time) / 60000))
  if (minutes < 1) return "Just now"
  if (minutes < 60) return `${minutes}m ago`
  if (minutes < 1440) return `${Math.floor(minutes / 60)}h ago`
  return `${Math.floor(minutes / 1440)}d ago`
}
export function HistoryList({ threads, status, onSelect }: {
  threads: ThreadSummary[]
  status: ReturnType<typeof useCoachAIStore.getState>["threadsStatus"]
  onSelect: (id: string) => void
}) {
  if (status === "signedOut") return null
  if (status === "loading" || status === "idle") return <p role="status" className="text-sm text-text-2">Loading saved chats…</p>
  if (status === "error") return <p role="status" className="text-sm text-text-2">Saved chats could not load. Try History again.</p>
  if (!threads.length) return <p className="text-sm text-text-2">No saved chats yet</p>
  return <ul className="min-w-0">
    {[...threads].sort((a, b) => b.updatedAt - a.updatedAt).map(thread => <li key={thread.id} className="min-w-0 border-b border-hairline">
      <button type="button" className="flex min-h-11 w-full min-w-0 flex-col gap-1 py-3 text-left text-sm" onClick={() => onSelect(thread.id)}>
        <span className="w-full break-words [overflow-wrap:anywhere]">{thread.title}</span>
        <time dateTime={new Date(thread.updatedAt).toISOString()} className="text-xs tabular-nums text-text-2">{relativeTime(thread.updatedAt)}</time>
      </button>
    </li>)}
  </ul>
}
export function HistoryDrawer() {
  const [open, setOpen] = useState(false)
  const trigger = useRef<HTMLButtonElement>(null)
  const chat = useCoachAIStore()
  const close = () => { setOpen(false); trigger.current?.focus() }
  return <>
    <button ref={trigger} type="button" aria-haspopup="dialog" aria-expanded={open} className="min-h-11 px-2 text-sm text-text-2" onClick={() => { setOpen(true); void chat.loadThreads() }}>History</button>
    <Sheet open={open} onClose={close} title="Chat history">
      <HistoryList threads={chat.threads} status={chat.threadsStatus} onSelect={id => { void chat.openThread(id); close() }} />
    </Sheet>
  </>
}
