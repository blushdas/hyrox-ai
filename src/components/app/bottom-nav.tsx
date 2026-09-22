"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Calendar, ListTodo, BarChart2, User } from "lucide-react"
import { cn } from "@/lib/utils"

const navItems = [
  { href: "/dashboard", label: "Home", icon: Calendar },
  { href: "/plan", label: "Plan", icon: ListTodo },
  { href: "/profile", label: "Profile", icon: User },
]

export function BottomNav() {
  const pathname = usePathname()

  return (
    <nav className="lg:hidden fixed bottom-0 inset-x-0 z-50 bg-[#0D0D0D] border-t border-[#1A1A1A] h-16">
      <div className="flex items-center justify-around h-full px-4 max-w-lg mx-auto relative">
        {navItems.slice(0, 2).map((item) => {
          const active = pathname.startsWith(item.href)
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center gap-1 px-4 py-2 transition-colors relative",
                active ? "text-primary border-t-2 border-primary -mt-px" : "text-[#6B7280] hover:text-white"
              )}
            >
              <item.icon className="w-5 h-5" />
              <span className="text-[10px] font-medium">{item.label}</span>
            </Link>
          )
        })}

        {/* FAB center */}
        <Link href="/dashboard" className="relative -top-5">
          <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center shadow-lg shadow-black/60">
            <BarChart2 className="w-5 h-5 text-primary-foreground" />
          </div>
        </Link>

        {navItems.slice(2).map((item) => {
          const active = pathname.startsWith(item.href)
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center gap-1 px-4 py-2 transition-colors relative",
                active ? "text-primary border-t-2 border-primary -mt-px" : "text-[#6B7280] hover:text-white"
              )}
            >
              <item.icon className="w-5 h-5" />
              <span className="text-[10px] font-medium">{item.label}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
