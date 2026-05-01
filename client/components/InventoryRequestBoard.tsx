"use client"

import { useEffect, useMemo, useState } from "react"
import {
  BadgeCheck,
  Check,
  CircleX,
  Clock3,
  Loader2,
  PackageCheck,
  RefreshCcw,
  X,
} from "lucide-react"
import {
  fetchItemRequests,
  issueItemRequest,
  reviewItemRequest,
  type ItemRequestRecord,
} from "../lib/api"

type ViewMode = "review" | "issuance"

type InventoryRequestBoardProps = {
  mode: ViewMode
}

function formatDate(value: string | null) {
  if (!value) return "-"

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value

  return new Intl.DateTimeFormat("en-GB", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date)
}

function statusLabel(status: string) {
  switch (status) {
    case "pending":
      return "Pending"
    case "approved":
      return "Approved"
    case "rejected":
      return "Rejected"
    case "issued":
      return "Issued"
    default:
      return status
  }
}

function statusStyle(status: string) {
  switch (status) {
    case "pending":
      return "border-amber-200 bg-amber-50 text-amber-800"
    case "approved":
      return "border-emerald-200 bg-emerald-50 text-emerald-800"
    case "rejected":
      return "border-rose-200 bg-rose-50 text-rose-800"
    case "issued":
      return "border-slate-200 bg-slate-100 text-slate-700"
    default:
      return "border-slate-200 bg-slate-50 text-slate-700"
  }
}

export default function InventoryRequestBoard({ mode }: InventoryRequestBoardProps) {
  const [requests, setRequests] = useState<ItemRequestRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [message, setMessage] = useState("")
  const [busyRequestId, setBusyRequestId] = useState<number | null>(null)
  const [rejectTarget, setRejectTarget] = useState<ItemRequestRecord | null>(null)
  const [rejectionReason, setRejectionReason] = useState("")
  const [rejectSubmitting, setRejectSubmitting] = useState(false)

  const loadRequests = async () => {
    setLoading(true)
    setError("")

    try {
      const data = await fetchItemRequests()
      setRequests(data)
    } catch (loadError) {
      setError((loadError as Error).message || "Failed to load item requests")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadRequests()
  }, [])

  const reviewRequests = useMemo(
    () => requests.filter((request) => request.status === "pending" || request.status === "approved" || request.status === "rejected" || request.status === "issued"),
    [requests],
  )

  const approvedRequests = useMemo(
    () => requests.filter((request) => request.status === "approved"),
    [requests],
  )

  const handleApprove = async (requestId: number) => {
    setBusyRequestId(requestId)
    setMessage("")
    setError("")

    try {
      await reviewItemRequest(requestId, { status: "approved" })
      setMessage("Request approved successfully.")
      await loadRequests()
    } catch (approveError) {
      setError((approveError as Error).message || "Failed to approve request")
    } finally {
      setBusyRequestId(null)
    }
  }

  const handleReject = async () => {
    if (!rejectTarget) return

    const reason = rejectionReason.trim()
    if (!reason) {
      setError("Rejection reason is required.")
      return
    }

    setRejectSubmitting(true)
    setMessage("")
    setError("")

    try {
      await reviewItemRequest(rejectTarget.id, {
        status: "rejected",
        rejectionReason: reason,
      })
      setMessage("Request rejected successfully.")
      setRejectTarget(null)
      setRejectionReason("")
      await loadRequests()
    } catch (rejectError) {
      setError((rejectError as Error).message || "Failed to reject request")
    } finally {
      setRejectSubmitting(false)
      setBusyRequestId(null)
    }
  }

  const handleIssue = async (request: ItemRequestRecord) => {
    setBusyRequestId(request.id)
    setMessage("")
    setError("")

    // If requested quantity exceeds current stock, open rejection dialog
    if (typeof request.stock_quantity === 'number' && request.quantity_requested > request.stock_quantity) {
      setRejectTarget(request)
      setRejectionReason(
        `Requested ${request.quantity_requested}, but only ${request.stock_quantity} available. Provide a rejection reason or adjust stock.`,
      )
      setBusyRequestId(null)
      return
    }

    try {
      await issueItemRequest(request.id)
      setMessage("Request issued successfully.")
      await loadRequests()
    } catch (issueError) {
      const msg = (issueError as Error).message || "Failed to issue request"
      // If backend indicates insufficient stock, open rejection dialog as fallback
      if (msg.toLowerCase().includes('insufficient stock')) {
        setRejectTarget(request)
        setRejectionReason(`Requested ${request.quantity_requested}, but insufficient stock available.`)
      } else {
        setError(msg)
      }
    } finally {
      setBusyRequestId(null)
    }
  }

  const pendingCount = requests.filter((request) => request.status === "pending").length
  const approvedCount = requests.filter((request) => request.status === "approved").length
  const issuedCount = requests.filter((request) => request.status === "issued").length
  const rejectedCount = requests.filter((request) => request.status === "rejected").length

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Pending</p>
          <div className="mt-2 flex items-end justify-between gap-3">
            <p className="text-3xl font-bold text-slate-900">{pendingCount}</p>
            <Clock3 className="h-5 w-5 text-amber-500" />
          </div>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Approved</p>
          <div className="mt-2 flex items-end justify-between gap-3">
            <p className="text-3xl font-bold text-slate-900">{approvedCount}</p>
            <BadgeCheck className="h-5 w-5 text-emerald-600" />
          </div>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Issued</p>
          <div className="mt-2 flex items-end justify-between gap-3">
            <p className="text-3xl font-bold text-slate-900">{issuedCount}</p>
            <PackageCheck className="h-5 w-5 text-slate-700" />
          </div>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Rejected</p>
          <div className="mt-2 flex items-end justify-between gap-3">
            <p className="text-3xl font-bold text-slate-900">{rejectedCount}</p>
            <CircleX className="h-5 w-5 text-rose-600" />
          </div>
        </div>
      </div>

      {message ? (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          {message}
        </div>
      ) : null}

      {error ? (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {error}
        </div>
      ) : null}

      {loading ? (
        <div className="rounded-3xl border border-slate-200 bg-white p-10 text-center shadow-sm">
          <Loader2 className="mx-auto h-6 w-6 animate-spin text-slate-600" />
          <p className="mt-3 text-sm text-slate-600">Loading item requests...</p>
        </div>
      ) : (
        <>
          {mode === "review" ? (
            <section className="rounded-3xl border border-slate-200 bg-white shadow-sm">
              <div className="flex items-center justify-between gap-3 border-b border-slate-200 px-6 py-5">
                <div>
                  <h2 className="text-lg font-semibold text-slate-900">Request History</h2>
                  <p className="text-sm text-slate-600">Review pending requests and track status changes in one place.</p>
                </div>
                <button
                  type="button"
                  onClick={() => void loadRequests()}
                  className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                >
                  <RefreshCcw className="h-4 w-4" />
                  Refresh
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-200 text-left">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="px-6 py-3 text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Item</th>
                      <th className="px-6 py-3 text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Qty</th>
                      <th className="px-6 py-3 text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Dept</th>
                      <th className="px-6 py-3 text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Requester</th>
                      <th className="px-6 py-3 text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Requested</th>
                      <th className="px-6 py-3 text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Status</th>
                      <th className="px-6 py-3 text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 bg-white">
                    {reviewRequests.length > 0 ? (
                      reviewRequests.map((request) => {
                        const isPending = request.status === "pending"
                        const isApproved = request.status === "approved"
                        const isRejected = request.status === "rejected"
                        const isIssued = request.status === "issued"

                        return (
                          <tr key={request.id} className="align-top">
                            <td className="px-6 py-4">
                              <p className="font-semibold text-slate-900">{request.item_name}</p>
                              <p className="text-xs text-slate-500">Room: {request.recipient_room || "-"}</p>
                            </td>
                            <td className="px-6 py-4 text-sm text-slate-700">{request.quantity_requested}</td>
                            <td className="px-6 py-4 text-sm text-slate-700">{request.department || "-"}</td>
                            <td className="px-6 py-4 text-sm text-slate-700">{request.requester_name || "-"}</td>
                            <td className="px-6 py-4 text-sm text-slate-700">{formatDate(request.requested_at)}</td>
                            <td className="px-6 py-4">
                              <span className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold ${statusStyle(request.status)}`}>
                                {statusLabel(request.status)}
                              </span>
                              {isRejected && request.rejection_reason ? (
                                <p className="mt-2 max-w-xs text-xs text-rose-700">Reason: {request.rejection_reason}</p>
                              ) : null}
                              {isApproved && request.approved_by_name ? (
                                <p className="mt-2 text-xs text-emerald-700">Approved by {request.approved_by_name}</p>
                              ) : null}
                              {isIssued && request.approved_by_name ? (
                                <p className="mt-2 text-xs text-slate-600">Approved by {request.approved_by_name}</p>
                              ) : null}
                            </td>
                            <td className="px-6 py-4">
                              {isPending ? (
                                <div className="flex items-center gap-2">
                                  <button
                                    type="button"
                                    onClick={() => void handleApprove(request.id)}
                                    disabled={busyRequestId === request.id}
                                    className="inline-flex items-center justify-center rounded-full border border-emerald-200 bg-emerald-50 p-2 text-emerald-700 transition hover:bg-emerald-100 disabled:cursor-not-allowed disabled:opacity-60"
                                    aria-label="Approve request"
                                    title="Approve"
                                  >
                                    {busyRequestId === request.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setRejectTarget(request)
                                      setRejectionReason("")
                                      setError("")
                                    }}
                                    disabled={busyRequestId === request.id}
                                    className="inline-flex items-center justify-center rounded-full border border-rose-200 bg-rose-50 p-2 text-rose-700 transition hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-60"
                                    aria-label="Reject request"
                                    title="Reject"
                                  >
                                    <X className="h-4 w-4" />
                                  </button>
                                </div>
                              ) : isApproved ? (
                                <span className="text-sm font-medium text-emerald-700">{request.approved_by_name || "Approved"}</span>
                              ) : isRejected ? (
                                <span className="text-sm font-medium text-rose-700">{request.approved_by_name ? `Rejected by ${request.approved_by_name}` : "Rejected"}</span>
                              ) : (
                                <span className="text-sm font-medium text-slate-600">Issued</span>
                              )}
                            </td>
                          </tr>
                        )
                      })
                    ) : (
                      <tr>
                        <td className="px-6 py-10 text-center text-sm text-slate-500" colSpan={7}>
                          No item requests found.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </section>
          ) : null}

          <section className="rounded-3xl border border-slate-200 bg-white shadow-sm">
            <div className="flex items-center justify-between gap-3 border-b border-slate-200 px-6 py-5">
              <div>
                <h2 className="text-lg font-semibold text-slate-900">Approved Requests</h2>
                <p className="text-sm text-slate-600">Issue approved requests and monitor the items that are ready for release.</p>
              </div>
              {mode === "review" ? (
                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                  {approvedCount} ready for issuance
                </span>
              ) : null}
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200 text-left">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-6 py-3 text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Item</th>
                    <th className="px-6 py-3 text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Qty</th>
                    <th className="px-6 py-3 text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Stock Qty</th>
                    <th className="px-6 py-3 text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Dept</th>
                    <th className="px-6 py-3 text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Requester</th>
                    <th className="px-6 py-3 text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Date</th>
                    <th className="px-6 py-3 text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {approvedRequests.length > 0 ? (
                    approvedRequests.map((request) => (
                      <tr key={request.id} className="align-top">
                        <td className="px-6 py-4">
                          <p className="font-semibold text-slate-900">{request.item_name}</p>
                          <p className="text-xs text-slate-500">Approved by {request.approved_by_name || "manager"}</p>
                        </td>
                        <td className="px-6 py-4 text-sm text-slate-700">{request.quantity_requested}</td>
                        <td className="px-6 py-4 text-sm text-slate-700">{request.stock_quantity}</td>
                        <td className="px-6 py-4 text-sm text-slate-700">{request.department || "-"}</td>
                        <td className="px-6 py-4 text-sm text-slate-700">{request.requester_name || "-"}</td>
                        <td className="px-6 py-4 text-sm text-slate-700">{formatDate(request.reviewed_at || request.requested_at)}</td>
                        <td className="px-6 py-4">
                          <button
                            type="button"
                            onClick={() => void handleIssue(request)}
                            disabled={busyRequestId === request.id}
                            className="inline-flex items-center gap-2 rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
                          >
                            {busyRequestId === request.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <PackageCheck className="h-4 w-4" />}
                            Issue
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td className="px-6 py-10 text-center text-sm text-slate-500" colSpan={7}>
                        No approved requests waiting for issuance.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>
        </>
      )}

      {rejectTarget ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 px-4">
          <div className="w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="text-xl font-semibold text-slate-900">Reject request</h3>
                <p className="mt-1 text-sm text-slate-600">Provide a short reason for rejecting {rejectTarget.item_name}.</p>
              </div>
              <button
                type="button"
                onClick={() => {
                  if (!rejectSubmitting) {
                    setRejectTarget(null)
                    setRejectionReason("")
                  }
                }}
                className="rounded-full p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-700"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="mt-5 space-y-3">
              <label className="block text-sm font-semibold text-slate-800" htmlFor="rejectionReason">
                Rejection reason
              </label>
              <textarea
                id="rejectionReason"
                value={rejectionReason}
                onChange={(event) => setRejectionReason(event.target.value)}
                rows={4}
                placeholder="Explain why this request is being rejected"
                className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-slate-900 focus:ring-2 focus:ring-slate-900/10"
              />
            </div>

            <div className="mt-6 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => {
                  if (!rejectSubmitting) {
                    setRejectTarget(null)
                    setRejectionReason("")
                  }
                }}
                className="rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                disabled={rejectSubmitting}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => void handleReject()}
                disabled={rejectSubmitting}
                className="inline-flex items-center gap-2 rounded-full bg-rose-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-rose-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {rejectSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                Reject request
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  )
}
