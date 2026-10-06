"use client"

import { useEffect } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { EmptyState } from "@/components/shell/primitives"

export default function AppError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error("App route error", error.name, error.digest)
  }, [error])
  return (
    <EmptyState
      label="Something went wrong"
      action={
        <div className="flex gap-3">
          <Button onClick={reset}>Try again</Button>
          <Link href="/dashboard" className="inline-flex min-h-11 items-center justify-center rounded-md border border-hairline px-4 text-sm font-medium">Back to Train</Link>
        </div>
      }
    >
      This page hit an unexpected error. Your plan and progress are safe.
    </EmptyState>
  )
}
