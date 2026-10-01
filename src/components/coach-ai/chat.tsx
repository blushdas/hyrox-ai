"use client"
import { useEffect, useRef, useState } from "react"
import Link from "next/link"
import { motion, useReducedMotion } from "framer-motion"
import { motionTransition } from "@/lib/motion"
import { ArrowDown, ArrowUp, Square } from "lucide-react"
import type { ChatMessage, Citation } from "@/lib/coach-ai/types"
import { MAX_MESSAGE_CHARS, SUGGESTED_PROMPTS } from "@/lib/coach-ai/mock-coach"
import { MonoLabel } from "@/components/shell/primitives"
import { StreamingMarkdown, citationAnchor } from "./markdown"
import { parseCoachTake } from "@/lib/coach-ai/coach-take"
import { CoachTakeCard } from "./coach-take-card"
import { MessageActions } from "./message-actions"
import { useRevealedText } from "./use-revealed-text"
import { Thinking } from "./thinking"
export function GroundingBar({ week, phase }: { week: number; phase: string }) {
  return (
    <div className="border-b py-4">
      <MonoLabel>
        GROUNDED IN YOUR PLAN · WK {String(week).padStart(2, "0")} · {phase}
      </MonoLabel>
    </div>
  )
}
export function CitationChip({
  citation: c,
  index,
  anchorId,
}: {
  citation: Citation
  index: number
  anchorId?: string
}) {
  return (
    <Link
      id={anchorId}
      title={c.excerpt}
      aria-label={`Source ${index}: Week ${c.week}, ${c.label.split(" · ").slice(1).join(" · ")}`}
      href={c.href}
      className="flex min-h-11 max-w-full items-center gap-2 rounded-sm border bg-surface-1 px-3 font-mono text-[11px]"
    >
      <span className="text-accent">{index}</span>
      <span className="truncate">{c.label}</span>
    </Link>
  )
}
export function UserMessage({ message }: { message: ChatMessage }) {
  return (
    <div className="ml-auto max-w-[85%] whitespace-pre-wrap break-words rounded-md bg-surface-2 px-4 py-3">
      {message.content}
    </div>
  )
}
export function AssistantMessage({
  message: m,
  onRetry,
  retryDisabled,
  lastAssistant,
  searching = false,
}: {
  message: ChatMessage
  onRetry: () => void
  retryDisabled: boolean
  lastAssistant: boolean
  searching?: boolean
}) {
  const take = m.status === "complete" ? parseCoachTake(m.content) : null
  const revealed = useRevealedText(m.content, m.status === "streaming")
  const thinking = m.status === "streaming" && m.content.length === 0
  return (
    <div>
      {m.status === "error" ? (
        <div role="alert" className="text-sm text-danger">
          {m.errorMessage}
          <button
            className="ml-3 min-h-11 underline disabled:opacity-40"
            onClick={onRetry}
            disabled={retryDisabled}
          >
            Retry
          </button>
        </div>
      ) : (
        <>
          {thinking ? <Thinking searching={searching} sourceCount={m.webSources?.length ?? 0} /> : take ? <CoachTakeCard take={take} messageId={m.id} citationCount={m.citations.length} /> : <StreamingMarkdown text={revealed} streaming={m.status === "streaming"} citationCount={m.citations.length} messageId={m.id} />}
          <div className="mt-4 flex flex-wrap gap-2">
            {m.citations.map((c, i) => (
              <CitationChip key={c.id} citation={c} index={i + 1} anchorId={citationAnchor(m.id, i + 1)} />
            ))}
            {m.webSources?.map((source, i) => <a key={source.url} href={source.url} target="_blank" rel="noopener noreferrer" aria-label={`Web source ${m.citations.length + i + 1}: ${source.host}`} title={source.title} className="flex min-h-11 max-w-full items-center gap-2 rounded-sm border border-hairline bg-surface-2 px-3 font-mono text-[11px]">
              <span className="text-accent">{m.citations.length + i + 1}</span><span className="truncate">{source.host}</span><span className="text-text-3">Web</span>
            </a>)}
          </div>
          {m.status === "complete" && <MessageActions content={m.content} regenerate={lastAssistant} disabled={retryDisabled} onRetry={onRetry} />}
        </>
      )}
    </div>
  )
}
export function SuggestedPrompts({ onSend }: { onSend: (s: string) => void }) {
  return (
    <div className="mt-8">
      {SUGGESTED_PROMPTS.map((p) => (
        <button
          key={p.id}
          onClick={() => onSend(p.prompt)}
          className="flex min-h-16 w-full items-center justify-between gap-4 border-b py-4 text-left"
        >
          {p.label}
          <span aria-hidden>→</span>
        </button>
      ))}
    </div>
  )
}
export function ChatThread({
  messages,
  onRetry,
}: {
  messages: ChatMessage[]
  onRetry: () => void
}) {
  const reduced = useReducedMotion()
  const follow = useRef(true)
  const [aboveBottom, setAboveBottom] = useState(false)
  const streaming = messages.some(message => message.status === "streaming")
  const lastAssistant = [...messages].reverse().find(message => message.role === "assistant")
  const announcement = lastAssistant?.status === "complete" ? `Coach response: ${lastAssistant.content}` : ""
  useEffect(() => {
    const track = () => {
      const distance = document.documentElement.scrollHeight - window.innerHeight - window.scrollY
      follow.current = distance <= 100
      setAboveBottom(distance > 100)
    }
    track()
    window.addEventListener("scroll", track, { passive: true })
    return () => window.removeEventListener("scroll", track)
  }, [])
  useEffect(() => {
    if (follow.current)
      window.scrollTo({ top: document.documentElement.scrollHeight, behavior: "instant" })
  }, [messages])
  const root = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (!root.current) return
    const observer = new ResizeObserver(() => {
      if (follow.current)
        window.scrollTo({ top: document.documentElement.scrollHeight, behavior: "instant" })
    })
    observer.observe(root.current)
    return () => observer.disconnect()
  }, [])
  const lastUser = [...messages].reverse().find((m) => m.role === "user")
  return (
    <div ref={root} className="min-w-0 space-y-7 py-6">
      <div className="sr-only" role="status" aria-live="polite" aria-atomic="true">{announcement}</div>
      {messages.map((m, index) => (
        <motion.div key={m.id} data-message-motion
          initial={{ opacity: reduced ? 1 : 0, y: reduced ? 0 : 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={motionTransition(reduced, true)}
        >
          {m.role === "user" ? (
            <UserMessage message={m} />
          ) : (
            <AssistantMessage
              message={m}
              onRetry={onRetry}
              lastAssistant={m.id === lastAssistant?.id}
              searching={messages[index - 1]?.webSearch === true}
              retryDisabled={
                streaming || (lastUser?.content.length ?? 0) > MAX_MESSAGE_CHARS
              }
            />
          )}
        </motion.div>
      ))}
      {streaming && aboveBottom && <button type="button" aria-label="Scroll to latest" className="fixed right-5 bottom-[calc(var(--tab-bar-h)+9rem)] z-40 flex min-h-11 min-w-11 items-center gap-2 rounded-md border border-hairline bg-surface-2 px-3 text-sm lg:bottom-36" onClick={() => {
        follow.current = true
        setAboveBottom(false)
        window.scrollTo({ top: document.documentElement.scrollHeight, behavior: "instant" })
      }}><ArrowDown size={16} aria-hidden />Latest</button>}

    </div>
  )
}
export function Composer({
  value,
  onChange,
  onSend,
  streaming,
  onStop,
}: {
  value: string
  onChange: (s: string) => void
  onSend: (webSearch: boolean) => void
  streaming: boolean
  onStop: () => void
}) {
  const [webSearch, setWebSearch] = useState(false)
  const send = () => {
    if (streaming || !value.trim()) return
    onSend(webSearch)
    setWebSearch(false)
  }
  const input = useRef<HTMLTextAreaElement>(null)
  useEffect(() => {
    if (input.current) {
      input.current.style.height = "auto"
      input.current.style.height = `${Math.min(120, input.current.scrollHeight)}px`
    }
  }, [value])
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault()
        send()
      }}
      className="sticky bottom-[calc(var(--tab-bar-h)+env(safe-area-inset-bottom))] z-30 -mx-4 mt-auto border-t bg-surface-1 px-4 pt-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] sm:-mx-6 sm:px-6 lg:bottom-0"
    >
      {value.length > 1800 && (
        <div
          className={`mb-2 text-right font-mono text-[11px] ${value.length > MAX_MESSAGE_CHARS ? "text-status-warn" : "text-text-3"}`}
        >
          {value.length} / {MAX_MESSAGE_CHARS}
        </div>
      )}
      <button type="button" aria-pressed={webSearch} onClick={() => setWebSearch(!webSearch)} className={`mb-2 min-h-11 rounded-sm border px-3 text-sm ${webSearch ? "border-accent bg-accent text-accent-ink" : "border-hairline bg-surface-2 text-text-2"}`}>
        Search web
      </button>
      <div className="flex items-end gap-3">
        <textarea
          ref={input}
          rows={1}
          aria-label="Message Coach AI"
          placeholder="Ask about your training"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault()
              if (!streaming) send()
            }
          }}
          className="min-h-11 min-w-0 flex-1 resize-none rounded-sm bg-surface-2 px-3 py-3 text-[15px] placeholder:text-text-3"
        />
        {streaming ? (
          <button
            type="button"
            onClick={onStop}
            aria-label="Stop response"
            className="flex size-11 items-center justify-center rounded-md border"
          >
            <Square size={18} />
          </button>
        ) : (
          <button
            disabled={!value.trim()}
            aria-label="Send message"
            className="flex size-11 items-center justify-center rounded-md bg-accent text-accent-ink disabled:bg-surface-3 disabled:text-text-3"
          >
            <ArrowUp size={20} />
          </button>
        )}
      </div>
    </form>
  )
}
