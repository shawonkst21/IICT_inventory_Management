"use client"

import Link from "next/link"
import { useEffect, useMemo, useState } from "react"
import { useSearchParams } from "next/navigation"
import {
  AlertCircle,
  CalendarClock,
  History,
  Loader2,
  ArrowLeft,
  CheckCircle2,
  XCircle,
  Clock,
  PackageCheck,
} from "lucide-react"

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "../../../../components/ui/Breadcrumb"

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../../../../components/ui/table"

import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card"

import { fetchItemRequests, type ItemRequestRecord } from "../../../../lib/api"

/* ---------- Utils ---------- */

function isSameDay(left: string, right: Date) {
  return new Date(left).toDateString() === right.toDateString()
}

function formatRequestedAt(value: string) {
  return new Intl.DateTimeFormat("en-GB", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value))
}

/* ---------- Status UI ---------- */

function getStatusConfig(status: string) {
  const s = status.toLowerCase()

  switch (s) {
    case "approved":
      return {
        icon: CheckCircle2,
        className: "bg-emerald-50 text-emerald-700 border-emerald-200",
      }
    case "rejected":
      return {
        icon: XCircle,
        className: "bg-rose-50 text-rose-700 border-rose-200",
      }
    case "issued":
      return {
        icon: PackageCheck,
        className: "bg-blue-50 text-blue-700 border-blue-200",
      }
    default:
      return {
        icon: Clock,
        className: "bg-amber-50 text-amber-700 border-amber-200",
      }
  }
}

/* ---------- Table Component ---------- */

function RequestTable({
  title,
  description,
  icon: Icon,
  requests,
}: {
  title: string
  description: string
  icon: typeof History
  requests: ItemRequestRecord[]
}) {
  const renderRowCells = (
    request: ItemRequestRecord,
    statusClassName: string,
    StatusIcon: typeof Clock
  ) => (
    <>
      <TableCell className="font-medium text-[#1A1916]">
        {request.item_name}
      </TableCell>
      <TableCell>{request.quantity_requested}</TableCell>
      <TableCell>{request.department ?? "-"}</TableCell>
      <TableCell>{request.recipient_room ?? "-"}</TableCell>
      <TableCell className="max-w-50 truncate">
        {request.purpose ?? "-"}
      </TableCell>
      <TableCell>{request.requester_name ?? "Unknown"}</TableCell>

      <TableCell>
        <span
          className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold capitalize ${statusClassName}`}
        >
          <StatusIcon className="w-3.5 h-3.5" />
          {request.status}
        </span>
      </TableCell>

      <TableCell className="whitespace-nowrap text-xs text-[#5A5650]">
        {formatRequestedAt(request.requested_at)}
      </TableCell>
    </>
  )

  return (
    <section className="bg-white rounded-2xl border border-[#E8E5DF] shadow-sm overflow-hidden">
      
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-5 border-b border-[#E8E5DF]">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#1A1916] text-white">
            <Icon className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-[#1A1916]">{title}</h2>
            <p className="text-xs text-[#9A9690]">{description}</p>
          </div>
        </div>

        <span className="text-xs font-medium text-[#9A9690]">
          {requests.length} requests
        </span>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <div className="max-h-120 overflow-y-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-[#FAFAF8] sticky top-0 z-10">
                <TableHead>Item</TableHead>
                <TableHead>Qty</TableHead>
                <TableHead>Department</TableHead>
                <TableHead>Room</TableHead>
                <TableHead>Purpose</TableHead>
                <TableHead>Requester</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Submitted</TableHead>
              </TableRow>
            </TableHeader>

          <TableBody>
            {requests.length > 0 ? (
              <>
                {requests.map((request) => {
                  const status = getStatusConfig(request.status)
                  const StatusIcon = status.icon
                  const isRejectedWithReason =
                    request.status.toLowerCase() === "rejected" &&
                    Boolean(request.rejection_reason)

                  if (isRejectedWithReason) {
                    return (
                      <HoverCard key={request.id}>
                        <HoverCardTrigger asChild>
                          <TableRow className="hover:bg-[#F7F6F3] transition cursor-help">
                            {renderRowCells(
                              request,
                              status.className,
                              StatusIcon
                            )}
                          </TableRow>
                        </HoverCardTrigger>
                        <HoverCardContent
                          side="top"
                          align="center"
                          sideOffset={8}
                          className="w-72 border border-rose-200 bg-rose-50 text-rose-900"
                        >
                          <p className="text-xs font-semibold uppercase tracking-wide text-rose-700">
                            Rejection Reason
                          </p>
                          <p className="mt-1 text-sm leading-relaxed">
                            {request.rejection_reason}
                          </p>
                        </HoverCardContent>
                      </HoverCard>
                    )
                  }

                  return (
                    <TableRow
                      key={request.id}
                      className="hover:bg-[#F7F6F3] transition"
                    >
                      {renderRowCells(request, status.className, StatusIcon)}
                    </TableRow>
                  )
                })}
              </>
            ) : (
              <TableRow>
                <TableCell
                  colSpan={8}
                  className="py-10 text-center text-[#9A9690]"
                >
                  No requests found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
        </div>
      </div>
    </section>
  )
}

/* ---------- Main Page ---------- */

export default function ItemRequestHistoryPage() {
  const searchParams = useSearchParams()
  const [requests, setRequests] = useState<ItemRequestRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    const loadRequests = async () => {
      setLoading(true)
      setError("")
      try {
        const requestList = await fetchItemRequests()
        setRequests(requestList)
      } catch (err) {
        setError((err as Error).message || "Failed to load item requests")
      } finally {
        setLoading(false)
      }
    }

    void loadRequests()
  }, [])

  const today = useMemo(() => new Date(), [])

  const todaysRequests = useMemo(
    () => requests.filter((r) => isSameDay(r.requested_at, today)),
    [requests, today]
  )

  const historyRequests = useMemo(
    () => requests.filter((r) => !isSameDay(r.requested_at, today)),
    [requests, today]
  )

  return (
    <div className="min-h-screen w-full bg-[#F7F6F3] px-8 py-8 font-['DM_Sans',sans-serif]">

      {/* Breadcrumb */}
      <div className="mb-6">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="/">Home</BreadcrumbLink>
            </BreadcrumbItem>
           
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink href="/lab_Assistant/item-requests">
                Item Requests
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>History</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </div>

      {/* Header */}
      <div className="mb-8 flex flex-col md:flex-row md:items-end md:justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full bg-[#ECEAE5] px-3 py-1 mb-4">
            <History className="w-3.5 h-3.5 text-[#5A5650]" />
            <span className="text-xs font-medium text-[#5A5650] uppercase">
              Inventory
            </span>
          </div>

          <h1 className="text-4xl font-semibold text-[#1A1916] mb-2">
            Request History
          </h1>

          <p className="text-sm text-[#9A9690] max-w-md">
            Track today&apos;s requests and review past submissions in one place.
          </p>
        </div>

        <Link
          href="/lab_Assistant/item-requests"
          className="inline-flex items-center gap-2 rounded-md bg-[#1A1916] px-4 py-2 text-sm font-semibold text-white hover:bg-[#2D2B27] transition"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </Link>
      </div>

      {/* Success */}
      {searchParams.get("submitted") === "1" && (
        <div className="mb-6 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-emerald-700 text-sm">
          Item request submitted successfully.
        </div>
      )}

      {/* States */}
      {loading ? (
        <div className="flex items-center justify-center bg-white border border-[#E8E5DF] rounded-2xl py-16">
          <Loader2 className="w-5 h-5 animate-spin mr-2" />
          Loading...
        </div>
      ) : error ? (
        <div className="flex items-start gap-2 bg-rose-50 border border-rose-200 px-4 py-3 rounded-xl text-rose-700">
          <AlertCircle className="w-4 h-4 mt-0.5" />
          {error}
        </div>
      ) : (
        <div className="space-y-8">
          <RequestTable
            title="Today's Requests"
            description="Submitted today"
            icon={CalendarClock}
            requests={todaysRequests}
          />

          <RequestTable
            title="Request History"
            description="Older submissions"
            icon={History}
            requests={historyRequests}
          />
        </div>
      )}
    </div>
  )
}