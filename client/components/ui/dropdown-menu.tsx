"use client"

import React, { useState, useRef, useEffect } from "react"
import { createPortal } from "react-dom"

interface DropdownMenuContextValue {
  open: boolean
  setOpen: (open: boolean) => void
  triggerRef: React.RefObject<HTMLElement | null>
}

const DropdownMenuContext = React.createContext<DropdownMenuContextValue | null>(null)

export function DropdownMenu({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false)
  const triggerRef = useRef<HTMLElement | null>(null)

  return (
    <DropdownMenuContext.Provider value={{ open, setOpen, triggerRef }}>
      <div className="relative">{children}</div>
    </DropdownMenuContext.Provider>
  )
}

export function DropdownMenuTrigger({ children }: { children: React.ReactElement }) {
  const context = React.useContext(DropdownMenuContext)
  const contextRef = useRef(context)
  const elementRef = useRef<HTMLDivElement>(null)

  React.useEffect(() => {
    contextRef.current = context
  }, [context])

  const handleClick = React.useCallback(
    () => {
      if (contextRef.current && elementRef.current) {
        const target = elementRef.current.firstChild as HTMLElement
        const ref = contextRef.current.triggerRef as React.MutableRefObject<HTMLElement | null>
        ref.current = target
        contextRef.current.setOpen(!contextRef.current.open)
      }
    },
    [],
  )

  if (!context) return children

  return (
    <div ref={elementRef} onClick={handleClick}>
      {children}
    </div>
  )
}

export function DropdownMenuContent({
  children,
  className = "",
  align = "start",
  positionAbove = false,
}: {
  children: React.ReactNode
  className?: string
  align?: "start" | "end" | "center"
  positionAbove?: boolean
}) {
  const context = React.useContext(DropdownMenuContext)
  const [style, setStyle] = useState<React.CSSProperties | null>(null)
  const contentRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    if (!context?.open || !context.triggerRef.current) {
      return
    }

    const updatePosition = () => {
      const rect = context.triggerRef.current?.getBoundingClientRect()

      if (!rect) {
        return
      }

      let left = rect.left
      if (align === "end") {
        left = rect.right - 160
      } else if (align === "center") {
        left = rect.left + rect.width / 2 - 80
      }

      const top = positionAbove ? rect.top - 8 : rect.bottom + 8

      setStyle({
        position: "fixed",
        left: Math.max(8, left),
        top,
        transform: positionAbove ? "translateY(-100%)" : "none",
        zIndex: 50,
        minWidth: "160px",
      })
    }

    updatePosition()

    window.addEventListener("resize", updatePosition)
    window.addEventListener("scroll", updatePosition, true)

    const handleClickOutside = (e: MouseEvent) => {
      if (
        contentRef.current &&
        !contentRef.current.contains(e.target as Node) &&
        context.triggerRef.current &&
        !context.triggerRef.current.contains(e.target as Node)
      ) {
        context.setOpen(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)

    return () => {
      window.removeEventListener("resize", updatePosition)
      window.removeEventListener("scroll", updatePosition, true)
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [context?.open, align, positionAbove, context])

  if (!context?.open || !style) {
    return null
  }

  return createPortal(
    <div
      ref={contentRef}
      className={`rounded-md border border-gray-300 bg-gray-50 shadow-md ${className}`}
      style={style}
    >
      {children}
    </div>,
    document.body,
  )
}

export function DropdownMenuGroup({ children }: { children: React.ReactNode }) {
  return <div>{children}</div>
}

export function DropdownMenuLabel({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <div className={`px-2 py-1.5 text-sm font-semibold text-slate-600 ${className}`}>{children}</div>
}

export function DropdownMenuItem({
  children,
  onClick,
  disabled = false,
  className = "",
}: {
  children: React.ReactNode
  onClick?: () => void
  disabled?: boolean
  className?: string
}) {
  const context = React.useContext(DropdownMenuContext)

  const handleClick = () => {
    if (!disabled) {
      onClick?.()
      context?.setOpen(false)
    }
  }

  return (
    <button
      onClick={handleClick}
      disabled={disabled}
      className={`w-full px-2 py-2 text-left text-sm ${
        disabled
          ? "opacity-50 cursor-not-allowed"
          : "hover:bg-gray-100 cursor-pointer text-slate-900"
      } ${className}`}
    >
      {children}
    </button>
  )
}

export function DropdownMenuSeparator() {
  return <div className="my-1 h-px bg-gray-300" />
}

export function DropdownMenuShortcut({ children }: { children: React.ReactNode }) {
  return <span className="ml-auto text-xs text-slate-500">{children}</span>
}

export function DropdownMenuSub({ children }: { children: React.ReactNode }) {
  return <div>{children}</div>
}

export function DropdownMenuSubTrigger({ children }: { children: React.ReactNode }) {
  return <div>{children}</div>
}

export function DropdownMenuSubContent({ children }: { children: React.ReactNode }) {
  return <div>{children}</div>
}

export function DropdownMenuPortal({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
