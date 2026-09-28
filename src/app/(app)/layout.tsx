import { AppShell } from "@/components/shell/app-shell"
import { PlanGuard } from "@/components/app/plan-guard"

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <AppShell><PlanGuard>{children}</PlanGuard></AppShell>
  )
}
