import { COACHES } from "@/lib/people/mock-people"
import { CoachProfile } from "@/components/people/coach-profile"
export function generateStaticParams() {
  if (process.env.CAPACITOR_BUILD !== "1") return []
  return COACHES.map((c) => ({ id: c.id }))
}
export default function CoachPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  return <CoachProfile params={params} />
}
