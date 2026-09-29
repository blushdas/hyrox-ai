"use client"
import { useEffect, useRef } from "react"
import Link from "next/link"
import { X } from "lucide-react"
import type { SessionStatus } from "@/lib/types"
export function MonoLabel({
  children,
  className = "",
}: {
  children: React.ReactNode
  className?: string
}) {
  return (
    <span
      className={`font-mono text-[11px] leading-[14px] tracking-[0.08em] uppercase text-text-3 ${className}`}
    >
      {children}
    </span>
  )
}
export function PageHeader({
  title,
  meta,
  action,
}: {
  title: string
  meta?: React.ReactNode
  action?: React.ReactNode
}) {
  return (
    <header className="sticky top-0 z-20 border-b bg-background pt-[env(safe-area-inset-top)]">
      <div className="flex min-h-24 items-center justify-between gap-4 py-5">
        <div className="min-w-0">
          {meta && <MonoLabel>{meta}</MonoLabel>}
          <h1 className="mt-1 text-[22px] font-semibold leading-7 tracking-[-0.015em]">
            {title}
          </h1>
        </div>
        {action}
      </div>
    </header>
  )
}
export function Section({
  label,
  action,
  children,
}: {
  label: string
  action?: React.ReactNode
  children: React.ReactNode
}) {
  return (
    <section className="mt-8">
      <div className="mb-3 flex items-center justify-between gap-3">
        <h2>
          <MonoLabel>{label}</MonoLabel>
        </h2>
        {action}
      </div>
      {children}
    </section>
  )
}
export function IntensityTicks({
  intensity,
  accent = false,
}: {
  intensity: number
  accent?: boolean
}) {
  return (
    <span
      className="inline-flex gap-1"
      role="img"
      aria-label={`Intensity ${intensity} of 5`}
    >
      {[1, 2, 3, 4, 5].map((n) => (
        <span
          key={n}
          className={`h-2.5 w-[3px] rounded-xs ${n <= intensity ? (accent ? "bg-accent" : "bg-text-2") : "bg-hairline"}`}
        />
      ))}
    </span>
  )
}
export function StatusGlyph({ status }: { status?: SessionStatus }) {
  return (
    <span
      role="img"
      aria-label={status ?? "Rest"}
      className={`relative inline-flex size-4 shrink-0 items-center justify-center ${status === "completed" ? "bg-accent rounded-xs" : status ? "border border-hairline-strong rounded-xs" : "text-text-3"}`}
    >
      {status === "skipped" ? (
        <span className="h-px w-4 -rotate-45 bg-status-skip" />
      ) : !status ? (
        "–"
      ) : null}
    </span>
  )
}
export function EmptyState({
  label,
  children,
  action,
}: {
  label: string
  children: React.ReactNode
  action?: React.ReactNode
}) {
  return (
    <div className="py-8">
      <MonoLabel>{label}</MonoLabel>
      <p className="mt-3 mb-4 text-text-2">{children}</p>
      {action}
    </div>
  )
}
export function ErrorState({ children }: { children: React.ReactNode }) {
  return (
    <div role="alert" className="py-4 text-danger">
      {children}
    </div>
  )
}
export function Skeleton() {
  return (
    <div
      aria-label="Loading plan"
      role="status"
      className="space-y-4 py-6 motion-safe:animate-pulse"
    >
      <div className="h-60 rounded-md border" />
      <div className="h-24 border" />
      {[1, 2, 3, 4].map((n) => (
        <div key={n} className="h-20 border-b" />
      ))}
    </div>
  )
}
export function Segments({
  items,
}: {
  items: { href: string; label: string; active: boolean }[]
}) {
  return (
    <div className="my-5 flex border-b">
      {items.map((i) => (
        <Link
          key={i.href}
          href={i.href}
          aria-current={i.active ? "page" : undefined}
          className={`min-h-11 px-5 py-3 text-sm ${i.active ? "border-b-2 border-accent bg-accent-soft text-foreground" : "text-text-2"}`}
        >
          {i.label}
        </Link>
      ))}
    </div>
  )
}
export function Sheet({
  open,
  onClose,
  title,
  children,
}: {
  open: boolean
  onClose: () => void
  title: string
  children: React.ReactNode
}) {
  const ref = useRef<HTMLDialogElement>(null)
  useEffect(() => {
    const d = ref.current
    if (open && d && !d.open) d.showModal()
    if (!open && d?.open) d.close()
  }, [open])
  return (
    <dialog
      ref={ref}
      onCancel={onClose}
      onClose={onClose}
      aria-label={title}
      className="fixed inset-x-0 top-auto bottom-0 m-0 max-h-[90dvh] w-full max-w-none overflow-y-auto rounded-t-lg border bg-surface-1 p-4 pb-[calc(env(safe-area-inset-bottom)+24px)] text-foreground backdrop:bg-background sm:mx-auto sm:max-w-lg"
    >
      <div className="mb-5 flex items-center justify-between">
        <h2 className="text-[22px] font-semibold">{title}</h2>
        <button
          onClick={onClose}
          aria-label="Close sheet"
          className="flex size-11 items-center justify-center"
        >
          <X size={20} />
        </button>
      </div>
      {children}
    </dialog>
  )
}
