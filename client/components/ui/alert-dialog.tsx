"use client"

import * as React from "react"
import { createPortal } from "react-dom"

import { cn } from "../../lib/cn"

type AlertDialogContextValue = {
  open: boolean
  onOpenChange: (open: boolean) => void
}

const AlertDialogContext = React.createContext<AlertDialogContextValue | null>(null)

function useAlertDialogContext() {
  const context = React.useContext(AlertDialogContext)
  if (!context) {
    throw new Error("AlertDialog components must be used within <AlertDialog />")
  }

  return context
}

function AlertDialog({
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
    <AlertDialogContext.Provider value={{ open, onOpenChange }}>
      {children}
    </AlertDialogContext.Provider>
  )
}

function AlertDialogContent({ className, children }: { className?: string; children: React.ReactNode }) {
  const { open, onOpenChange } = useAlertDialogContext()
  const [mounted, setMounted] = React.useState(false)

  React.useEffect(() => {
    let closeTimer: ReturnType<typeof setTimeout> | undefined

    if (open) {
      setMounted(true)
    } else {
      closeTimer = setTimeout(() => setMounted(false), 180)
    }

    return () => {
      if (closeTimer) {
        clearTimeout(closeTimer)
      }
    }
  }, [open])

  if (!mounted) return null

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      <button
        type="button"
        aria-label="Close alert dialog overlay"
        className={cn(
          "absolute inset-0 bg-black/50 transition-opacity",
          open ? "opacity-100" : "opacity-0",
        )}
        onClick={() => onOpenChange(false)}
      />

      <div
        role="alertdialog"
        aria-modal="true"
        className={cn(
          "relative z-10 w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 text-black shadow-2xl",
          className,
        )}
        style={{
          animation: open
            ? "alert-dialog-in 180ms ease-out forwards"
            : "alert-dialog-out 140ms ease-in forwards",
        }}
      >
        {children}
      </div>
    </div>,
    document.body,
  )
}

function AlertDialogTrigger({ children }: { children: React.ReactElement }) {
  const { open, onOpenChange } = useAlertDialogContext()

  return React.cloneElement(children, {
    onClick: (event: React.MouseEvent) => {
      children.props.onClick?.(event)
      onOpenChange(!open)
    },
  })
}

function AlertDialogHeader({ className, children }: { className?: string; children: React.ReactNode }) {
  return <div className={cn("space-y-2", className)}>{children}</div>
}

function AlertDialogTitle({ className, children }: { className?: string; children: React.ReactNode }) {
  return <h2 className={cn("text-lg font-semibold text-black", className)}>{children}</h2>
}

function AlertDialogDescription({ className, children }: { className?: string; children: React.ReactNode }) {
  return <p className={cn("text-sm text-slate-600", className)}>{children}</p>
}

function AlertDialogFooter({ className, children }: { className?: string; children: React.ReactNode }) {
  return <div className={cn("mt-6 flex justify-end gap-2", className)}>{children}</div>
}

function AlertDialogAction({ className, children, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      type="button"
      className={cn("rounded-md bg-black px-4 py-2 text-sm font-medium text-white hover:bg-black/90", className)}
      {...props}
    >
      {children}
    </button>
  )
}

function AlertDialogCancel({
  className,
  children,
  onClick,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  const { onOpenChange } = useAlertDialogContext()

  return (
    <button
      type="button"
      className={cn("rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-900 hover:bg-slate-50", className)}
      onClick={(event) => {
        onClick?.(event)
        onOpenChange(false)
      }}
      {...props}
    >
      {children}
    </button>
  )
}

export {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
}