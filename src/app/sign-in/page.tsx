import { Suspense } from "react"
import { Logo } from "@/components/shared/logo"
import { SignInButtons } from "./sign-in-buttons"

export const metadata = { title: "Sign in — FINISHER" }
export default function SignInPage() {
  return (
    <main className="flex min-h-dvh items-center justify-center bg-background px-6 py-12">
      <section className="w-full max-w-[380px] text-center">
        <Logo size="lg" className="text-4xl" />
        <p className="mt-2 text-[11px] font-medium uppercase tracking-[0.2em] text-text-3">
          HYROX training
        </p>
        <div className="mt-10 space-y-6 rounded-lg border border-hairline bg-surface-1 p-6 text-left">
          <div className="space-y-1">
            <h1 className="text-[22px] font-semibold leading-7 tracking-tight">
              Sign in
            </h1>
            <p className="text-text-2">Your HYROX plan, session by session.</p>
          </div>
          <Suspense>
            <SignInButtons />
          </Suspense>
        </div>
      </section>
    </main>
  )
}
