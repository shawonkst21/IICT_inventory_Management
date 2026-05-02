import * as React from "react"

import { cn } from "../../lib/cn"

type ButtonVariant = "default" | "outline"

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant
}

export function Button({ className, variant = "default", type = "button", ...props }: ButtonProps) {
  const baseClasses =
    "inline-flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-slate-500 disabled:pointer-events-none disabled:opacity-50"
  const variantClasses =
    variant === "outline"
      ? "border border-slate-300 bg-white text-slate-900 hover:bg-slate-50"
      : "bg-slate-900 text-white hover:bg-slate-800"

  return <button type={type} className={cn(baseClasses, variantClasses, className)} {...props} />
}
