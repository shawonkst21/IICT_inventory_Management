"use client"

import * as React from "react"
import { ChevronDown as ChevronDownIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

type DatePickerProps = {
  value?: string
  onChange: (value: string) => void
  placeholder?: string
}

function toDateInputValue(date: Date): string {
  return date.toISOString().slice(0, 10)
}

function parseInputToDate(value?: string): Date | undefined {
  if (!value) return undefined
  const d = new Date(value)
  return Number.isNaN(d.getTime()) ? undefined : d
}

function formatDateLabel(date: Date): string {
  return new Intl.DateTimeFormat("en-US", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(date)
}

export default function DatePicker({ value, onChange, placeholder }: DatePickerProps) {
  const date = parseInputToDate(value)

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          data-empty={!date}
          className="w-53 justify-between text-left font-normal text-black data-[empty=true]:text-slate-500"
        >
          {date ? formatDateLabel(date) : <span>{placeholder || "Pick a date"}</span>}
          <ChevronDownIcon className="text-black" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="bottom-full mb-2 mt-0 w-auto p-0 text-black" align="start">
        <Calendar
          mode="single"
          selected={date}
          onSelect={(d) => {
            if (!d) return
            onChange(toDateInputValue(d))
          }}
          defaultMonth={date}
        />
      </PopoverContent>
    </Popover>
  )
}
