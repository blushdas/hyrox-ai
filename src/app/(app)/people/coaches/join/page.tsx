"use client"
import { useState } from "react"
import Link from "next/link"
import { toast } from "sonner"
import { PageHeader } from "@/components/shell/primitives"
import { Button } from "@/components/ui/button"
export default function JoinPage() {
  const [notified, setNotified] = useState(false)
  return (
    <>
      <Link
        href="/people/coaches"
        aria-label="Back to coaches"
        className="inline-flex min-h-11 items-center text-text-2"
      >
        ← Coaches
      </Link>
      <PageHeader title="Coach on FINISHER" />
      <p className="my-6 text-text-2">
        For coaches who build structured race preparation and help athletes
        train consistently. Every application will be reviewed before a profile
        is listed.
      </p>
      <ol>
        {[
          "Submit credentials",
          "Identity and certification check",
          "Profile review and verified badge",
        ].map((s, i) => (
          <li key={s} className="flex gap-4 border-b py-5">
            <span className="font-mono text-text-3">0{i + 1}</span>
            {s}
          </li>
        ))}
      </ol>
      <p className="my-6 text-text-2">Applications are not open yet.</p>
      <Button
        className="w-full"
        disabled={notified}
        onClick={() => {
          toast("We will let you know when applications open.")
          setNotified(true)
        }}
      >
        {notified ? "On the list" : "Notify me"}
      </Button>
    </>
  )
}
