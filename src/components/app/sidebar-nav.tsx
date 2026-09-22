"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Calendar, ListTodo, User } from "lucide-react"
import { cn } from "@/lib/utils"
import { Logo } from "@/components/shared/logo"

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: Calendar },
  { href: "/plan", label: "Training Plan", icon: ListTodo },
  { href: "/profile", label: "Profile", icon: User },
]

export function SidebarNav() {
  const pathname = usePathname()

  return (
    <aside className="hidden lg:flex flex-col w-60 min-h-screen bg-[#0D0D0D] border-r border-[#1A1A1A] fixed top-0 left-0 z-40">
      {/* Logo */}
      <div className="px-5 py-5 border-b border-[#1A1A1A]">
        <Logo size="md" />
      </div>

      {/* Nav items */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {navItems.map((item) => {
          const active = pathname.startsWith(item.href)
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 text-sm font-medium transition-colors rounded-md",
                active
                  ? "text-primary border-l-2 border-primary -ml-px pl-[calc(0.75rem-1px)]"
                  : "text-[#6B7280] hover:bg-[rgba(255,255,255,0.03)] hover:text-white"
              )}
            >
              <item.icon className="w-4 h-4 flex-shrink-0" />
              {item.label}
              {active && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-primary" />}
            </Link>
          )
        })}
      </nav>

      {/* Profile footer */}
      <div className="px-3 py-4 border-t border-[#1A1A1A]">
        <Link
          href="/profile"
          className="flex items-center gap-3 px-3 py-2.5 rounded-md text-sm text-[#6B7280] hover:text-white hover:bg-[rgba(255,255,255,0.03)] transition-colors"
        >
          <User className="w-4 h-4 text-[#6B7280]" />
          <span className="font-medium">Profile</span>
        </Link>
      </div>
    </aside>
  )
}
