"use client"

import { useState } from "react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

type WaitlistFormProps = {
  className?: string
  buttonText?: string
}

export function WaitlistForm({ className, buttonText = "Get Early Access" }: WaitlistFormProps) {
  const [email, setEmail] = useState("")
  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!email) return

    setLoading(true)
    try {
      const res = await fetch("/api/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      })

      const data = await res.json()

      if (res.ok || data.message === "Already on waitlist") {
        setSubmitted(true)
        localStorage.setItem("finisher-waitlist-email", email)
        toast.success("You're on the list!", {
          description: "We'll reach out when the alpha launches.",
        })
      } else {
        toast.error(data.error || "Something went wrong")
      }
    } catch {
      toast.error("Failed to submit. Try again.")
    } finally {
      setLoading(false)
    }
  }

  if (submitted) {
    return (
      <div className="flex items-center gap-3 p-4 rounded-lg bg-primary/10 border border-primary/30">
        <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
        <span className="text-sm text-primary font-medium">You&apos;re on the list. We&apos;ll be in touch.</span>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className={className}>
      <div className="flex flex-col sm:flex-row gap-3">
        <Input
          type="email"
          placeholder="your@email.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="bg-surface border-border text-white placeholder:text-muted-foreground h-12 flex-1"
        />
        <Button
          type="submit"
          disabled={loading}
          className="h-12 px-6 bg-primary text-primary-foreground font-semibold hover:bg-primary/90 shrink-0"
        >
          {loading ? "Joining..." : buttonText}
        </Button>
      </div>
    </form>
  )
}
