"use client"
import { createContext, useContext, useState } from "react"
import { motion, useReducedMotion } from "framer-motion"
import { motionTransition } from "@/lib/motion"
import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  CalendarDays,
  MessageSquareText,
  Users,
  CircleUser,
} from "lucide-react"
import { Logo } from "@/components/shared/logo"
const items = [
  { href: "/dashboard", label: "Train", icon: CalendarDays },
  { href: "/coach-ai", label: "Coach AI", icon: MessageSquareText },
  { href: "/people", label: "People", icon: Users },
  { href: "/profile", label: "Profile", icon: CircleUser },
]
const RouteMotionContext = createContext({ from: "", to: "" })
export const useRouteMotion = () => useContext(RouteMotionContext)

function NavLinks({ rail = false }: { rail?: boolean }) {
  const path = usePathname()
  const reduced = useReducedMotion()
  const activeIndex = items.findIndex(({ href }, i) => i === 0
    ? ["/dashboard", "/plan", "/session"].some((p) => path === p || path.startsWith(p + "/"))
    : path === href || path.startsWith(href + "/"))
  return <>
    {activeIndex >= 0 && <motion.span
      aria-hidden="true"
      data-nav-indicator={rail ? "rail" : "tabs"}
      layoutId={rail ? "rail-indicator" : "tab-indicator"}
      initial={false}
      animate={rail ? { y: `${activeIndex * 100}%` } : { x: `${activeIndex * 100}%` }}
      transition={motionTransition(reduced)}
      className={rail ? "absolute left-3 right-3 top-6 h-14 rounded-md bg-accent-soft" : "absolute left-0 top-0 h-0.5 w-1/4 bg-accent"}
    />}
    {items.map(({ href, label, icon: Icon }, i) => {
    const active = i === activeIndex
    return (
      <Link
        key={href}
        href={href}
        aria-current={active ? "page" : undefined}
        className={`${rail ? "flex-row gap-3 px-4" : "flex-col gap-1 font-mono text-[11px]"} relative flex min-h-14 items-center justify-center lg:justify-start ${active ? "text-accent" : "text-text-2 hover:bg-surface-2"}`}
      >
        <Icon size={20} strokeWidth={1.5} />
        {label}
      </Link>
    )
  })}</>
}
export function TabBar() {
  return (
    <nav
      aria-label="Primary"
      className="fixed bottom-0 inset-x-0 z-40 grid grid-cols-4 border-t bg-background pb-[env(safe-area-inset-bottom)] lg:hidden"
    >
      <NavLinks />
    </nav>
  )
}
export function SideRail() {
  return (
    <aside className="fixed inset-y-0 left-0 hidden w-[232px] border-r bg-background lg:block">
      <div className="p-6">
        <Logo />
      </div>
      <nav aria-label="Primary" className="relative px-3 pt-6">
        <NavLinks rail />
      </nav>
    </aside>
  )
}
export function AppShell({ children }: { children: React.ReactNode }) {
  const path = usePathname()
  const [route, setRoute] = useState({ from: path, to: path })
  // Preserve the previous path in the layout across template remounts.
  if (route.to !== path) setRoute({ from: route.to, to: path })
  return (
    <RouteMotionContext.Provider value={route}>
    <div className="min-h-dvh lg:pl-[232px]">
      <SideRail />
      <main className="mx-auto min-w-0 max-w-[728px] px-4 pb-[calc(var(--tab-bar-h)+env(safe-area-inset-bottom)+32px)] sm:px-6 lg:pb-8">
        {children}
      </main>
      <TabBar />
    </div>
    </RouteMotionContext.Provider>
  )
}
