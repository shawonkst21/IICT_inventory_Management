"use client"

import React, {
	cloneElement,
	createContext,
	isValidElement,
	useContext,
	useEffect,
	useMemo,
	useRef,
	useState,
} from "react"
import { createPortal } from "react-dom"

type TooltipContextValue = {
	open: boolean
	setOpen: (open: boolean) => void
	triggerRef: React.RefObject<HTMLElement | null>
}

const TooltipContext = createContext<TooltipContextValue | null>(null)

export function Tooltip({ children }: { children: React.ReactNode }) {
	const [open, setOpen] = useState(false)
	const triggerRef = useRef<HTMLElement | null>(null)

	const value = useMemo(() => ({ open, setOpen, triggerRef }), [open])

	return <TooltipContext.Provider value={value}>{children}</TooltipContext.Provider>
}

export function TooltipTrigger({
	children,
}: {
	children: React.ReactElement
}) {
	const context = useContext(TooltipContext)

	if (!context || !isValidElement(children)) {
		return children
	}

	return cloneElement(children as React.ReactElement<any>, {
		ref: context.triggerRef,
		onMouseEnter: (event: React.MouseEvent<HTMLElement>) => {
			children.props.onMouseEnter?.(event)
			context.setOpen(true)
		},
		onMouseLeave: (event: React.MouseEvent<HTMLElement>) => {
			children.props.onMouseLeave?.(event)
			context.setOpen(false)
		},
		onFocus: (event: React.FocusEvent<HTMLElement>) => {
			children.props.onFocus?.(event)
			context.setOpen(true)
		},
		onBlur: (event: React.FocusEvent<HTMLElement>) => {
			children.props.onBlur?.(event)
			context.setOpen(false)
		},
	})
}

export function TooltipContent({
	children,
	className = "",
}: {
	children: React.ReactNode
	className?: string
}) {
	const context = useContext(TooltipContext)
	const [style, setStyle] = useState<React.CSSProperties | null>(null)
	const [placement, setPlacement] = useState<"left" | "right">("right")

	useEffect(() => {
		if (!context?.open || !context.triggerRef.current) {
			setStyle(null)
			return
		}

		const updatePosition = () => {
			const rect = context.triggerRef.current?.getBoundingClientRect()

			if (!rect) {
				return
			}

			const tooltipWidth = 220
			const preferredLeft = rect.right + 12
			const fitsRight = preferredLeft + tooltipWidth <= window.innerWidth
			const left = fitsRight
				? preferredLeft
				: Math.max(12, rect.left - tooltipWidth - 12)
			const nextPlacement = fitsRight ? "right" : "left"

			setPlacement(nextPlacement)

			setStyle({
				position: "fixed",
				left,
				top: rect.top + rect.height / 2,
				transform: "translateY(-50%)",
				zIndex: 80,
				maxWidth: `${tooltipWidth}px`,
			})
		}

		updatePosition()

		window.addEventListener("resize", updatePosition)
		window.addEventListener("scroll", updatePosition, true)

		return () => {
			window.removeEventListener("resize", updatePosition)
			window.removeEventListener("scroll", updatePosition, true)
		}
	}, [context?.open])

	if (!context?.open || !style) {
		return null
	}

	return createPortal(
		<div
			role="tooltip"
			className={`pointer-events-none relative inline-flex items-center gap-2 rounded-md bg-slate-900 px-3 py-2 text-sm font-medium text-white shadow-lg ring-1 ring-black/10 ${className}`}
			style={style}
		>
			<span
				aria-hidden="true"
				className={`absolute top-1/2 h-3 w-3 -translate-y-1/2 rotate-45 bg-slate-900 ${
					placement === "right" ? "-left-1.5" : "-right-1.5"
				}`}
			/>
			{children}
		</div>,
		document.body,
	)
}
