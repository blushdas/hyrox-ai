import Link from "next/link"
import { EmptyState } from "@/components/shell/primitives"

export default function NotFound() {
  return (
    <main className="mx-auto max-w-md px-4 py-16">
      <EmptyState
        label="404"
        action={<Link href="/dashboard" className="inline-flex min-h-11 items-center justify-center rounded-md border border-transparent bg-primary px-4 text-sm font-medium text-primary-foreground">Back to Train</Link>}
      >
        That page does not exist.
      </EmptyState>
    </main>
  )
}
