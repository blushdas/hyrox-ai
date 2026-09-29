"use client"
import { useEffect, useRef } from "react"
import Link from "next/link"
import { motion, useReducedMotion } from "framer-motion"
import { motionTransition } from "@/lib/motion"
import { ArrowUp, Square } from "lucide-react"
import type { ChatMessage, Citation } from "@/lib/coach-ai/types"
import { MAX_MESSAGE_CHARS, SUGGESTED_PROMPTS } from "@/lib/coach-ai/mock-coach"
import { MonoLabel } from "@/components/shell/primitives"
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
}: {
  citation: Citation
  index: number
}) {
  return (
    <Link
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
}: {
  message: ChatMessage
  onRetry: () => void
  retryDisabled: boolean
}) {
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
          <p className="whitespace-pre-wrap break-words leading-[22px]">
            {m.content.split(/(\[\d+\])/g).map((part, i) =>
              /\[\d+\]/.test(part) ? (
                <span key={i} className="text-accent">
                  {part}
                </span>
              ) : (
                part
              ),
            )}
            {m.status === "streaming" && (
              <span className="ml-1 inline-block h-3.5 w-0.5 bg-accent motion-safe:animate-pulse" />
            )}
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            {m.citations.map((c, i) => (
              <CitationChip key={c.id} citation={c} index={i + 1} />
            ))}
          </div>
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
  const end = useRef<HTMLDivElement>(null)
  const follow = useRef(true)
  useEffect(() => {
    const track = () => {
      follow.current =
        window.innerHeight + window.scrollY >=
        document.documentElement.scrollHeight - 180
    }
    window.addEventListener("scroll", track, { passive: true })
    return () => window.removeEventListener("scroll", track)
  }, [])
  useEffect(() => {
    if (follow.current)
      end.current?.scrollIntoView({ block: "end", behavior: "instant" })
  }, [messages])
  const lastUser = [...messages].reverse().find((m) => m.role === "user")
  return (
    <div
      className="space-y-7 py-6"
      aria-live="polite"
      aria-relevant="additions text"
    >
      {messages.map((m) => (
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
              retryDisabled={
                (lastUser?.content.length ?? 0) > MAX_MESSAGE_CHARS
              }
            />
          )}
        </motion.div>
      ))}
      <div ref={end} />
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
  onSend: () => void
  streaming: boolean
  onStop: () => void
}) {
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
        onSend()
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
              if (!streaming) onSend()
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
