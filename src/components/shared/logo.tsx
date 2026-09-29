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
    <span
      className={cn(
        "font-semibold tracking-tight",
        sizeClasses[size],
        className,
      )}
    >
      <span className="text-primary">F</span>
      <span className="text-foreground">INISHER</span>
    </span>
  )
}
