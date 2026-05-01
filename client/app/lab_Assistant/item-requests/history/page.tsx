"use client"

import Link from "next/link"
import { useEffect, useMemo, useState } from "react"
import { useSearchParams } from "next/navigation"
import { AlertCircle, CalendarClock, History, Loader2, ArrowLeft } from "lucide-react"

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
import { fetchItemRequests, type ItemRequestRecord } from "../../../../lib/api"

function isSameDay(left: string, right: Date) {
  return new Date(left).toDateString() === right.toDateString()
}

function formatRequestedAt(value: string) {
  return new Intl.DateTimeFormat("en-GB", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value))
}

function statusClassName(status: string) {
  switch (status.toLowerCase()) {
    case "approved":
      return "bg-emerald-100 text-emerald-800 border-emerald-200"
    case "rejected":
      return "bg-red-100 text-red-800 border-red-200"
    case "issued":
      return "bg-blue-100 text-blue-800 border-blue-200"
    default:
      return "bg-amber-100 text-amber-800 border-amber-200"
  }
}

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
  return (
    <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="flex items-center justify-between gap-4 border-b border-slate-200 px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-900 text-white">
            <Icon className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
            <p className="text-sm text-slate-500">{description}</p>
          </div>
        </div>
        <div className="text-sm font-medium text-slate-500">{requests.length} requests</div>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
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
            requests.map((request) => (
              <TableRow key={request.id}>
                <TableCell className="font-medium text-slate-900">{request.item_name}</TableCell>
                <TableCell>{request.quantity_requested}</TableCell>
                <TableCell>{request.department ?? "-"}</TableCell>
                <TableCell>{request.recipient_room ?? "-"}</TableCell>
                <TableCell className="max-w-75 truncate">{request.purpose ?? "-"}</TableCell>
                <TableCell>{request.requester_name ?? "Unknown"}</TableCell>
                <TableCell>
                  <span
                    className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold uppercase tracking-wide ${statusClassName(request.status)}`}
                  >
                    {request.status}
                  </span>
                </TableCell>
                <TableCell className="whitespace-nowrap">{formatRequestedAt(request.requested_at)}</TableCell>
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={8} className="py-10 text-center text-slate-500">
                No requests found.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </section>
  )
}

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
      } catch (requestError) {
        setError((requestError as Error).message || "Failed to load item requests")
      } finally {
        setLoading(false)
      }
    }

    void loadRequests()
  }, [])

  const today = useMemo(() => new Date(), [])
  const todaysRequests = useMemo(
    () => requests.filter((request) => isSameDay(request.requested_at, today)),
    [requests, today],
  )
  const historyRequests = useMemo(
    () => requests.filter((request) => !isSameDay(request.requested_at, today)),
    [requests, today],
  )

  return (
    <div className="min-h-full bg-linear-to-br from-slate-50 to-slate-100 p-8">
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href="/">Home</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink href="/lab_Assistant">Staff Dashboard</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink href="/lab_Assistant/item-requests">Item Requests</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>History</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <div className="mt-8 space-y-8">
        <div className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm md:flex-row md:items-end md:justify-between">
          <div>
            <div className="flex items-center gap-3">
              <History className="h-8 w-8 text-slate-900" />
              <h1 className="text-3xl font-bold text-slate-900">Request History</h1>
            </div>
            <p className="mt-2 max-w-2xl text-sm text-slate-600">
              Requests submitted today are shown in the current section. Requests from earlier dates are grouped in history.
            </p>
          </div>

          <Link
            href="/lab_Assistant/item-requests"
            className="inline-flex items-center gap-2 rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Form
          </Link>
        </div>

        {searchParams.get("submitted") === "1" ? (
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-emerald-800">
            Item request submitted successfully. Your new request appears in today&apos;s requests below.
          </div>
        ) : null}

        {loading ? (
          <div className="flex items-center justify-center rounded-2xl border border-slate-200 bg-white py-16 text-slate-600 shadow-sm">
            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
            Loading request history...
          </div>
        ) : error ? (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-red-700">
            <div className="flex items-start gap-3">
              <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />
              <p>{error}</p>
            </div>
          </div>
        ) : (
          <div className="space-y-8">
            <RequestTable
              title="Current Requests"
              description="Requests submitted today"
              icon={CalendarClock}
              requests={todaysRequests}
            />

            <RequestTable
              title="Request History"
              description="Requests submitted before today"
              icon={History}
              requests={historyRequests}
            />
          </div>
        )}
      </div>
    </div>
  )
}
