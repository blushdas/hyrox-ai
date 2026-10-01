"use client"
import { useId, useState } from "react"
import { ChevronDown } from "lucide-react"
import type { CoachTake } from "@/lib/coach-ai/coach-take"
import { Markdown } from "./markdown"
export function CoachTakeCard({ take, messageId, citationCount }: { take: CoachTake; messageId: string; citationCount: number }) {
  const [open, setOpen] = useState<string | null>(take.sections[0]?.label ?? null)
  const id = useId()
  const text = (value: string) => <Markdown text={value} messageId={messageId} citationCount={citationCount} />
  return <div className="min-w-0 [overflow-wrap:anywhere]">
    {take.preamble && <div className="mb-4 text-sm text-text-2">{text(take.preamble)}</div>}
    <article data-testid="coach-take-card" className="min-w-0 overflow-hidden rounded-md border border-hairline border-t-2 border-t-accent bg-surface-1">
      {take.headline && <header className="space-y-3 p-5">
        <p className="font-mono text-xs text-accent">Coach&apos;s take</p>
        <div className="text-xl font-semibold">{text(take.headline)}</div>
        {take.summary && <div className="text-sm text-text-2">{text(take.summary)}</div>}
      </header>}
      {take.sections.map((section, index) => <section key={section.label} className="border-t border-hairline">
        <button type="button" aria-expanded={open === section.label} aria-controls={`${id}-${index}`} onClick={() => setOpen(open === section.label ? null : section.label)} className="flex min-h-11 w-full items-center gap-3 px-5 py-3 text-left text-sm hover:bg-surface-2 focus-visible:outline-2 focus-visible:outline-accent">
          <span className="flex-1">{section.label}</span><span className="rounded-sm bg-surface-3 px-2 font-mono text-xs text-accent">{section.items.length}</span><ChevronDown size={16} aria-hidden className={open === section.label ? "rotate-180" : ""} />
        </button>
        <div id={`${id}-${index}`} hidden={open !== section.label} className="bg-surface-2 px-5 py-4"><ul className="space-y-3 pl-4 text-sm list-disc">{section.items.map((item, i) => <li key={i}>{text(item)}</li>)}</ul></div>
      </section>)}
      {take.nextMove && <section className="space-y-3 border-t border-hairline p-5"><p className="font-mono text-xs text-accent">Next move</p>{text(take.nextMove)}</section>}
      {take.confidence && <footer className="border-t border-hairline bg-surface-2 p-5 text-sm text-text-2">{text(`Confidence: ${take.confidence.level} - ${take.confidence.basis}`)}</footer>}
    </article>
  </div>
}
