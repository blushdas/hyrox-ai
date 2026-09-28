"use client"

import { usePlanStore } from "@/stores/plan-store"
import { useRouter } from "next/navigation"
import { PageHeader, Section, Skeleton } from "@/components/shell/primitives"
import { TrainSegments, PlanWeekRow } from "@/components/train/train-components"
import { getPlanOverview } from "@/lib/train/selectors"
import type { Phase } from "@/lib/types"
const descriptions: Record<Phase,string> = { foundation:"Movement prep and aerobic foundation.",base:"Build a consistent aerobic foundation.",build:"Develop pace and station volume.",peak:"Practice race pace and full simulations.",taper:"Sharpen, recover, arrive ready." }
export default function PlanPage() {
  const { plan, currentWeek, setCurrentWeek } = usePlanStore()
  const router = useRouter()
  if (!plan) return <Skeleton />
  const rows = getPlanOverview(plan)
  const phases = [...new Set(rows.map(r=>r.phase))]
  const maxLoad = Math.max(0,...rows.map(r=>r.load))
  return <><PageHeader title="Plan" meta={`${plan.totalWeeks} WEEKS · RACE ${new Date(plan.raceDate+"T00:00:00").toLocaleDateString("en-GB",{day:"2-digit",month:"short",year:"numeric"})}`}/><TrainSegments plan/>{phases.map(phase=>{const group=rows.filter(r=>r.phase===phase);return <Section key={phase} label={`${phase} · WK ${group[0].week}–${group[group.length-1].week}`}><p className="mb-4 text-sm text-text-2">{descriptions[phase]}</p>{group.map(row=><PlanWeekRow key={row.week} row={row} maxLoad={maxLoad} active={row.week===currentWeek} onSelect={()=>{setCurrentWeek(row.week);router.push("/dashboard")}}/>)}</Section>})}</>
}
