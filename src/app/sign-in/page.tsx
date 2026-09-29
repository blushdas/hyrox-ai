import { Suspense } from "react"
import { Logo } from "@/components/shared/logo"
import { SignInButtons } from "./sign-in-buttons"

export const metadata = { title: "Sign in — FINISHER" }
export default function SignInPage() {
  return (
    <main className="min-h-dvh bg-background px-6 pt-[18vh] pb-12 lg:mx-auto lg:max-w-[1280px] lg:pl-32">
      <section className="w-full max-w-[360px] space-y-6 lg:border-l lg:pl-8">
        <Logo size="lg" />
        <h1 className="text-[22px] font-semibold leading-7 tracking-tight">
          Sign in
        </h1>
        <p className="text-text-2">Your HYROX plan, session by session.</p>
        <Suspense>
          <SignInButtons />
        </Suspense>
      </section>
    </main>
  )
}
