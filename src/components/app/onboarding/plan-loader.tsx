import { Logo } from "@/components/shared/logo"

export function PlanLoader() {
  return (
    <div className="fixed inset-0 z-50 flex min-h-dvh items-start pt-[24vh] justify-center bg-background px-6 text-foreground">
      <div role="status" aria-live="polite" className="flex w-full max-w-sm flex-col items-start text-left">
        <Logo size="lg" />
        <h1 className="mt-8 text-[22px] font-semibold tracking-tight">Building your plan...</h1>
        <div aria-hidden="true" className="my-5 h-0.5 w-full overflow-hidden bg-hairline"><div className="plan-progress h-full w-1/3 bg-accent motion-reduce:w-full" /></div>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
          Your training starts here. Getting everything ready for race day.
        </p>
      </div>
    </div>
  )
}
