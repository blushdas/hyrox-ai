import { cn } from "@/lib/utils"

type LogoProps = {
  className?: string
  size?: "sm" | "md" | "lg"
}

export function Logo({ className, size = "md" }: LogoProps) {
  const sizeClasses = {
    sm: "text-lg",
    md: "text-xl",
    lg: "text-3xl",
  }

  return (
    <span className={cn("font-black tracking-tighter", sizeClasses[size], className)}>
      <span className="text-primary">F</span>
      <span className="text-white">INISHER</span>
    </span>
  )
}
