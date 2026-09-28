"use client"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { CalendarDays, MessageSquareText, Users, CircleUser } from "lucide-react"
import { Logo } from "@/components/shared/logo"
const items = [
  { href: "/dashboard", label: "Train", icon: CalendarDays },
  { href: "/coach-ai", label: "Coach AI", icon: MessageSquareText },
  { href: "/people", label: "People", icon: Users },
  { href: "/profile", label: "Profile", icon: CircleUser },
]
function NavLinks({ rail = false }: { rail?: boolean }) {
  const path = usePathname()
  return items.map(({ href, label, icon: Icon }, i) => {
    const active = i === 0 ? ["/dashboard", "/plan", "/session"].some(p => path === p || path.startsWith(p + "/")) : path === href || path.startsWith(href + "/")
    return <Link key={href} href={href} aria-current={active ? "page" : undefined} className={`${rail ? "flex-row gap-3 px-4 border-l-2" : "flex-col gap-1 border-t-2 font-mono text-[11px]"} flex min-h-14 items-center justify-center lg:justify-start ${active ? "border-accent text-accent" : "border-transparent text-text-2 hover:bg-surface-2"}`}><Icon size={20} strokeWidth={1.5} />{label}</Link>
  })
}
export function TabBar() { return <nav aria-label="Primary" className="fixed bottom-0 inset-x-0 z-40 grid grid-cols-4 border-t bg-background pb-[env(safe-area-inset-bottom)] lg:hidden"><NavLinks /></nav> }
export function SideRail() { return <aside className="fixed inset-y-0 left-0 hidden w-[232px] border-r bg-background lg:block"><div className="p-6"><Logo /></div><nav aria-label="Primary" className="px-3 pt-6"><NavLinks rail /></nav></aside> }
export function AppShell({ children }: { children: React.ReactNode }) { return <div className="min-h-dvh lg:pl-[232px]"><SideRail /><main className="mx-auto max-w-[728px] px-4 pb-[calc(var(--tab-bar-h)+env(safe-area-inset-bottom)+32px)] sm:px-6 lg:pb-8">{children}</main><TabBar /></div> }
