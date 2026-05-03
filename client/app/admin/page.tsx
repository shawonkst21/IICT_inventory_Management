"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
import {
  AlertTriangle,
  Archive,
  ArrowRight,
  ClipboardList,
  Loader2,
  ShieldCheck,
  Users,
} from "lucide-react"
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  PolarAngleAxis,
  RadialBar,
  RadialBarChart,
  XAxis,
  YAxis,
} from "recharts"
import { useAuth } from "@/context/AuthContext"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"
import {
  fetchAdminItems,
  fetchAdminLogs,
  fetchAdminUsers,
  fetchItemRequests,
  fetchPendingUsers,
  fetchStockLevels,
  type AdminItem,
  type AdminUser,
  type AuditLogEntry,
  type ItemRequestRecord,
  type StockLevelItem,
} from "@/lib/api"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "../../components/ui/Breadcrumb"

const stockChartConfig = {
  available: {
    label: "Available",
    color: "#0f766e",
  },
  low: {
    label: "Low",
    color: "#d97706",
  },
  out: {
    label: "Out",
    color: "#dc2626",
  },
}

const requestChartConfig = {
  pending: {
    label: "Pending",
    color: "#f59e0b",
  },
  approved: {
    label: "Approved",
    color: "#10b981",
  },
  issued: {
    label: "Issued",
    color: "#0ea5e9",
  },
  rejected: {
    label: "Rejected",
    color: "#f43f5e",
  },
}

const activityChartConfig = {
  actions: {
    label: "Actions",
    color: "#334155",
  },
}

type DashboardData = {
  users: AdminUser[]
  pendingUsers: AdminUser[]
  items: AdminItem[]
  stockLevels: StockLevelItem[]
  requests: ItemRequestRecord[]
  logs: AuditLogEntry[]
}

const quickLinks = [
  {
    title: "Review Users",
    description: "Approve or reject account requests.",
    href: "/admin/users",
  },
  {
    title: "Manage Items",
    description: "Update inventory records and stock definitions.",
    href: "/admin/items",
  },
  {
    title: "Edit Categories",
    description: "Keep item groups clean and organized.",
    href: "/admin/categories",
  },
  {
    title: "Open Audit Logs",
    description: "Inspect recent admin and system activity.",
    href: "/admin/log-viewer",
  },
]

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-BD", {
    dateStyle: "medium",
  }).format(new Date(value))
}

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("en-BD", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value))
}

function timeAgo(value: string) {
  const now = Date.now()
  const diffMs = now - new Date(value).getTime()
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
  const diffDays = Math.floor(diffHours / 24)

  if (diffHours < 1) {
    const diffMinutes = Math.max(1, Math.floor(diffMs / (1000 * 60)))
    return `${diffMinutes}m ago`
  }

  if (diffHours < 24) {
    return `${diffHours}h ago`
  }

  return `${diffDays}d ago`
}

function getActionTone(action: string) {
  if (action === "LOGIN") return "bg-emerald-50 text-emerald-700"
  if (action === "DELETE") return "bg-rose-50 text-rose-700"
  if (action === "UPDATE") return "bg-amber-50 text-amber-700"
  return "bg-slate-100 text-slate-700"
}

function formatStatusLabel(value: string) {
  return value
    .replaceAll("_", " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase())
}

export default function AdminDashboardPage() {
  const { token, loading: authLoading } = useAuth()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [data, setData] = useState<DashboardData | null>(null)

  useEffect(() => {
    const authToken = token || (typeof window !== "undefined" ? localStorage.getItem("token") : "")

    if (authLoading || !authToken) {
      return
    }

    let isActive = true

    async function loadDashboard() {
      try {
        setLoading(true)
        setError(null)

        const [users, pendingUsers, items, stockLevels, requests, logs] = await Promise.all([
          fetchAdminUsers(),
          fetchPendingUsers(),
          fetchAdminItems(),
          fetchStockLevels(),
          fetchItemRequests(),
          fetchAdminLogs(),
        ])

        if (!isActive) {
          return
        }

        setData({
          users,
          pendingUsers,
          items,
          stockLevels,
          requests,
          logs,
        })
      } catch (loadError) {
        if (!isActive) {
          return
        }

        console.error("Failed to load admin dashboard:", loadError)
        setError(loadError instanceof Error ? loadError.message : "Failed to load dashboard")
      } finally {
        if (isActive) {
          setLoading(false)
        }
      }
    }

    loadDashboard()

    return () => {
      isActive = false
    }
  }, [token, authLoading])

  if (authLoading || loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center rounded-[28px] border border-slate-200 bg-white">
        <div className="flex items-center gap-3 text-slate-600">
          <Loader2 className="h-5 w-5 animate-spin" />
          <span>Loading admin dashboard...</span>
        </div>
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="space-y-6">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="/">Home</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>Admin Dashboard</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        <div className="rounded-[28px] border border-rose-200 bg-white p-8">
          <div className="flex items-start gap-4">
            <div className="rounded-2xl bg-rose-50 p-3 text-rose-600">
              <AlertTriangle className="h-5 w-5" />
            </div>
            <div className="space-y-2">
              <h1 className="text-2xl font-semibold text-slate-900">Admin dashboard unavailable</h1>
              <p className="text-slate-600">{error || "Unable to load dashboard data."}</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  const pendingRequests = data.requests.filter((request) => request.status === "pending")
  const approvedRequests = data.requests.filter((request) => request.status === "approved")
  const lowStockItems = data.stockLevels.filter(
    (item) => item.stock_status === "low" || item.stock_status === "not_available",
  )
  const outOfStockItems = data.stockLevels.filter((item) => item.stock_status === "not_available")
  const totalStockUnits = data.items.reduce((sum, item) => sum + item.current_stock, 0)
  const recentLogs = data.logs.slice(0, 6)
  const newestPendingUsers = data.pendingUsers.slice(0, 5)
  const urgentStockItems = [...lowStockItems]
    .sort((a, b) => a.quantity - b.quantity)
    .slice(0, 5)
  const latestRequests = [...data.requests]
    .sort((a, b) => new Date(b.requested_at).getTime() - new Date(a.requested_at).getTime())
    .slice(0, 5)
  const totalTrackedItems = Math.max(1, data.stockLevels.length)
  const stockChartData = [
    {
      key: "available",
      name: "Available",
      value: data.stockLevels.filter((item) => item.stock_status === "available").length,
      fill: "#0f766e",
      share: Math.round(
        (data.stockLevels.filter((item) => item.stock_status === "available").length / totalTrackedItems) * 100,
      ),
    },
    {
      key: "low",
      name: "Low",
      value: data.stockLevels.filter((item) => item.stock_status === "low").length,
      fill: "#d97706",
      share: Math.round(
        (data.stockLevels.filter((item) => item.stock_status === "low").length / totalTrackedItems) * 100,
      ),
    },
    {
      key: "out",
      name: "Out",
      value: data.stockLevels.filter((item) => item.stock_status === "not_available").length,
      fill: "#dc2626",
      share: Math.round(
        (data.stockLevels.filter((item) => item.stock_status === "not_available").length / totalTrackedItems) * 100,
      ),
    },
  ]
  const requestChartData = [
    {
      key: "pending",
      status: "Pending",
      count: pendingRequests.length,
      fill: "#f59e0b",
    },
    {
      key: "approved",
      status: "Approved",
      count: approvedRequests.length,
      fill: "#10b981",
    },
    {
      key: "issued",
      status: "Issued",
      count: data.requests.filter((request) => request.status === "issued").length,
      fill: "#0ea5e9",
    },
    {
      key: "rejected",
      status: "Rejected",
      count: data.requests.filter((request) => request.status === "rejected").length,
      fill: "#f43f5e",
    },
  ]
  const activityChartData = Array.from({ length: 7 }, (_, index) => {
    const date = new Date()
    date.setHours(0, 0, 0, 0)
    date.setDate(date.getDate() - (6 - index))

    const nextDate = new Date(date)
    nextDate.setDate(date.getDate() + 1)

    const count = data.logs.filter((log) => {
      const createdAt = new Date(log.created_at)
      return createdAt >= date && createdAt < nextDate
    }).length

    return {
      day: new Intl.DateTimeFormat("en-BD", { weekday: "short" }).format(date),
      actions: count,
    }
  })

  return (
    <div className="min-w-0 space-y-8">
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href="/">Home</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>Admin Dashboard</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <section className="overflow-hidden rounded-[32px] border border-slate-200 bg-white">
        <div className="bg-[radial-gradient(circle_at_top_left,_rgba(15,23,42,0.12),_transparent_45%),linear-gradient(135deg,#ffffff_0%,#f3f0e8_100%)] px-8 py-10">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-2xl space-y-4">
              <span className="inline-flex w-fit items-center rounded-full border border-slate-300 bg-white/80 px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-slate-600">
                IICT Admin Control
              </span>
              <div className="space-y-2">
                <h1 className="text-3xl font-semibold tracking-tight text-slate-950">
                  Keep approvals, inventory, and audit activity in one view.
                </h1>
                <p className="max-w-xl text-sm leading-6 text-slate-600">
                  This dashboard surfaces the queues that usually need admin attention first: pending users,
                  stock issues, request flow, and recent system actions.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <div className="rounded-2xl border border-slate-200 bg-white/90 p-4">
                <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Users</p>
                <p className="mt-2 text-2xl font-semibold text-slate-950">{data.users.length}</p>
              </div>
              <div className="rounded-2xl border border-amber-200 bg-amber-50/70 p-4">
                <p className="text-xs uppercase tracking-[0.18em] text-amber-700">Pending</p>
                <p className="mt-2 text-2xl font-semibold text-amber-900">{data.pendingUsers.length}</p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-white/90 p-4">
                <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Items</p>
                <p className="mt-2 text-2xl font-semibold text-slate-950">{data.items.length}</p>
              </div>
              <div className="rounded-2xl border border-rose-200 bg-rose-50/70 p-4">
                <p className="text-xs uppercase tracking-[0.18em] text-rose-700">Low Stock</p>
                <p className="mt-2 text-2xl font-semibold text-rose-900">{lowStockItems.length}</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-[28px] border border-slate-200 bg-white p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500">Pending approvals</p>
              <p className="mt-2 text-3xl font-semibold text-slate-950">{data.pendingUsers.length}</p>
            </div>
            <div className="rounded-2xl bg-amber-50 p-3 text-amber-700">
              <ShieldCheck className="h-5 w-5" />
            </div>
          </div>
          <p className="mt-4 text-sm text-slate-600">Accounts waiting for admin action.</p>
        </div>

        <div className="rounded-[28px] border border-slate-200 bg-white p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500">Inventory units</p>
              <p className="mt-2 text-3xl font-semibold text-slate-950">{totalStockUnits}</p>
            </div>
            <div className="rounded-2xl bg-slate-100 p-3 text-slate-700">
              <Archive className="h-5 w-5" />
            </div>
          </div>
          <p className="mt-4 text-sm text-slate-600">Total stock currently recorded across all items.</p>
        </div>

        <div className="rounded-[28px] border border-slate-200 bg-white p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500">Open requests</p>
              <p className="mt-2 text-3xl font-semibold text-slate-950">{pendingRequests.length + approvedRequests.length}</p>
            </div>
            <div className="rounded-2xl bg-sky-50 p-3 text-sky-700">
              <ClipboardList className="h-5 w-5" />
            </div>
          </div>
          <p className="mt-4 text-sm text-slate-600">Pending and approved requests still moving through the workflow.</p>
        </div>

        <div className="rounded-[28px] border border-slate-200 bg-white p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500">Out of stock</p>
              <p className="mt-2 text-3xl font-semibold text-slate-950">{outOfStockItems.length}</p>
            </div>
            <div className="rounded-2xl bg-rose-50 p-3 text-rose-700">
              <AlertTriangle className="h-5 w-5" />
            </div>
          </div>
          <p className="mt-4 text-sm text-slate-600">Items already unavailable and likely blocking requests.</p>
        </div>
      </section>

      <section className="grid gap-6 2xl:grid-cols-[1.15fr_1fr_1.1fr]">
        <div className="min-w-0 rounded-[28px] border border-slate-200 bg-[linear-gradient(180deg,#ffffff_0%,#f5f7f4_100%)] p-6">
          <div className="mb-5 flex items-start justify-between gap-4">
            <div>
              <h2 className="text-xl font-semibold text-slate-950">Stock health</h2>
              <p className="mt-1 text-sm text-slate-600">A layered view of stock quality across the full catalog.</p>
            </div>
            <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700">
              Healthy focus
            </span>
          </div>

          <div className="grid min-w-0 items-center gap-4 xl:grid-cols-[0.95fr_1.05fr]">
            <ChartContainer config={stockChartConfig} className="h-72 min-w-0 w-full">
              <RadialBarChart
                data={stockChartData}
                innerRadius="24%"
                outerRadius="92%"
                startAngle={210}
                endAngle={-30}
              >
                <PolarAngleAxis type="number" domain={[0, totalTrackedItems]} tick={false} />
                <ChartTooltip
                  content={<ChartTooltipContent hideLabel indicator="line" />}
                  cursor={false}
                />
                <RadialBar
                  dataKey="value"
                  background={{ fill: "#e5e7eb" }}
                  cornerRadius={18}
                />
                {stockChartData.map((entry) => (
                  <Cell key={entry.name} fill={entry.fill} />
                ))}
              </RadialBarChart>
            </ChartContainer>

            <div className="min-w-0 space-y-3">
              <div className="rounded-3xl bg-slate-950 px-5 py-5 text-white">
                <p className="text-xs uppercase tracking-[0.22em] text-slate-300">Tracked items</p>
                <p className="mt-3 text-4xl font-semibold">{data.stockLevels.length}</p>
                <p className="mt-2 text-sm text-slate-300">Across available, low, and unavailable stock bands.</p>
              </div>

              {stockChartData.map((entry) => (
                <div key={entry.name} className="rounded-2xl border border-slate-200 bg-white/90 px-4 py-4">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <span className="h-3 w-3 rounded-full" style={{ backgroundColor: entry.fill }} />
                      <div>
                        <p className="font-medium text-slate-900">{entry.name}</p>
                        <p className="text-xs uppercase tracking-[0.16em] text-slate-400">{entry.share}% share</p>
                      </div>
                    </div>
                    <p className="text-2xl font-semibold text-slate-950">{entry.value}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="min-w-0 rounded-[28px] border border-slate-200 bg-[linear-gradient(180deg,#ffffff_0%,#f7f4ef_100%)] p-6">
          <div className="mb-5 flex items-start justify-between gap-4">
            <div>
              <h2 className="text-xl font-semibold text-slate-950">Request flow</h2>
              <p className="mt-1 text-sm text-slate-600">A color-banded view of the approval pipeline.</p>
            </div>
            <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-medium text-amber-700">
              Workflow
            </span>
          </div>

          <ChartContainer config={requestChartConfig} className="h-72 min-w-0 w-full">
            <BarChart data={requestChartData} margin={{ left: 0, right: 12, top: 8 }}>
              <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="status" tickLine={false} axisLine={false} tickMargin={12} />
              <YAxis tickLine={false} axisLine={false} allowDecimals={false} />
              <ChartTooltip content={<ChartTooltipContent indicator="dot" />} />
              <Bar dataKey="count" radius={12} barSize={40}>
                {requestChartData.map((entry) => (
                  <Cell key={entry.status} fill={entry.fill} />
                ))}
              </Bar>
            </BarChart>
          </ChartContainer>

          <div className="mt-4 grid grid-cols-2 gap-3">
            {requestChartData.map((entry) => (
              <div key={entry.status} className="rounded-2xl bg-white/80 px-4 py-3">
                <div className="flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: entry.fill }} />
                  <p className="text-sm font-medium text-slate-700">{entry.status}</p>
                </div>
                <p className="mt-2 text-2xl font-semibold text-slate-950">{entry.count}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="min-w-0 rounded-[28px] border border-slate-200 bg-[linear-gradient(180deg,#ffffff_0%,#f3f5f9_100%)] p-6">
          <div className="mb-5 flex items-start justify-between gap-4">
            <div>
              <h2 className="text-xl font-semibold text-slate-950">Activity trend</h2>
              <p className="mt-1 text-sm text-slate-600">Audit rhythm over the last seven days with a softer pulse.</p>
            </div>
            <span className="rounded-full bg-sky-50 px-3 py-1 text-xs font-medium text-sky-700">
              7 days
            </span>
          </div>

          <ChartContainer config={activityChartConfig} className="h-72 min-w-0 w-full">
            <AreaChart data={activityChartData} margin={{ left: 0, right: 12, top: 8 }}>
              <defs>
                <linearGradient id="adminActivityFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#334155" stopOpacity={0.35} />
                  <stop offset="95%" stopColor="#334155" stopOpacity={0.04} />
                </linearGradient>
              </defs>
              <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="day" tickLine={false} axisLine={false} tickMargin={12} />
              <YAxis tickLine={false} axisLine={false} allowDecimals={false} />
              <ChartTooltip content={<ChartTooltipContent indicator="line" />} />
              <Area
                type="monotone"
                dataKey="actions"
                stroke="#334155"
                strokeWidth={2}
                fill="url(#adminActivityFill)"
              />
              <Bar dataKey="actions" fill="#94a3b8" radius={10} barSize={18} fillOpacity={0.28} />
            </AreaChart>
          </ChartContainer>

          <div className="mt-4 rounded-2xl bg-white/80 px-4 py-4">
            <div className="flex items-end justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Peak day</p>
                <p className="mt-2 text-2xl font-semibold text-slate-950">
                  {activityChartData.reduce((max, item) => (item.actions > max.actions ? item : max), activityChartData[0]).day}
                </p>
              </div>
              <div className="text-right">
                <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Actions</p>
                <p className="mt-2 text-2xl font-semibold text-slate-950">
                  {activityChartData.reduce((max, item) => Math.max(max, item.actions), 0)}
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.2fr_1fr]">
        <div className="rounded-[28px] border border-slate-200 bg-white p-6">
          <div className="mb-5 flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-slate-950">Quick actions</h2>
              <p className="mt-1 text-sm text-slate-600">Jump into the admin areas that matter most.</p>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            {quickLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="group rounded-3xl border border-slate-200 bg-[#f8f6ef] p-5 transition hover:border-slate-300 hover:bg-[#f2efe4]"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="text-base font-semibold text-slate-950">{link.title}</h3>
                    <p className="mt-2 text-sm leading-6 text-slate-600">{link.description}</p>
                  </div>
                  <ArrowRight className="mt-1 h-4 w-4 text-slate-500 transition group-hover:translate-x-1" />
                </div>
              </Link>
            ))}
          </div>
        </div>

        <div className="rounded-[28px] border border-slate-200 bg-white p-6">
          <div className="mb-5 flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-slate-950">Pending approvals</h2>
              <p className="mt-1 text-sm text-slate-600">Newest registration requests awaiting review.</p>
            </div>
            <Link href="/admin/users" className="text-sm font-medium text-slate-700 hover:text-slate-950">
              Open users
            </Link>
          </div>

          <div className="space-y-3">
            {newestPendingUsers.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-6 text-sm text-slate-500">
                No pending approvals right now.
              </div>
            ) : (
              newestPendingUsers.map((user) => (
                <div key={user.id} className="rounded-2xl border border-slate-200 px-4 py-4">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="font-medium text-slate-900">{user.name}</p>
                      <p className="text-sm text-slate-600">{user.email}</p>
                    </div>
                    <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-medium text-amber-800">
                      {user.expected_role}
                    </span>
                  </div>
                  <p className="mt-3 text-xs uppercase tracking-[0.18em] text-slate-400">
                    Joined {formatDate(user.created_at)}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-3">
        <div className="rounded-[28px] border border-slate-200 bg-white p-6 xl:col-span-1">
          <div className="mb-5 flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-slate-950">Stock attention</h2>
              <p className="mt-1 text-sm text-slate-600">Items that may need replenishment soon.</p>
            </div>
            <Link href="/admin/items" className="text-sm font-medium text-slate-700 hover:text-slate-950">
              Open items
            </Link>
          </div>

          <div className="space-y-3">
            {urgentStockItems.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-6 text-sm text-slate-500">
                No low stock alerts right now.
              </div>
            ) : (
              urgentStockItems.map((item) => (
                <div key={item.id} className="rounded-2xl border border-slate-200 px-4 py-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-medium text-slate-900">{item.item_name}</p>
                      <p className="text-sm text-slate-600">{item.category_name || "Uncategorized"}</p>
                    </div>
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-medium ${
                        item.stock_status === "not_available"
                          ? "bg-rose-50 text-rose-700"
                          : "bg-amber-50 text-amber-700"
                      }`}
                    >
                      {item.stock_status === "not_available" ? "Out" : "Low"}
                    </span>
                  </div>
                  <p className="mt-3 text-sm text-slate-700">
                    {item.quantity} {item.unit} left
                    <span className="text-slate-400"> / threshold {item.low_stock_threshold}</span>
                  </p>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="rounded-[28px] border border-slate-200 bg-white p-6 xl:col-span-1">
          <div className="mb-5 flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-slate-950">Recent requests</h2>
              <p className="mt-1 text-sm text-slate-600">Latest request activity across the system.</p>
            </div>
          </div>

          <div className="space-y-3">
            {latestRequests.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-6 text-sm text-slate-500">
                No item requests have been submitted yet.
              </div>
            ) : (
              latestRequests.map((request) => (
                <div key={request.id} className="rounded-2xl border border-slate-200 px-4 py-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-medium text-slate-900">{request.item_name}</p>
                      <p className="text-sm text-slate-600">
                        {request.quantity_requested} requested by {request.requester_name || "Unknown user"}
                      </p>
                    </div>
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-medium ${
                        request.status === "pending"
                          ? "bg-amber-50 text-amber-700"
                          : request.status === "approved"
                            ? "bg-emerald-50 text-emerald-700"
                            : request.status === "issued"
                              ? "bg-sky-50 text-sky-700"
                              : "bg-rose-50 text-rose-700"
                      }`}
                    >
                      {formatStatusLabel(request.status)}
                    </span>
                  </div>
                  <p className="mt-3 text-xs uppercase tracking-[0.18em] text-slate-400">
                    {formatDateTime(request.requested_at)}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="rounded-[28px] border border-slate-200 bg-white p-6 xl:col-span-1">
          <div className="mb-5 flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-slate-950">Recent audit activity</h2>
              <p className="mt-1 text-sm text-slate-600">Latest tracked system actions.</p>
            </div>
            <Link href="/admin/log-viewer" className="text-sm font-medium text-slate-700 hover:text-slate-950">
              View logs
            </Link>
          </div>

          <div className="space-y-3">
            {recentLogs.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-6 text-sm text-slate-500">
                No audit entries are available yet.
              </div>
            ) : (
              recentLogs.map((log) => (
                <div key={log.id} className="rounded-2xl border border-slate-200 px-4 py-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-medium text-slate-900">{log.details || "System activity recorded"}</p>
                      <p className="text-sm text-slate-600">
                        {log.user_name || "System"}{log.table_name ? ` on ${log.table_name}` : ""}
                      </p>
                    </div>
                    <span className={`rounded-full px-3 py-1 text-xs font-medium ${getActionTone(log.action)}`}>
                      {log.action}
                    </span>
                  </div>
                  <p className="mt-3 text-xs uppercase tracking-[0.18em] text-slate-400">
                    {timeAgo(log.created_at)}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        <div className="rounded-[28px] border border-slate-200 bg-white p-6">
          <div className="flex items-center gap-3">
            <div className="rounded-2xl bg-slate-100 p-3 text-slate-700">
              <Users className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-semibold text-slate-950">Approved users</h3>
              <p className="text-sm text-slate-600">Active accounts ready to use the system.</p>
            </div>
          </div>
          <p className="mt-5 text-3xl font-semibold text-slate-950">
            {data.users.filter((user) => user.status === "approved").length}
          </p>
        </div>

        <div className="rounded-[28px] border border-slate-200 bg-white p-6">
          <div className="flex items-center gap-3">
            <div className="rounded-2xl bg-sky-50 p-3 text-sky-700">
              <ClipboardList className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-semibold text-slate-950">Issued requests</h3>
              <p className="text-sm text-slate-600">Requests already completed and handed over.</p>
            </div>
          </div>
          <p className="mt-5 text-3xl font-semibold text-slate-950">
            {data.requests.filter((request) => request.status === "issued").length}
          </p>
        </div>

        <div className="rounded-[28px] border border-slate-200 bg-white p-6">
          <div className="flex items-center gap-3">
            <div className="rounded-2xl bg-emerald-50 p-3 text-emerald-700">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-semibold text-slate-950">Recent logins</h3>
              <p className="text-sm text-slate-600">Audit entries marked as login events.</p>
            </div>
          </div>
          <p className="mt-5 text-3xl font-semibold text-slate-950">
            {data.logs.filter((log) => log.action === "LOGIN").length}
          </p>
        </div>
      </section>
    </div>
  )
}
