import { LoaderCircle } from "lucide-react"
import { Logo } from "@/components/shared/logo"

export function PlanLoader() {
  return (
    <div className="fixed inset-0 z-50 flex min-h-dvh items-center justify-center bg-background px-6 text-foreground">
      <div role="status" aria-live="polite" className="flex max-w-sm flex-col items-center text-center">
        <Logo size="lg" />
        <LoaderCircle
          aria-hidden="true"
          className="my-8 size-12 animate-spin text-primary motion-reduce:animate-none"
          strokeWidth={1.5}
        />
        <h1 className="text-2xl font-black tracking-tight">Building your plan...</h1>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
          Your training starts here. Getting everything ready for race day.
        </p>
      </div>
    </div>
  )
}
