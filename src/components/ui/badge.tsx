import * as React from "react"
import { cn } from "@/lib/utils"

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "success" | "warning" | "destructive" | "outline"
}

function Badge({ className, variant = "default", ...props }: BadgeProps) {
  const variants = {
    default: "bg-indigo-600/20 text-indigo-400 border border-indigo-600/50",
    success: "bg-emerald-600/20 text-emerald-400 border border-emerald-600/50",
    warning: "bg-amber-600/20 text-amber-400 border border-amber-600/50",
    destructive: "bg-red-600/20 text-red-400 border border-red-600/50",
    outline: "text-slate-200 border border-slate-700",
  }

  return (
    <div
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
        variants[variant],
        className
      )}
      {...props}
    />
  )
}

export { Badge }
