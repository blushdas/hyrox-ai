import { BEGINNER_PLAN_SESSIONS } from "@/lib/hyrox-plan-data"
import SessionDetailPage from "./session-detail"

// The packaged app needs a file for every session; web keeps on-demand routes.
export function generateStaticParams() {
  if (process.env.CAPACITOR_BUILD !== "1") return []

  return BEGINNER_PLAN_SESSIONS.map(({ week, day }) => ({
    id: `w${week}-d${day}`,
  }))
}

export default function SessionPage({ params }: { params: Promise<{ id: string }> }) {
  return <SessionDetailPage params={params} />
}
