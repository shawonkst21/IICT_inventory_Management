"use client"

import React, { useState, useEffect } from "react"
import { AnimatePresence, motion } from "framer-motion"
import { Search, X, History } from "lucide-react"
import { fetchStockLevels, fetchCategories, type StockLevelItem, type Category } from "@/lib/api"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

type StockStatus = 'available' | 'low' | 'not_available' | ''

export default function StockLevel() {
  const [searchItemName, setSearchItemName] = useState("")
  const [selectedCategory, setSelectedCategory] = useState<number | "">("")
  const [selectedStatus, setSelectedStatus] = useState<StockStatus>("")
  const [items, setItems] = useState<StockLevelItem[]>([])
  const [filteredItems, setFilteredItems] = useState<StockLevelItem[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Fetch categories and items on mount
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true)
        setError(null)
        const [cats, stockItems] = await Promise.all([
          fetchCategories(),
          fetchStockLevels(),
        ])
        setCategories(cats)
        setItems(stockItems)
        setFilteredItems(stockItems)
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load data")
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [])

  // Filter items whenever search criteria changes
  useEffect(() => {
    const filterItems = async () => {
      try {
        setLoading(true)
        const results = await fetchStockLevels(
          searchItemName || undefined,
          selectedCategory ? Number(selectedCategory) : undefined,
          selectedStatus || undefined,
        )
        setFilteredItems(results)
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to filter items")
      } finally {
        setLoading(false)
      }
    }

    filterItems()
  }, [searchItemName, selectedCategory, selectedStatus])

  // Get unique item names for dropdown
  const itemNames = Array.from(new Set(items.map(item => item.item_name)))

  // Get stock status badge styling
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'available':
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
            Available
          </span>
        )
      case 'low':
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
            Low Stock
          </span>
        )
      case 'not_available':
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
            Not Available
          </span>
        )
      default:
        return null
    }
  }

  return (
    <AnimatePresence>
      <motion.div
        key="stocklevel"
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -6 }}
        transition={{ duration: 0.45 }}
        className="space-y-6 text-black"
      >
        {/* Header */}
        <div className="mb-8 mt-5 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-[#ECEAE5] px-3 py-1">
              <History className="h-3.5 w-3.5 text-[#5A5650]" />
              <span className="text-xs font-medium uppercase text-[#5A5650]">Inventory</span>
            </div>

            <h1 className="mb-2 text-4xl font-semibold text-[#1A1916]">Stock Inventory</h1>

            <p className="max-w-xl text-sm text-[#9A9690]">
              View and filter current stock levels across categories and statuses.
            </p>
          </div>
        </div>

        {/* Search and Filter Section */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.45 }}
          className="grid grid-cols-1 md:grid-cols-4 gap-4 rounded-2xl border border-[#E8E5DF] bg-white p-6 shadow-sm"
        >
        {/* Item Name Search */}
        <div className="flex flex-col">
          <label className="text-sm font-medium text-black mb-2">Item Name</label>
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-black" />
            <input
              type="text"
              placeholder="Search item name..."
              value={searchItemName}
              onChange={(e) => setSearchItemName(e.target.value)}
              className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
            {searchItemName && (
              <button
                onClick={() => setSearchItemName("")}
                className="absolute right-3 top-3 text-black hover:text-black"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
          {/* Item Name Dropdown Suggestions */}
          {searchItemName && itemNames.length > 0 && (
            <div className="mt-1 border border-slate-300 rounded-md bg-white shadow-lg max-h-32 overflow-y-auto">
              {itemNames
                .filter(name =>
                  name.toLowerCase().includes(searchItemName.toLowerCase())
                )
                .slice(0, 5)
                .map((name, idx) => (
                  <button
                    key={idx}
                    onClick={() => setSearchItemName(name)}
                    className="w-full text-left px-3 py-2 hover:bg-slate-100 text-sm text-black"
                  >
                    {name}
                  </button>
                ))}
            </div>
          )}
        </div>

        {/* Category Filter */}
        <div className="flex flex-col">
          <label className="text-sm font-medium text-black mb-2">Category</label>
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value ? Number(e.target.value) : "")}
            className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
          >
            <option value="">All Categories</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.name}
              </option>
            ))}
          </select>
        </div>

        {/* Status Filter */}
        <div className="flex flex-col">
          <label className="text-sm font-medium text-black mb-2">Status</label>
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value as StockStatus)}
            className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
          >
            <option value="">All Status</option>
            <option value="available">Available</option>
            <option value="low">Low Stock</option>
            <option value="not_available">Not Available</option>
          </select>
        </div>

        {/* Clear Filters Button */}
        <div className="flex flex-col justify-end">
          <button
            onClick={() => {
              setSearchItemName("")
              setSelectedCategory("")
              setSelectedStatus("")
            }}
            className="w-full px-4 py-2 bg-slate-200 text-black rounded-md hover:bg-slate-300 transition font-medium"
          >
            Clear Filters
          </button>
        </div>
      </motion.div>

      {/* Items Table Section */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 10 }}
          transition={{ duration: 0.45 }}
          className="overflow-hidden rounded-2xl border border-[#E8E5DF] bg-white shadow-sm"
        >
          <div className="p-6 border-b border-[#E8E5DF]">
            <h2 className="text-lg font-semibold text-[#1A1916]">Stock Inventory</h2>
            <p className="text-sm text-[#9A9690] mt-1">
              {filteredItems.length} item{filteredItems.length !== 1 ? "s" : ""} found
            </p>
          </div>

        {error && (
          <div className="m-6 p-4 bg-red-50 border border-red-200 rounded-md text-red-700 text-sm">
            {error}
          </div>
        )}

        {loading ? (
          <div className="p-6 text-center text-black">Loading...</div>
        ) : filteredItems.length === 0 ? (
          <div className="p-6 text-center text-black">
            No items found. Try adjusting your search criteria.
          </div>
        ) : (
          <div className={filteredItems.length > 5 ? "max-h-screen overflow-y-auto" : ""}>
            <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-[#5A5650]">Item Name</TableHead>
                <TableHead className="text-[#5A5650]">Category</TableHead>
                <TableHead className="text-[#5A5650]">Quantity</TableHead>
                <TableHead className="text-[#5A5650]">Unit</TableHead>
                <TableHead className="text-[#5A5650]">Threshold</TableHead>
                <TableHead className="text-[#5A5650]">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredItems.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="font-medium text-[#1A1916]">{item.item_name}</TableCell>
                  <TableCell className="text-[#1A1916]">{item.category_name || "—"}</TableCell>
                  <TableCell className="text-[#1A1916]">{item.quantity}</TableCell>
                  <TableCell className="text-[#1A1916]">{item.unit}</TableCell>
                  <TableCell className="text-[#1A1916]">{item.low_stock_threshold}</TableCell>
                  <TableCell>{getStatusBadge(item.stock_status)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
            </Table>
          </div>
        )}
      </motion.div>
    </motion.div>
    </AnimatePresence>
  )
}
