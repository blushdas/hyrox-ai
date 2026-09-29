"use client"

import { Button as ButtonPrimitive } from "@base-ui/react/button"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-md border border-transparent px-4 text-sm font-medium transition-colors disabled:pointer-events-none disabled:opacity-50 [&_svg]:size-5",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90",
        outline: "border-hairline bg-background hover:bg-surface-3",
        secondary: "border-hairline bg-surface-2 hover:bg-surface-3",
        ghost: "text-text-2 hover:bg-surface-2 hover:text-foreground",
        destructive: "border-hairline text-danger hover:bg-surface-2",
        link: "text-accent underline-offset-4 hover:underline",
      },
      size: {
        default: "h-11",
        xs: "h-11",
        sm: "h-11",
        lg: "h-12",
        icon: "size-11 p-0",
        "icon-xs": "size-11 p-0",
        "icon-sm": "size-11 p-0",
        "icon-lg": "size-12 p-0",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
)

function Button({
  className,
  variant = "default",
  size = "default",
  ...props
}: ButtonPrimitive.Props & VariantProps<typeof buttonVariants>) {
  return (
    <ButtonPrimitive
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }
