"use client"

import { motion, useReducedMotion } from "framer-motion"
import { useRouteMotion } from "@/components/shell/app-shell"
import { springTransition, routeDirection } from "@/lib/motion"

export default function AppTemplate({ children }: { children: React.ReactNode }) {
  const reduced = useReducedMotion()
  const { from, to } = useRouteMotion()
  return (
    <motion.div
      key={to}
      data-route-motion
      initial={{ opacity: 0, x: 0, y: 0 }}
      animate={{ opacity: 1, x: reduced ? 0 : [routeDirection(from, to) * 16, 0], y: reduced ? 0 : [8, 0] }}
      transition={springTransition(reduced)}
    >
      <div className="motion-content">{children}</div>
    </motion.div>
  )
}
