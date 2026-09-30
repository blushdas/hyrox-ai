"use client"

import { motion, useReducedMotion } from "framer-motion"
import { useRouteMotion } from "@/components/shell/app-shell"
import { motionTransition, routeDirection } from "@/lib/motion"

export default function AppTemplate({ children }: { children: React.ReactNode }) {
  const reduced = useReducedMotion()
  const { from, to } = useRouteMotion()
  return (
    <motion.div
      key={to}
      data-route-motion
      initial={{ opacity: reduced ? 1 : 0, x: reduced ? 0 : routeDirection(from, to) * 16, y: reduced ? 0 : 8 }}
      animate={{ opacity: 1, x: 0, y: 0 }}
      transition={motionTransition(reduced)}
    >
      {children}
    </motion.div>
  )
}
