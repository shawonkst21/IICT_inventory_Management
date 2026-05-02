"use client"

import * as React from "react"

import { cn } from "../../lib/cn"

type SheetContextValue = {
  open: boolean
  onOpenChange: (open: boolean) => void
}

const SheetContext = React.createContext<SheetContextValue | null>(null)

function useSheetContext() {
  const context = React.useContext(SheetContext)
  if (!context) {
    throw new Error("Sheet components must be used within <Sheet />")
  }

  return context
}

function Sheet({
  open,
  onOpenChange,
  children,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  children: React.ReactNode
}) {
  React.useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onOpenChange(false)
      }
    }

    document.addEventListener("keydown", handleEscape)
    return () => document.removeEventListener("keydown", handleEscape)
  }, [onOpenChange])

  return (
    <SheetContext.Provider value={{ open, onOpenChange }}>
      {children}
    </SheetContext.Provider>
  )
}

function SheetContent({ className, children }: { className?: string; children: React.ReactNode }) {
  const { open, onOpenChange } = useSheetContext()
  const [mounted, setMounted] = React.useState(false)

  React.useEffect(() => {
    let closeTimer: ReturnType<typeof setTimeout> | undefined

    if (open) {
      setMounted(true)
    } else {
      closeTimer = setTimeout(() => setMounted(false), 220)
    }

    return () => {
      if (closeTimer) {
        clearTimeout(closeTimer)
      }
    }
  }, [open])

  if (!mounted) return null

  return (
    <div className="fixed inset-0 z-50">
      <button
        type="button"
        aria-label="Close sheet overlay"
        className={cn(
          "absolute inset-0 bg-black/40",
          open ? "opacity-100" : "opacity-0",
        )}
        style={{
          animation: open
            ? "sheet-overlay-in 220ms ease-out forwards"
            : "sheet-overlay-out 180ms ease-in forwards",
        }}
        onClick={() => onOpenChange(false)}
      />

      <div
        className={cn(
          "absolute right-0 top-0 h-full w-full max-w-xl border-l border-slate-200 bg-white text-black shadow-2xl will-change-transform",
          className,
        )}
        style={{
          animation: open
            ? "sheet-slide-in 220ms cubic-bezier(0.16, 1, 0.3, 1) forwards"
            : "sheet-slide-out 180ms cubic-bezier(0.4, 0, 0.2, 1) forwards",
        }}
      >
        {children}
      </div>
    </div>
  )
}

function SheetHeader({ className, children }: { className?: string; children: React.ReactNode }) {
  return <div className={cn("border-b border-slate-200 px-6 py-5", className)}>{children}</div>
}

function SheetTitle({ className, children }: { className?: string; children: React.ReactNode }) {
  return <h2 className={cn("text-lg font-semibold text-black", className)}>{children}</h2>
}

function SheetDescription({ className, children }: { className?: string; children: React.ReactNode }) {
  return <p className={cn("mt-1 text-sm text-slate-600", className)}>{children}</p>
}

export { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle }
