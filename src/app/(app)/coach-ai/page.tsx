"use client"
import { Suspense, useEffect, useRef, useState } from "react"
import { useSearchParams } from "next/navigation"
import { usePlanStore } from "@/stores/plan-store"
import { useCoachAIStore } from "@/stores/coach-ai-store"
import { PageHeader, Skeleton } from "@/components/shell/primitives"
import {
  GroundingBar,
  ChatThread,
  SuggestedPrompts,
  Composer,
} from "@/components/coach-ai/chat"
import { HistoryDrawer } from "@/components/coach-ai/history-drawer"
import { getTodayIsoWeekday } from "@/lib/train/selectors"
function CoachChat({ sessionId }: { sessionId?: string }) {
  const { plan, currentWeek } = usePlanStore()
  const session = plan?.weeks
    .flatMap((w) => w.sessions)
    .find((s) => s.id === sessionId)
  const [value, setValue] = useState(
    session ? `Why is ${session.title} in week ${session.week}?` : "",
  )
  const chat = useCoachAIStore()
  if (!plan) return <Skeleton />
  const context = {
    plan,
    currentWeek,
    today: getTodayIsoWeekday(new Date()),
    sessionId,
  }
  const send = (prompt: string, webSearch = false) => {
    if (!prompt.trim() || chat.isStreaming) return
    chat.send(prompt, context, webSearch)
    setValue("")
  }
  return (
    <div className="flex min-h-[calc(100dvh-var(--tab-bar-h)-32px)] flex-col lg:min-h-[calc(100dvh-32px)]">
      <PageHeader
        title="Coach AI"
        action={
          <div className="flex shrink-0 items-center gap-2">
            <HistoryDrawer />
            <button
              type="button"
              className="min-h-11 text-sm text-text-2"
              onClick={() => {
                chat.startNewChat()
                setValue("")
              }}
            >
              New chat
            </button>
          </div>
        }
      />
      <GroundingBar
        week={currentWeek}
        phase={plan.weeks.find((w) => w.week === currentWeek)?.phase ?? "plan"}
      />
      {chat.messages.length ? (
        <ChatThread
          messages={chat.messages}
          onRetry={() => chat.retry(context)}
        />
      ) : (
        <div className="py-8">
          <p className="max-w-md text-text-2">
            Ask about any session, week or phase. Answers cite your plan.
          </p>
          <SuggestedPrompts onSend={send} />
        </div>
      )}
      {chat.saveNotice && <p role="status" className="mb-2 text-xs text-text-2">{chat.saveNotice}</p>}
      <Composer
        value={value}
        onChange={setValue}
        onSend={(webSearch) => send(value, webSearch)}
        streaming={chat.isStreaming}
        onStop={chat.stop}
      />
    </div>
  )
}
function QueryChat() {
  const mounted = useRef(false)
  useEffect(() => {
    if (mounted.current) return
    mounted.current = true
    const chat = useCoachAIStore.getState()
    void chat.loadThreads()
    void chat.restoreLastThread()
  }, [])
  const params = useSearchParams()
  const id = params.get("session") ?? undefined
  return <CoachChat key={id ?? "general"} sessionId={id} />
}
export default function CoachPage() {
  return (
    <Suspense fallback={<Skeleton />}>
      <QueryChat />
    </Suspense>
  )
}
