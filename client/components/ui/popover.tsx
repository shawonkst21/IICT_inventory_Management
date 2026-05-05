"use client"

import * as React from "react"

import { cn } from "../../lib/cn"

type PopoverContextValue = {
  open: boolean
  setOpen: (open: boolean) => void
}

const PopoverContext = React.createContext<PopoverContextValue | null>(null)

function usePopoverContext() {
  const context = React.useContext(PopoverContext)
  if (!context) {
    throw new Error("Popover components must be used within <Popover />")
  }

  return context
}

function Popover({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = React.useState(false)
  const rootRef = React.useRef<HTMLDivElement | null>(null)

  React.useEffect(() => {
    const handlePointerDown = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false)
      }
    }

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false)
      }
    }

    document.addEventListener("mousedown", handlePointerDown)
    document.addEventListener("keydown", handleEscape)

    return () => {
      document.removeEventListener("mousedown", handlePointerDown)
      document.removeEventListener("keydown", handleEscape)
    }
  }, [])

  return (
    <PopoverContext.Provider value={{ open, setOpen }}>
      <div ref={rootRef} className="relative inline-block">
        {children}
      </div>
    </PopoverContext.Provider>
  )
}

function PopoverTrigger({
  asChild,
  children,
}: {
  asChild?: boolean
  children: React.ReactElement<{
    onClick?: React.MouseEventHandler<HTMLElement>
    "aria-expanded"?: boolean
    "aria-haspopup"?: string
  }>
}) {
  const { open, setOpen } = usePopoverContext()

  if (asChild) {
    return React.cloneElement(children, {
      onClick: (event: React.MouseEvent<HTMLElement>) => {
        children.props.onClick?.(event)
        setOpen(!open)
      },
      "aria-expanded": open,
      "aria-haspopup": "dialog",
    })
  }

  return (
    <button type="button" onClick={() => setOpen(!open)} aria-expanded={open} aria-haspopup="dialog">
      {children}
    </button>
  )
}

function PopoverContent({
  className,
  align = "start",
  children,
}: {
  className?: string
  align?: "start" | "end" | "center"
  children: React.ReactNode
}) {
  const { open } = usePopoverContext()

  if (!open) return null

  const alignmentClasses =
    align === "end" ? "right-0" : align === "center" ? "left-1/2 -translate-x-1/2" : "left-0"

  return (
    <div
      role="dialog"
      className={cn(
        "absolute z-50 mt-2 rounded-md border border-slate-200 bg-white text-black shadow-lg",
        alignmentClasses,
        className,
      )}
    >
      {children}
    </div>
  )
}

export { Popover, PopoverContent, PopoverTrigger, usePopoverContext }
