"use client"

import Link from "next/link"
import { useEffect, useMemo, useState, type ComponentType } from "react"
import {
  AlertCircle,
  ArrowUpRight,
  Boxes,
  ClipboardList,
  Loader2,
  PackageCheck,
  RefreshCcw,
  Truck,
  Warehouse,
  Sparkles,
} from "lucide-react"
import {
  Bar,
  BarChart,
  CartesianGrid,
  XAxis,
  YAxis,
} from "recharts"

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "../../components/ui/Breadcrumb"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"
import {
  fetchItemReceipts,
  fetchItemRequests,
  fetchStockLevels,
  type ItemReceiptRecord,
  type ItemRequestRecord,
  type StockLevelItem,
} from "@/lib/api"

const quickLinks = [
  {
    href: "/inventory_manager/stock",
    title: "Stock Levels",
    description: "Filter inventory, inspect thresholds, and identify low stock at a glance.",
    icon: Warehouse,
  },
  {
    href: "/inventory_manager/requests",
    title: "Request Review",
    description: "Approve, reject, and issue requests from one workflow.",
    icon: ClipboardList,
  },
  {
    href: "/inventory_manager/orders",
    title: "Issuance Queue",
    description: "Release approved requests and track what left the store.",
    icon: PackageCheck,
  },
  {
    href: "/inventory_manager/recieved-items",
    title: "Received Items",
    description: "Record supplier deliveries and keep stock synchronized.",
    icon: Truck,
  },
]

const stockChartConfig = {
  count: {
    label: "Items",
    color: "#1A1916",
  },
}

const requestChartConfig = {
  count: {
    label: "Requests",
    color: "#5A5650",
  },
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-GB", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value))
}

function formatQuantity(value: number) {
  return new Intl.NumberFormat("en-GB").format(value)
}

function statusTone(status: string) {
  switch (status) {
    case "available":
      return "bg-emerald-50 text-emerald-700 border-emerald-200"
    case "low":
      return "bg-amber-50 text-amber-700 border-amber-200"
    case "not_available":
      return "bg-rose-50 text-rose-700 border-rose-200"
    case "pending":
      return "bg-amber-50 text-amber-700 border-amber-200"
    case "approved":
      return "bg-emerald-50 text-emerald-700 border-emerald-200"
    case "issued":
      return "bg-sky-50 text-sky-700 border-sky-200"
    case "rejected":
      return "bg-rose-50 text-rose-700 border-rose-200"
    default:
      return "bg-slate-50 text-slate-700 border-slate-200"
  }
}

function labelStatus(status: string) {
  return status
    .replaceAll("_", " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase())
}

export default function Page() {
  const [stockLevels, setStockLevels] = useState<StockLevelItem[]>([])
  const [requests, setRequests] = useState<ItemRequestRecord[]>([])
  const [receipts, setReceipts] = useState<ItemReceiptRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    const loadDashboard = async () => {
      setLoading(true)
      setError("")

      try {
        const [stockData, requestData, receiptData] = await Promise.all([
          fetchStockLevels(),
          fetchItemRequests(),
          fetchItemReceipts(),
        ])

        setStockLevels(stockData)
        setRequests(requestData)
        setReceipts(receiptData)
      } catch (loadError) {
        setError((loadError as Error).message || "Failed to load inventory dashboard")
      } finally {
        setLoading(false)
      }
    }

    void loadDashboard()
  }, [])

  const totalStockUnits = useMemo(
    () => stockLevels.reduce((sum, item) => sum + item.quantity, 0),
    [stockLevels],
  )

  const categoryCount = useMemo(
    () => new Set(stockLevels.map((item) => item.category_name).filter(Boolean)).size,
    [stockLevels],
  )

  const lowStockItems = useMemo(
    () =>
      [...stockLevels]
        .filter((item) => item.stock_status !== "available")
        .sort((left, right) => left.quantity - right.quantity)
        .slice(0, 5),
    [stockLevels],
  )

  const recentReceipts = useMemo(
    () =>
      [...receipts]
        .sort(
          (left, right) =>
            new Date(right.receipt_date).getTime() - new Date(left.receipt_date).getTime(),
        )
        .slice(0, 5),
    [receipts],
  )

  const stockChartData = useMemo(
    () => [
      {
        status: "Available",
        count: stockLevels.filter((item) => item.stock_status === "available").length,
      },
      {
        status: "Low",
        count: stockLevels.filter((item) => item.stock_status === "low").length,
      },
      {
        status: "Out",
        count: stockLevels.filter((item) => item.stock_status === "not_available").length,
      },
    ],
    [stockLevels],
  )

  const requestChartData = useMemo(
    () => [
      {
        status: "Pending",
        count: requests.filter((item) => item.status === "pending").length,
      },
      {
        status: "Approved",
        count: requests.filter((item) => item.status === "approved").length,
      },
      {
        status: "Issued",
        count: requests.filter((item) => item.status === "issued").length,
      },
      {
        status: "Rejected",
        count: requests.filter((item) => item.status === "rejected").length,
      },
    ],
    [requests],
  )

  const pendingRequests = requests.filter((item) => item.status === "pending").length
  const approvedRequests = requests.filter((item) => item.status === "approved").length
  const issuedRequests = requests.filter((item) => item.status === "issued").length
  const lowStockCount = stockLevels.filter((item) => item.stock_status === "low").length

  return (
    <div className="space-y-6 text-[#1A1916]">
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href="/">Home</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>Inventory Dashboard</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <section className="relative overflow-hidden rounded-3xl border border-[#E8E5DF] bg-[linear-gradient(135deg,#F7F6F3_0%,#FFFFFF_56%,#EEF2FF_100%)] p-6 shadow-sm lg:p-8">
        <div className="pointer-events-none absolute -right-8 -top-10 h-36 w-36 rounded-full bg-[#1A1916]/5 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-12 left-1/3 h-40 w-40 rounded-full bg-[#C7D2FE]/40 blur-3xl" />

        <div className="relative flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-[#ECEAE5] px-3 py-1">
              <Sparkles className="h-3.5 w-3.5 text-[#5A5650]" />
              <span className="text-xs font-medium uppercase tracking-[0.18em] text-[#5A5650]">
                Inventory Manager
              </span>
            </div>

            <h1 className="text-4xl font-semibold tracking-tight text-[#1A1916] lg:text-5xl">
              One dashboard for stock, requests, receipts, and issuance.
            </h1>

            <p className="mt-4 max-w-2xl text-sm leading-6 text-[#5A5650] lg:text-base">
              Monitor the inventory route from one place. The overview below brings together stock health,
              request flow, and supplier receipts so managers can move from review to action quickly.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:min-w-105">
            <div className="rounded-2xl border border-[#E8E5DF] bg-white/85 p-4 shadow-sm backdrop-blur">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#9A9690]">Live items</p>
              <div className="mt-3 flex items-end justify-between gap-3">
                <p className="text-3xl font-semibold text-[#1A1916]">{stockLevels.length}</p>
                <Boxes className="h-5 w-5 text-[#1A1916]" />
              </div>
            </div>

            <div className="rounded-2xl border border-[#E8E5DF] bg-white/85 p-4 shadow-sm backdrop-blur">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#9A9690]">Pending requests</p>
              <div className="mt-3 flex items-end justify-between gap-3">
                <p className="text-3xl font-semibold text-[#1A1916]">{pendingRequests}</p>
                <ClipboardList className="h-5 w-5 text-[#1A1916]" />
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          label="Total SKUs"
          value={stockLevels.length}
          description="Tracked inventory records"
          icon={Boxes}
        />
        <MetricCard
          label="Stock units"
          value={totalStockUnits}
          description="Physical quantity on hand"
          icon={PackageCheck}
        />
        <MetricCard
          label="Low stock"
          value={lowStockCount}
          description="Items below threshold"
          icon={Sparkles}
        />
        <MetricCard
          label="Categories"
          value={categoryCount}
          description="Distinct inventory groups"
          icon={Warehouse}
        />
      </div>

      {loading ? (
        <div className="flex items-center justify-center rounded-3xl border border-[#E8E5DF] bg-white p-10 shadow-sm">
          <Loader2 className="mr-2 h-5 w-5 animate-spin text-[#1A1916]" />
          Loading inventory dashboard...
        </div>
      ) : error ? (
        <div className="flex items-start gap-3 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          <AlertCircle className="mt-0.5 h-4 w-4" />
          <span>{error}</span>
        </div>
      ) : null}

      {!loading && !error ? (
        <>
          <section className="grid gap-6 xl:grid-cols-2">
            <div className="rounded-3xl border border-[#E8E5DF] bg-white p-6 shadow-sm">
              <div className="mb-5 flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-lg font-semibold text-[#1A1916]">Stock health</h2>
                  <p className="mt-1 text-sm text-[#9A9690]">How the catalog is distributed by availability.</p>
                </div>
                <span className="rounded-full bg-[#ECEAE5] px-3 py-1 text-xs font-medium text-[#5A5650]">
                  Overview
                </span>
              </div>

              <ChartContainer config={stockChartConfig} className="h-70 w-full">
                <BarChart data={stockChartData} margin={{ left: 0, right: 12, top: 8 }}>
                  <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="#E8E5DF" />
                  <XAxis dataKey="status" tickLine={false} axisLine={false} tickMargin={12} />
                  <YAxis tickLine={false} axisLine={false} allowDecimals={false} />
                  <ChartTooltip content={<ChartTooltipContent indicator="dot" />} />
                  <Bar dataKey="count" fill="#1A1916" radius={8} barSize={36} />
                </BarChart>
              </ChartContainer>
            </div>

            <div className="rounded-3xl border border-[#E8E5DF] bg-white p-6 shadow-sm">
              <div className="mb-5 flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-lg font-semibold text-[#1A1916]">Request flow</h2>
                  <p className="mt-1 text-sm text-[#9A9690]">Current approval state across the request pipeline.</p>
                </div>
                <span className="rounded-full bg-[#ECEAE5] px-3 py-1 text-xs font-medium text-[#5A5650]">
                  Live queue
                </span>
              </div>

              <ChartContainer config={requestChartConfig} className="h-70 w-full">
                <BarChart data={requestChartData} margin={{ left: 0, right: 12, top: 8 }}>
                  <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="#E8E5DF" />
                  <XAxis dataKey="status" tickLine={false} axisLine={false} tickMargin={12} />
                  <YAxis tickLine={false} axisLine={false} allowDecimals={false} />
                  <ChartTooltip content={<ChartTooltipContent indicator="dot" />} />
                  <Bar dataKey="count" fill="#5A5650" radius={8} barSize={36} />
                </BarChart>
              </ChartContainer>
            </div>
          </section>

          <section className="grid gap-6 xl:grid-cols-2">
            <div className="rounded-3xl border border-[#E8E5DF] bg-white p-6 shadow-sm">
              <div className="mb-5 flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-lg font-semibold text-[#1A1916]">Quick access</h2>
                  <p className="mt-1 text-sm text-[#9A9690]">Jump straight into the most common manager workflows.</p>
                </div>
                <RefreshCcw className="h-4 w-4 text-[#9A9690]" />
              </div>

              <div className="grid gap-3 md:grid-cols-2">
                {quickLinks.map((link) => {
                  const Icon = link.icon

                  return (
                    <Link
                      key={link.href}
                      href={link.href}
                      className="group rounded-2xl border border-[#E8E5DF] bg-[#FAFAF8] p-4 transition hover:-translate-y-0.5 hover:border-[#D7D2C8] hover:bg-white"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex items-start gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#1A1916] text-white">
                            <Icon className="h-5 w-5" />
                          </div>
                          <div>
                            <h3 className="font-semibold text-[#1A1916]">{link.title}</h3>
                            <p className="mt-1 text-sm leading-5 text-[#5A5650]">{link.description}</p>
                          </div>
                        </div>
                        <ArrowUpRight className="h-4 w-4 text-[#9A9690] transition group-hover:text-[#1A1916]" />
                      </div>
                    </Link>
                  )
                })}
              </div>
            </div>

            <div className="rounded-3xl border border-[#E8E5DF] bg-white p-6 shadow-sm">
              <div className="mb-5 flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-lg font-semibold text-[#1A1916]">Low stock watchlist</h2>
                  <p className="mt-1 text-sm text-[#9A9690]">Items needing replenishment or attention.</p>
                </div>
                <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-medium text-amber-700">
                  {lowStockItems.length} flagged
                </span>
              </div>

              <div className="space-y-3">
                {lowStockItems.length > 0 ? (
                  lowStockItems.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between gap-4 rounded-2xl border border-[#E8E5DF] bg-[#FAFAF8] px-4 py-3"
                    >
                      <div>
                        <p className="font-semibold text-[#1A1916]">{item.item_name}</p>
                        <p className="text-xs text-[#9A9690]">
                          {item.category_name} · Threshold {item.low_stock_threshold}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-semibold text-[#1A1916]">{formatQuantity(item.quantity)}</p>
                        <span className={`mt-1 inline-flex rounded-full border px-3 py-1 text-xs font-medium ${statusTone(item.stock_status)}`}>
                          {labelStatus(item.stock_status)}
                        </span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="rounded-2xl border border-dashed border-[#D7D2C8] bg-[#FAFAF8] p-6 text-center text-sm text-[#9A9690]">
                    No low stock items right now.
                  </div>
                )}
              </div>
            </div>
          </section>

          <section className="rounded-3xl border border-[#E8E5DF] bg-white p-6 shadow-sm">
            <div className="mb-5 flex items-start justify-between gap-4">
              <div>
                <h2 className="text-lg font-semibold text-[#1A1916]">Recent receipts</h2>
                <p className="mt-1 text-sm text-[#9A9690]">Most recent supplier entries recorded in the system.</p>
              </div>
              <span className="rounded-full bg-[#ECEAE5] px-3 py-1 text-xs font-medium text-[#5A5650]">
                {approvedRequests} approved · {issuedRequests} issued
              </span>
            </div>

            <div className="grid gap-3 lg:grid-cols-2">
              {recentReceipts.length > 0 ? (
                recentReceipts.map((receipt) => (
                  <div
                    key={receipt.id}
                    className="rounded-2xl border border-[#E8E5DF] bg-[#FAFAF8] p-4"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="font-semibold text-[#1A1916]">{receipt.item_name}</p>
                        <p className="mt-1 text-xs text-[#9A9690]">
                          {receipt.category_name || "Uncategorized"} · {receipt.supplier_name}
                        </p>
                      </div>
                      <span className={`inline-flex rounded-full border px-3 py-1 text-xs font-medium ${statusTone(receipt.quality_status)}`}>
                        {labelStatus(receipt.quality_status)}
                      </span>
                    </div>

                    <div className="mt-4 grid grid-cols-2 gap-3 text-sm text-[#5A5650]">
                      <div>
                        <p className="text-xs uppercase tracking-[0.18em] text-[#9A9690]">Quantity</p>
                        <p className="mt-1 font-semibold text-[#1A1916]">{formatQuantity(receipt.quantity_received)}</p>
                      </div>
                      <div>
                        <p className="text-xs uppercase tracking-[0.18em] text-[#9A9690]">Receipt date</p>
                        <p className="mt-1 font-semibold text-[#1A1916]">{formatDate(receipt.receipt_date)}</p>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="rounded-2xl border border-dashed border-[#D7D2C8] bg-[#FAFAF8] p-6 text-center text-sm text-[#9A9690] lg:col-span-2">
                  No receipts have been recorded yet.
                </div>
              )}
            </div>
          </section>
        </>
      ) : null}
    </div>
  )
}

function MetricCard({
  label,
  value,
  description,
  icon: Icon,
}: {
  label: string
  value: number
  description: string
  icon: ComponentType<{ className?: string }>
}) {
  return (
    <div className="rounded-2xl border border-[#E8E5DF] bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#9A9690]">{label}</p>
          <p className="mt-3 text-3xl font-semibold text-[#1A1916]">{value}</p>
          <p className="mt-1 text-sm text-[#5A5650]">{description}</p>
        </div>
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#1A1916] text-white">
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </div>
  )
}