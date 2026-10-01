"use client"
import { useEffect, useRef, useState } from "react"
import { Check, Copy, RotateCcw } from "lucide-react"
import { toCopyText } from "@/lib/coach-ai/copy-text"

export function MessageActions({ content, regenerate, disabled, onRetry }: {
  content: string; regenerate: boolean; disabled: boolean; onRetry: () => void
}) {
  const [copied, setCopied] = useState(false)
  const [error, setError] = useState("")
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  useEffect(() => () => clearTimeout(timer.current), [])
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(toCopyText(content))
      setError("")
      setCopied(true)
      clearTimeout(timer.current)
      timer.current = setTimeout(() => setCopied(false), 2000)
    } catch (error) {
      console.error("Could not copy coach response", error)
      setError("Copy failed. Please try again.")
    }
  }
  return <div className="mt-3 flex flex-wrap items-center gap-1 text-text-2">
    <button type="button" aria-label="Copy message" onClick={copy} className="flex min-h-11 min-w-11 items-center justify-center rounded-sm hover:bg-surface-2">{copied ? <Check size={16} aria-hidden /> : <Copy size={16} aria-hidden />}</button>
    {regenerate && <button type="button" aria-label="Regenerate response" disabled={disabled} onClick={onRetry} className="flex min-h-11 min-w-11 items-center justify-center rounded-sm hover:bg-surface-2 disabled:opacity-40"><RotateCcw size={16} aria-hidden /></button>}
    <span role="status" className="text-xs">{error || (copied ? "Copied" : "")}</span>
  </div>
}
