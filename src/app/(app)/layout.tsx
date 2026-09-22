import { BottomNav } from "@/components/app/bottom-nav"
import { SidebarNav } from "@/components/app/sidebar-nav"
import { PlanGuard } from "@/components/app/plan-guard"

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background">
      <SidebarNav />
      <div className="lg:pl-60">
        <div className="max-w-lg mx-auto lg:max-w-none lg:mx-0 pb-20 lg:pb-0">
          <PlanGuard>{children}</PlanGuard>
        </div>
      </div>
      <BottomNav />
    </div>
  )
}
