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
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  Clock,
} from "lucide-react"
import {
  Bar,
  BarChart,
  CartesianGrid,
  XAxis,
  YAxis,
  Pie,
  PieChart,
  Cell,
  ResponsiveContainer,
  Tooltip,
} from "recharts"
import { motion } from "framer-motion"

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "../../components/ui/Breadcrumb"
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

// Colors for pie/donut charts
const STOCK_STATUS_COLORS = {
  available: "#10b981", // emerald
  low: "#f59e0b", // amber
  not_available: "#ef4444", // red
}

const REQUEST_STATUS_COLORS = {
  pending: "#f59e0b", // amber
  approved: "#8b5cf6", // violet
  issued: "#3b82f6", // blue
  rejected: "#ef4444", // red
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
        value: "available",
      },
      {
        status: "Low",
        count: stockLevels.filter((item) => item.stock_status === "low").length,
        value: "low",
      },
      {
        status: "Out",
        count: stockLevels.filter((item) => item.stock_status === "not_available").length,
        value: "not_available",
      },
    ],
    [stockLevels],
  )

  const requestChartData = useMemo(
    () => [
      {
        status: "Pending",
        count: requests.filter((item) => item.status === "pending").length,
        value: "pending",
      },
      {
        status: "Approved",
        count: requests.filter((item) => item.status === "approved").length,
        value: "approved",
      },
      {
        status: "Issued",
        count: requests.filter((item) => item.status === "issued").length,
        value: "issued",
      },
      {
        status: "Rejected",
        count: requests.filter((item) => item.status === "rejected").length,
        value: "rejected",
      },
    ],
    [requests],
  )

  // Top categories by stock quantity
  const topCategories = useMemo(() => {
    const categories: Record<string, number> = {}
    stockLevels.forEach((item) => {
      const cat = item.category_name || "Uncategorized"
      categories[cat] = (categories[cat] || 0) + item.quantity
    })
    return Object.entries(categories)
      .map(([name, quantity]) => ({ name, quantity }))
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 6)
  }, [stockLevels])

  const pendingRequests = requests.filter((item) => item.status === "pending").length
  const approvedRequests = requests.filter((item) => item.status === "approved").length
  const issuedRequests = requests.filter((item) => item.status === "issued").length
  const lowStockCount = stockLevels.filter((item) => item.stock_status === "low").length
  const outOfStockCount = stockLevels.filter((item) => item.stock_status === "not_available").length

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2,
      },
    },
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.4 },
    },
  }

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

      <motion.section 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-3xl border border-[#E8E5DF] bg-[linear-gradient(135deg,#F7F6F3_0%,#FFFFFF_56%,#EEF2FF_100%)] p-6 shadow-sm lg:p-8"
      >
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
              Monitor the inventory route from one place. Advanced analytics and visualizations bring together stock health,
              request flow, and supplier receipts for faster decision-making.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:min-w-105">
            <motion.div 
              whileHover={{ y: -4 }}
              className="rounded-2xl border border-[#E8E5DF] bg-white/85 p-4 shadow-sm backdrop-blur"
            >
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#9A9690]">Live items</p>
              <div className="mt-3 flex items-end justify-between gap-3">
                <p className="text-3xl font-semibold text-[#1A1916]">{stockLevels.length}</p>
                <Boxes className="h-5 w-5 text-[#1A1916]" />
              </div>
            </motion.div>

            <motion.div 
              whileHover={{ y: -4 }}
              className="rounded-2xl border border-[#E8E5DF] bg-white/85 p-4 shadow-sm backdrop-blur"
            >
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#9A9690]">Pending requests</p>
              <div className="mt-3 flex items-end justify-between gap-3">
                <p className="text-3xl font-semibold text-[#1A1916]">{pendingRequests}</p>
                <ClipboardList className="h-5 w-5 text-[#1A1916]" />
              </div>
            </motion.div>
          </div>
        </div>
      </motion.section>

      {/* Enhanced KPI Cards */}
      <motion.div 
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="grid gap-4 md:grid-cols-2 xl:grid-cols-4"
      >
        <motion.div variants={itemVariants}>
          <EnhancedMetricCard
            label="Total SKUs"
            value={stockLevels.length}
            description="Tracked inventory records"
            icon={Boxes}
            trend={5}
            color="from-blue-50 to-blue-100"
          />
        </motion.div>
        <motion.div variants={itemVariants}>
          <EnhancedMetricCard
            label="Stock units"
            value={totalStockUnits}
            description="Physical quantity on hand"
            icon={PackageCheck}
            trend={12}
            color="from-emerald-50 to-emerald-100"
          />
        </motion.div>
        <motion.div variants={itemVariants}>
          <EnhancedMetricCard
            label="Low stock"
            value={lowStockCount}
            description="Items below threshold"
            icon={AlertTriangle}
            trend={-3}
            color="from-amber-50 to-amber-100"
            alert
          />
        </motion.div>
        <motion.div variants={itemVariants}>
          <EnhancedMetricCard
            label="Categories"
            value={categoryCount}
            description="Distinct inventory groups"
            icon={Warehouse}
            trend={2}
            color="from-purple-50 to-purple-100"
          />
        </motion.div>
      </motion.div>

      {loading ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex items-center justify-center rounded-3xl border border-[#E8E5DF] bg-white p-10 shadow-sm"
        >
          <Loader2 className="mr-2 h-5 w-5 animate-spin text-[#1A1916]" />
          Loading inventory dashboard...
        </motion.div>
      ) : error ? (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-start gap-3 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700"
        >
          <AlertCircle className="mt-0.5 h-4 w-4" />
          <span>{error}</span>
        </motion.div>
      ) : null}

      {!loading && !error ? (
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="space-y-6"
        >
          {/* Primary Charts Section */}
          <motion.section variants={itemVariants} className="grid gap-6 xl:grid-cols-2">
            {/* Stock Status Pie Chart */}
            <div className="rounded-3xl border border-[#E8E5DF] bg-white p-6 shadow-sm">
              <div className="mb-5 flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-lg font-semibold text-[#1A1916]">Stock status distribution</h2>
                  <p className="mt-1 text-sm text-[#9A9690]">Inventory health overview by availability.</p>
                </div>
                <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700">
                  {stockChartData.reduce((sum, item) => sum + item.count, 0)} items
                </span>
              </div>

              <div className="flex flex-col items-center justify-center">
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={stockChartData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={2}
                      dataKey="count"
                    >
                      {stockChartData.map((entry) => (
                        <Cell 
                          key={`cell-${entry.value}`} 
                          fill={STOCK_STATUS_COLORS[entry.value as keyof typeof STOCK_STATUS_COLORS]}
                        />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
                <div className="mt-4 grid grid-cols-3 gap-4 text-center text-sm">
                  {stockChartData.map((item) => (
                    <div key={item.status}>
                      <div 
                        className="mx-auto mb-2 h-3 w-3 rounded-full"
                        style={{ backgroundColor: STOCK_STATUS_COLORS[item.value as keyof typeof STOCK_STATUS_COLORS] }}
                      />
                      <p className="text-xs font-medium text-[#9A9690]">{item.status}</p>
                      <p className="font-semibold text-[#1A1916]">{item.count}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Request Pipeline Pie Chart */}
            <div className="rounded-3xl border border-[#E8E5DF] bg-white p-6 shadow-sm">
              <div className="mb-5 flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-lg font-semibold text-[#1A1916]">Request pipeline</h2>
                  <p className="mt-1 text-sm text-[#9A9690]">Approval state distribution across requests.</p>
                </div>
                <span className="rounded-full bg-violet-50 px-3 py-1 text-xs font-medium text-violet-700">
                  {requestChartData.reduce((sum, item) => sum + item.count, 0)} total
                </span>
              </div>

              <div className="flex flex-col gap-6">
                {requestChartData.map((item) => {
                  const totalCount = requestChartData.reduce((sum, i) => sum + i.count, 0)
                  const percentage = totalCount > 0 ? Math.round((item.count / totalCount) * 100) : 0
                  
                  return (
                    <div key={item.status} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium text-[#9A9690]">{item.status}</p>
                        <p className="text-sm font-semibold text-[#1A1916]">{percentage}%</p>
                      </div>
                      <div className="h-3 w-full overflow-hidden rounded-full bg-[#E8E5DF]">
                        <div
                          className="h-full rounded-full transition-all duration-500"
                          style={{
                            width: `${percentage}%`,
                            backgroundColor: REQUEST_STATUS_COLORS[item.value as keyof typeof REQUEST_STATUS_COLORS],
                          }}
                        />
                      </div>
                      <p className="text-xs text-[#9A9690]">{item.count} requests</p>
                    </div>
                  )
                })}
              </div>
            </div>
          </motion.section>

          {/* Category Distribution Bar Chart */}
          <motion.div variants={itemVariants} className="rounded-3xl border border-[#E8E5DF] bg-white p-6 shadow-sm">
            <div className="mb-5 flex items-start justify-between gap-4">
              <div>
                <h2 className="text-lg font-semibold text-[#1A1916]">Top categories by stock</h2>
                <p className="mt-1 text-sm text-[#9A9690]">Inventory distribution across top categories.</p>
              </div>
              <span className="rounded-full bg-[#ECEAE5] px-3 py-1 text-xs font-medium text-[#5A5650]">
                Top 6 categories
              </span>
            </div>

            <ResponsiveContainer width="100%" height={350}>
              <BarChart data={topCategories} margin={{ left: 0, right: 12, top: 8, bottom: 60 }}>
                <defs>
                  <linearGradient id="colorGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#7c3aed" stopOpacity={0.8}/>
                    <stop offset="100%" stopColor="#7c3aed" stopOpacity={0.3}/>
                  </linearGradient>
                </defs>
                <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="#E8E5DF" />
                <XAxis 
                  dataKey="name" 
                  tickLine={false} 
                  axisLine={false} 
                  angle={-45}
                  textAnchor="end"
                  height={100}
                />
                <YAxis tickLine={false} axisLine={false} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: "#fff", 
                    border: "1px solid #E8E5DF",
                    borderRadius: "8px"
                  }}
                />
                <Bar dataKey="quantity" fill="url(#colorGradient)" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </motion.div>

          {/* Secondary Section: Quick Access + Low Stock */}
          <motion.section variants={itemVariants} className="grid gap-6 xl:grid-cols-2">
            <div className="rounded-3xl border border-[#E8E5DF] bg-white p-6 shadow-sm">
              <div className="mb-5 flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-lg font-semibold text-[#1A1916]">Quick access</h2>
                  <p className="mt-1 text-sm text-[#9A9690]">Jump straight into common manager workflows.</p>
                </div>
                <RefreshCcw className="h-4 w-4 text-[#9A9690]" />
              </div>

              <div className="grid gap-3 md:grid-cols-2">
                {quickLinks.map((link) => {
                  const Icon = link.icon

                  return (
                    <motion.div
                      key={link.href}
                      whileHover={{ y: -4 }}
                      transition={{ type: "spring", stiffness: 400, damping: 10 }}
                    >
                      <Link
                        href={link.href}
                        className="group flex h-full rounded-2xl border border-[#E8E5DF] bg-[#FAFAF8] p-4 transition hover:border-[#D7D2C8] hover:bg-white"
                      >
                        <div className="flex flex-col gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#1A1916] text-white">
                            <Icon className="h-5 w-5" />
                          </div>
                          <div className="flex-1">
                            <h3 className="font-semibold text-[#1A1916]">{link.title}</h3>
                            <p className="mt-1 text-xs leading-4 text-[#5A5650]">{link.description}</p>
                          </div>
                          <ArrowUpRight className="h-4 w-4 text-[#9A9690] transition group-hover:text-[#1A1916]" />
                        </div>
                      </Link>
                    </motion.div>
                  )
                })}
              </div>
            </div>

            <div className="rounded-3xl border border-[#E8E5DF] bg-white p-6 shadow-sm">
              <div className="mb-5 flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-lg font-semibold text-[#1A1916]">Alert summary</h2>
                  <p className="mt-1 text-sm text-[#9A9690]">Items requiring immediate attention.</p>
                </div>
                <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-medium text-amber-700">
                  {lowStockCount + outOfStockCount} flagged
                </span>
              </div>

              <div className="space-y-3">
                <motion.div
                  whileHover={{ x: 4 }}
                  className="flex items-center justify-between gap-4 rounded-2xl bg-amber-50 px-4 py-4 border border-amber-200"
                >
                  <div className="flex items-center gap-3">
                    <AlertTriangle className="h-5 w-5 text-amber-600" />
                    <div>
                      <p className="font-semibold text-amber-900">Low Stock Items</p>
                      <p className="text-sm text-amber-700">{lowStockCount} items below threshold</p>
                    </div>
                  </div>
                  <span className="text-2xl font-bold text-amber-600">{lowStockCount}</span>
                </motion.div>

                <motion.div
                  whileHover={{ x: 4 }}
                  className="flex items-center justify-between gap-4 rounded-2xl bg-rose-50 px-4 py-4 border border-rose-200"
                >
                  <div className="flex items-center gap-3">
                    <AlertCircle className="h-5 w-5 text-rose-600" />
                    <div>
                      <p className="font-semibold text-rose-900">Out of Stock</p>
                      <p className="text-sm text-rose-700">{outOfStockCount} items unavailable</p>
                    </div>
                  </div>
                  <span className="text-2xl font-bold text-rose-600">{outOfStockCount}</span>
                </motion.div>

                <motion.div
                  whileHover={{ x: 4 }}
                  className="flex items-center justify-between gap-4 rounded-2xl bg-emerald-50 px-4 py-4 border border-emerald-200"
                >
                  <div className="flex items-center gap-3">
                    <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                    <div>
                      <p className="font-semibold text-emerald-900">Available Stock</p>
                      <p className="text-sm text-emerald-700">{stockLevels.filter(i => i.stock_status === "available").length} items in stock</p>
                    </div>
                  </div>
                  <span className="text-2xl font-bold text-emerald-600">
                    {stockLevels.filter(i => i.stock_status === "available").length}
                  </span>
                </motion.div>

                <motion.div
                  whileHover={{ x: 4 }}
                  className="flex items-center justify-between gap-4 rounded-2xl bg-violet-50 px-4 py-4 border border-violet-200"
                >
                  <div className="flex items-center gap-3">
                    <Clock className="h-5 w-5 text-violet-600" />
                    <div>
                      <p className="font-semibold text-violet-900">Pending Requests</p>
                      <p className="text-sm text-violet-700">{pendingRequests} awaiting review</p>
                    </div>
                  </div>
                  <span className="text-2xl font-bold text-violet-600">{pendingRequests}</span>
                </motion.div>
              </div>
            </div>
          </motion.section>

          {/* Low Stock Details */}
          <motion.section variants={itemVariants} className="rounded-3xl border border-[#E8E5DF] bg-white p-6 shadow-sm">
            <div className="mb-5 flex items-start justify-between gap-4">
              <div>
                <h2 className="text-lg font-semibold text-[#1A1916]">Low stock watchlist</h2>
                <p className="mt-1 text-sm text-[#9A9690]">Items needing immediate replenishment.</p>
              </div>
              <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-medium text-amber-700">
                {lowStockItems.length} flagged
              </span>
            </div>

            <div className="grid gap-3 lg:grid-cols-2">
              {lowStockItems.length > 0 ? (
                lowStockItems.map((item, idx) => (
                  <motion.div
                    key={item.id}
                    whileHover={{ y: -2 }}
                    className="flex items-center justify-between gap-4 rounded-2xl border border-[#E8E5DF] bg-gradient-to-r from-amber-50/50 to-transparent px-4 py-3"
                  >
                    <div className="flex items-center gap-3 flex-1">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-100">
                        <span className="text-lg font-bold text-amber-600">{idx + 1}</span>
                      </div>
                      <div className="flex-1">
                        <p className="font-semibold text-[#1A1916]">{item.item_name}</p>
                        <p className="text-xs text-[#9A9690]">
                          {item.category_name} · Threshold {item.low_stock_threshold}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold text-[#1A1916]">{formatQuantity(item.quantity)}</p>
                      <span className={`mt-1 inline-flex rounded-full border px-3 py-1 text-xs font-medium ${statusTone(item.stock_status)}`}>
                        {labelStatus(item.stock_status)}
                      </span>
                    </div>
                  </motion.div>
                ))
              ) : (
                <div className="rounded-2xl border border-dashed border-[#D7D2C8] bg-[#FAFAF8] p-6 text-center text-sm text-[#9A9690] lg:col-span-2">
                  No low stock items right now. Great job keeping inventory levels healthy!
                </div>
              )}
            </div>
          </motion.section>

          {/* Recent Receipts */}
          <motion.section variants={itemVariants} className="rounded-3xl border border-[#E8E5DF] bg-white p-6 shadow-sm">
            <div className="mb-5 flex items-start justify-between gap-4">
              <div>
                <h2 className="text-lg font-semibold text-[#1A1916]">Recent receipts</h2>
                <p className="mt-1 text-sm text-[#9A9690]">Latest supplier entries recorded in the system.</p>
              </div>
              <span className="rounded-full bg-[#ECEAE5] px-3 py-1 text-xs font-medium text-[#5A5650]">
                {approvedRequests} approved · {issuedRequests} issued
              </span>
            </div>

            <div className="grid gap-3 lg:grid-cols-2">
              {recentReceipts.length > 0 ? (
                recentReceipts.map((receipt) => (
                  <motion.div
                    key={receipt.id}
                    whileHover={{ y: -4 }}
                    className="rounded-2xl border border-[#E8E5DF] bg-gradient-to-br from-blue-50/30 to-transparent p-4"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <p className="font-semibold text-[#1A1916]">{receipt.item_name}</p>
                        <p className="mt-1 text-xs text-[#9A9690]">
                          {receipt.category_name || "Uncategorized"} · {receipt.supplier_name}
                        </p>
                      </div>
                      <span className={`inline-flex rounded-full border px-3 py-1 text-xs font-medium ${statusTone(receipt.quality_status)}`}>
                        {labelStatus(receipt.quality_status)}
                      </span>
                    </div>

                    <div className="mt-4 grid grid-cols-2 gap-3">
                      <div className="rounded-lg bg-white/60 p-3">
                        <p className="text-xs uppercase tracking-[0.18em] text-[#9A9690]">Quantity</p>
                        <p className="mt-1 font-semibold text-[#1A1916]">{formatQuantity(receipt.quantity_received)}</p>
                      </div>
                      <div className="rounded-lg bg-white/60 p-3">
                        <p className="text-xs uppercase tracking-[0.18em] text-[#9A9690]">Date</p>
                        <p className="mt-1 font-semibold text-[#1A1916]">{formatDate(receipt.receipt_date)}</p>
                      </div>
                    </div>
                  </motion.div>
                ))
              ) : (
                <div className="rounded-2xl border border-dashed border-[#D7D2C8] bg-[#FAFAF8] p-6 text-center text-sm text-[#9A9690] lg:col-span-2">
                  No receipts have been recorded yet.
                </div>
              )}
            </div>
          </motion.section>
        </motion.div>
      ) : null}
    </div>
  )
}

function EnhancedMetricCard({
  label,
  value,
  description,
  icon: Icon,
  trend,
  color,
  alert,
}: {
  label: string
  value: number
  description: string
  icon: ComponentType<{ className?: string }>
  trend?: number
  color?: string
  alert?: boolean
}) {
  return (
    <motion.div
      whileHover={{ y: -4 }}
      className={`rounded-2xl border border-[#E8E5DF] bg-gradient-to-br ${color || "from-slate-50 to-slate-100"} p-5 shadow-sm overflow-hidden relative`}
    >
      {/* Background glow */}
      <div className="pointer-events-none absolute -right-4 -top-4 h-20 w-20 rounded-full bg-white/40 blur-2xl" />
      
      <div className="relative flex items-start justify-between gap-4">
        <div className="flex-1">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#9A9690]">{label}</p>
          <p className="mt-3 text-3xl font-semibold text-[#1A1916]">{value}</p>
          <p className="mt-1 text-sm text-[#5A5650]">{description}</p>
          
          {trend !== undefined && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="mt-3 flex items-center gap-1"
            >
              {trend > 0 ? (
                <>
                  <TrendingUp className="h-4 w-4 text-emerald-600" />
                  <span className="text-xs font-medium text-emerald-600">
                    +{trend}% from last week
                  </span>
                </>
              ) : trend < 0 ? (
                <>
                  <AlertTriangle className="h-4 w-4 text-amber-600" />
                  <span className="text-xs font-medium text-amber-600">
                    {trend}% from last week
                  </span>
                </>
              ) : null}
            </motion.div>
          )}
        </div>
        <motion.div 
          whileHover={{ rotate: 10, scale: 1.1 }}
          className={`flex h-12 w-12 items-center justify-center rounded-xl ${alert ? "bg-amber-100 text-amber-600" : "bg-[#1A1916] text-white"}`}
        >
          <Icon className="h-6 w-6" />
        </motion.div>
      </div>
    </motion.div>
  )
}