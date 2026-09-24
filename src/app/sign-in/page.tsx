import { Suspense } from "react";
import { Logo } from "@/components/shared/logo";
import { SignInButtons } from "./sign-in-buttons";

export const metadata = { title: "Sign in — FINISHER" };
export default function SignInPage() {
  return <main className="min-h-screen bg-background flex items-center justify-center px-6 py-12">
    <section className="w-full max-w-sm space-y-8">
      <Logo size="lg" />
      <h1 className="text-3xl font-bold text-white">Sign in</h1>
      <Suspense><SignInButtons /></Suspense>
    </section>
  </main>;
}
