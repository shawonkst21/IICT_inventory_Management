"use client"

import * as React from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"

import { cn } from "../../lib/cn"
import { Button } from "./button"
import { usePopoverContext } from "./popover"

type CalendarProps = {
  mode?: "single"
  selected?: Date
  defaultMonth?: Date
  onSelect?: (date: Date | undefined) => void
  className?: string
}

const dayLabels = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"]

function startOfMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), 1)
}

function addMonths(date: Date, amount: number) {
  return new Date(date.getFullYear(), date.getMonth() + amount, 1)
}

function isSameDay(left: Date, right: Date) {
  return (
    left.getFullYear() === right.getFullYear() &&
    left.getMonth() === right.getMonth() &&
    left.getDate() === right.getDate()
  )
}

function isToday(date: Date) {
  return isSameDay(date, new Date())
}

export function Calendar({ selected, defaultMonth, onSelect, className }: CalendarProps) {
  const [month, setMonth] = React.useState<Date>(() => startOfMonth(defaultMonth ?? selected ?? new Date()))
  const popover = usePopoverContext()

  React.useEffect(() => {
    const nextMonth = startOfMonth(defaultMonth ?? selected ?? new Date())
    setMonth(nextMonth)
  }, [defaultMonth, selected])

  const firstDay = month.getDay()
  const daysInMonth = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate()
  const cells: Array<Date | null> = []

  for (let index = 0; index < firstDay; index += 1) {
    cells.push(null)
  }

  for (let day = 1; day <= daysInMonth; day += 1) {
    cells.push(new Date(month.getFullYear(), month.getMonth(), day))
  }

  while (cells.length % 7 !== 0) {
    cells.push(null)
  }

  const monthLabel = new Intl.DateTimeFormat("en-US", {
    month: "long",
    year: "numeric",
  }).format(month)

  return (
    <div className={cn("w-72 p-3", className)}>
      <div className="mb-3 flex items-center justify-between">
        <Button
          variant="outline"
          className="h-8 w-8 p-0"
          onClick={() => setMonth((current) => addMonths(current, -1))}
          aria-label="Previous month"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <div className="text-sm font-semibold text-black">{monthLabel}</div>
        <Button
          variant="outline"
          className="h-8 w-8 p-0"
          onClick={() => setMonth((current) => addMonths(current, 1))}
          aria-label="Next month"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      <div className="grid grid-cols-7 gap-1 text-center text-xs font-medium text-black">
        {dayLabels.map((label) => (
          <div key={label} className="py-1">
            {label}
          </div>
        ))}
      </div>

      <div className="mt-1 grid grid-cols-7 gap-1">
        {cells.map((date, index) => {
          if (!date) {
            return <div key={`empty-${index}`} className="h-9" />
          }

          const active = selected ? isSameDay(date, selected) : false

          return (
            <button
              key={date.toISOString()}
              type="button"
              onClick={() => {
                onSelect?.(date)
                popover.setOpen(false)
              }}
              className={cn(
                "h-9 rounded-md text-sm text-black transition-colors hover:bg-slate-100",
                active && "bg-slate-900 text-white hover:bg-slate-900",
                !active && isToday(date) && "border border-slate-300",
              )}
            >
              {date.getDate()}
            </button>
          )
        })}
      </div>
    </div>
  )
}
