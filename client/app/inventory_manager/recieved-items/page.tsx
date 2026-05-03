"use client"

import React, { useEffect, useMemo, useRef, useState } from "react"
import { AnimatePresence, motion } from "framer-motion"
import { ChevronDown, ClipboardList, History, PlusCircle, Save, Search, X } from "lucide-react"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "../../../components/ui/Breadcrumb"
import {
  createItem,
  createItemReceipt,
  fetchCategories,
  fetchItemReceipts,
  fetchStockLevels,
  type Category,
  type ItemOption,
  type ItemReceiptRecord,
} from "@/lib/api"
import DatePicker from "@/components/DatePicker"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet"

type QualityStatus = "good" | "partial" | "damaged" | "rejected"
type BillStatus = "paid" | "pending" | "unpaid"

const qualityStatusOptions: Array<{ value: QualityStatus; label: string }> = [
  { value: "good", label: "Good" },
  { value: "partial", label: "Partial" },
  { value: "damaged", label: "Damaged" },
  { value: "rejected", label: "Rejected" },
]

const billStatusOptions: Array<{ value: BillStatus; label: string }> = [
  { value: "paid", label: "Paid" },
  { value: "pending", label: "Pending" },
  { value: "unpaid", label: "Unpaid" },
]

function toDateInputValue(date: Date): string {
  return date.toISOString().slice(0, 10)
}

export default function ReceivedItemsPage() {
  const [categories, setCategories] = useState<Category[]>([])
  const [items, setItems] = useState<ItemOption[]>([])
  const [receipts, setReceipts] = useState<ItemReceiptRecord[]>([])
  const [activeTab, setActiveTab] = useState<"form" | "receipts">("form")

  const [selectedCategory, setSelectedCategory] = useState<number | "">("")
  const [selectedItemId, setSelectedItemId] = useState<number | "">("")
  const [itemSearch, setItemSearch] = useState("")
  const [itemDropdownOpen, setItemDropdownOpen] = useState(false)

  const [quantityReceived, setQuantityReceived] = useState("1")
  const [supplierName, setSupplierName] = useState("")
  const [challanNo, setChallanNo] = useState("")
  const [qualityStatus, setQualityStatus] = useState<QualityStatus>("good")
  const [billStatus, setBillStatus] = useState<BillStatus>("pending")
  const [receiptDate, setReceiptDate] = useState(toDateInputValue(new Date()))

  const [showCreateItem, setShowCreateItem] = useState(false)
  const [newItemName, setNewItemName] = useState("")
  const [newItemDescription, setNewItemDescription] = useState("")
  const [newItemUnit, setNewItemUnit] = useState("")
  const [newItemCurrentStock, setNewItemCurrentStock] = useState("0")
  const [newItemLowThreshold, setNewItemLowThreshold] = useState("5")

  const [loading, setLoading] = useState(false)
  const [submittingReceipt, setSubmittingReceipt] = useState(false)
  const [submittingNewItem, setSubmittingNewItem] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const itemDropdownRef = useRef<HTMLDivElement | null>(null)

  const loadItemsForCategory = async (categoryId: number) => {
    const stockItems = await fetchStockLevels(undefined, categoryId)
    const itemMap = new Map<number, ItemOption>()

    stockItems.forEach((stockItem) => {
      if (!itemMap.has(stockItem.id)) {
        itemMap.set(stockItem.id, { id: stockItem.id, name: stockItem.item_name })
      }
    })

    return Array.from(itemMap.values()).sort((a, b) => a.name.localeCompare(b.name))
  }

  const filteredItems = useMemo(() => {
    const query = itemSearch.trim().toLowerCase()
    if (!query) return items
    return items.filter((item) => item.name.toLowerCase().includes(query))
  }, [items, itemSearch])

  useEffect(() => {
    const loadInitialData = async () => {
      setLoading(true)
      setError(null)

      try {
        const categoryData = await fetchCategories()
        setCategories(categoryData)
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load categories")
      }

      try {
        const receiptData = await fetchItemReceipts()
        setReceipts(receiptData)
      } catch (err) {
        const receiptError = err instanceof Error ? err.message : "Failed to load receipts"
        setError((prev) => (prev ? `${prev}. ${receiptError}` : receiptError))
      }

      setLoading(false)
    }

    loadInitialData()
  }, [])

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (!itemDropdownRef.current) return
      if (!itemDropdownRef.current.contains(event.target as Node)) {
        setItemDropdownOpen(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [])

  useEffect(() => {
    const loadItemsByCategory = async () => {
      if (!selectedCategory) {
        setItems([])
        setSelectedItemId("")
        setItemSearch("")
        setItemDropdownOpen(false)
        return
      }

      try {
        setError(null)
        const categoryItems = await loadItemsForCategory(Number(selectedCategory))
        setItems(categoryItems)
        setSelectedItemId("")
        setItemSearch("")
        setItemDropdownOpen(false)
      } catch (err) {
        setItems([])
        setSelectedItemId("")
        setItemDropdownOpen(false)
        setError(err instanceof Error ? err.message : "Failed to load items for selected category")
      }
    }

    loadItemsByCategory()
  }, [selectedCategory])

  const resetReceiptForm = () => {
    setSelectedItemId("")
    setItemSearch("")
    setItemDropdownOpen(false)
    setQuantityReceived("1")
    setSupplierName("")
    setChallanNo("")
    setQualityStatus("good")
    setBillStatus("pending")
    setReceiptDate(toDateInputValue(new Date()))
  }

  const handleCreateReceipt = async (event: React.FormEvent) => {
    event.preventDefault()
    setSuccess(null)
    setError(null)

    if (!selectedCategory) {
      setError("Please select a category")
      return
    }

    if (!selectedItemId) {
      setError("Please select an item name")
      return
    }

    const parsedQuantity = Number.parseInt(quantityReceived, 10)
    if (!Number.isInteger(parsedQuantity) || parsedQuantity <= 0) {
      setError("Quantity must be a positive number")
      return
    }

    if (!supplierName.trim()) {
      setError("Supplier name is required")
      return
    }

    if (!challanNo.trim()) {
      setError("Challan number is required")
      return
    }

    if (!receiptDate) {
      setError("Receipt date is required")
      return
    }

    try {
      setSubmittingReceipt(true)
      await createItemReceipt({
        itemId: Number(selectedItemId),
        quantityReceived: parsedQuantity,
        supplierName: supplierName.trim(),
        challanNo: challanNo.trim(),
        qualityStatus,
        billStatus,
        receiptDate,
      })

      const [updatedReceipts, updatedItems] = await Promise.all([
        fetchItemReceipts(),
        loadItemsForCategory(Number(selectedCategory)),
      ])

      setReceipts(updatedReceipts)
      setItems(updatedItems)
      setSuccess("Receipt recorded successfully and stock updated")
      resetReceiptForm()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to record receipt")
    } finally {
      setSubmittingReceipt(false)
    }
  }

  const handleCreateItem = async (event: React.FormEvent) => {
    event.preventDefault()
    setSuccess(null)
    setError(null)

    if (!selectedCategory) {
      setError("Select a category before creating a new item")
      return
    }

    const parsedCurrentStock = Number.parseInt(newItemCurrentStock, 10)
    const parsedLowThreshold = Number.parseInt(newItemLowThreshold, 10)

    if (!newItemName.trim() || !newItemUnit.trim()) {
      setError("New item name and unit are required")
      return
    }

    if (!Number.isInteger(parsedCurrentStock) || parsedCurrentStock < 0) {
      setError("Current stock must be 0 or more")
      return
    }

    if (!Number.isInteger(parsedLowThreshold) || parsedLowThreshold < 0) {
      setError("Low stock threshold must be 0 or more")
      return
    }

    try {
      setSubmittingNewItem(true)
      const createdItem = await createItem({
        categoryId: Number(selectedCategory),
        name: newItemName.trim(),
        description: newItemDescription.trim(),
        unit: newItemUnit.trim(),
        currentStock: parsedCurrentStock,
        lowStockThreshold: parsedLowThreshold,
      })

      const updatedItems = await loadItemsForCategory(Number(selectedCategory))
      setItems(updatedItems)
      setSelectedItemId(createdItem.id)
      setItemSearch(createdItem.name)
      setShowCreateItem(false)
      setNewItemName("")
      setNewItemDescription("")
      setNewItemUnit("")
      setNewItemCurrentStock("0")
      setNewItemLowThreshold("5")
      setSuccess("New item created successfully")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create item")
    } finally {
      setSubmittingNewItem(false)
    }
  }

  return (
    <div className="min-h-screen w-full bg-[#F7F6F3] px-3  font-['DM_Sans',sans-serif]">
      <div className="mb-6">
        <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href="/">Home</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink href="/inventory_manager">Inventory Manager</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>Received Items</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
        </Breadcrumb>
      </div>

      <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-[#ECEAE5] px-3 py-1">
            <History className="h-3.5 w-3.5 text-[#5A5650]" />
            <span className="text-xs font-medium uppercase text-[#5A5650]">Inventory</span>
          </div>
          <h1 className="mb-2 text-4xl font-semibold text-[#1A1916]">Received Items</h1>
          <p className="max-w-xl text-sm text-[#9A9690]">
          Record supplier deliveries into <span className="font-semibold">item_receipts</span> and auto-update item stock.
          </p>
        </div>
      </div>

      <div className="mb-6 flex gap-4 border-b border-[#E8E5DF]">
        <button
          type="button"
          onClick={() => setActiveTab("form")}
          className={`pb-3 px-4 font-medium transition ${
            activeTab === "form"
              ? "border-b-2 border-[#1A1916] text-[#1A1916]"
              : "text-[#9A9690] hover:text-[#1A1916]"
          }`}
        >
          Receipt Form
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("receipts")}
          className={`pb-3 px-4 font-medium transition ${
            activeTab === "receipts"
              ? "border-b-2 border-[#1A1916] text-[#1A1916]"
              : "text-[#9A9690] hover:text-[#1A1916]"
          }`}
        >
          Recent Receipts ({receipts.length})
        </button>
      </div>

      {error && <div className="mb-6 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div>}
      {success && <div className="mb-6 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{success}</div>}

      <AnimatePresence mode="wait">
        {activeTab === "form" ? (
        <motion.form
          key="form"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.45 }}
          onSubmit={handleCreateReceipt}
          className="mb-6 space-y-5 rounded-2xl border border-[#E8E5DF] bg-white p-6 shadow-sm"
        >
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-black">Category</label>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value ? Number(e.target.value) : "")}
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-black focus:outline-none focus:ring-2 focus:ring-slate-500"
              required
            >
              <option value="">Select category</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2 lg:col-span-2">
            <label className="text-sm font-medium text-black">Item Name</label>
            <div className="relative" ref={itemDropdownRef}>
              <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
              <input
                type="text"
                value={itemSearch}
                onChange={(e) => {
                  const nextValue = e.target.value
                  setItemSearch(nextValue)
                  const exactMatch = items.find(
                    (item) => item.name.toLowerCase() === nextValue.trim().toLowerCase(),
                  )
                  setSelectedItemId(exactMatch ? exactMatch.id : "")
                  setItemDropdownOpen(Boolean(selectedCategory))
                }}
                onFocus={() => setItemDropdownOpen(Boolean(selectedCategory))}
                placeholder={selectedCategory ? "Search item name for selected category" : "Select category first"}
                disabled={!selectedCategory}
                className="w-full rounded-md border border-slate-300 pl-9 pr-16 py-2 text-black disabled:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-slate-500"
              />

              <div className="absolute right-2 top-1.5 flex items-center gap-1">
                {itemSearch ? (
                  <button
                    type="button"
                    onClick={() => {
                      setItemSearch("")
                      setSelectedItemId("")
                      setItemDropdownOpen(Boolean(selectedCategory))
                    }}
                    className="rounded p-1 text-slate-500 hover:bg-slate-100 hover:text-slate-700"
                  >
                    <X className="h-4 w-4" />
                  </button>
                ) : null}
                <button
                  type="button"
                  onClick={() => setItemDropdownOpen((prev) => !prev && Boolean(selectedCategory))}
                  disabled={!selectedCategory}
                  className="rounded p-1 text-slate-500 hover:bg-slate-100 hover:text-slate-700 disabled:opacity-50"
                >
                  <ChevronDown className="h-4 w-4" />
                </button>
              </div>

              {itemDropdownOpen && selectedCategory && (
                <div className="absolute z-20 mt-1 w-full rounded-md border border-slate-200 bg-white shadow-lg">
                  {filteredItems.length > 0 ? (
                    <div className="max-h-56 overflow-auto py-1">
                      {filteredItems.map((item) => (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => {
                            setSelectedItemId(item.id)
                            setItemSearch(item.name)
                            setItemDropdownOpen(false)
                          }}
                          className={`block w-full px-3 py-2 text-left text-sm hover:bg-slate-100 ${
                            selectedItemId === item.id ? "bg-slate-100 font-medium text-black" : "text-black"
                          }`}
                        >
                          {item.name}
                        </button>
                      ))}
                    </div>
                  ) : (
                    <div className="px-3 py-3 text-sm text-slate-600">
                      No items found for this search in selected category.
                    </div>
                  )}
                </div>
              )}
            </div>
            <p className="text-xs text-slate-600">
              {selectedCategory
                ? `${items.length} item${items.length !== 1 ? "s" : ""} available in selected category.`
                : "Select category first to activate item search dropdown."}
            </p>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-black">Quantity</label>
            <input
              type="number"
              min={1}
              step={1}
              value={quantityReceived}
              onChange={(e) => setQuantityReceived(e.target.value)}
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-black focus:outline-none focus:ring-2 focus:ring-slate-500"
              required
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-black">Supplier Name</label>
            <input
              type="text"
              value={supplierName}
              onChange={(e) => setSupplierName(e.target.value)}
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-black focus:outline-none focus:ring-2 focus:ring-slate-500"
              required
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-black">Challan No</label>
            <input
              type="text"
              value={challanNo}
              onChange={(e) => setChallanNo(e.target.value)}
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-black focus:outline-none focus:ring-2 focus:ring-slate-500"
              required
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-black">Quality Status</label>
            <select
              value={qualityStatus}
              onChange={(e) => setQualityStatus(e.target.value as QualityStatus)}
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-black focus:outline-none focus:ring-2 focus:ring-slate-500"
              required
            >
              {qualityStatusOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-black">Bill Status</label>
            <select
              value={billStatus}
              onChange={(e) => setBillStatus(e.target.value as BillStatus)}
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-black focus:outline-none focus:ring-2 focus:ring-slate-500"
              required
            >
              {billStatusOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-black">Receipt Date</label>
            <div>
              {/* Controlled DatePicker outputs YYYY-MM-DD string to match existing form state */}
              <DatePicker value={receiptDate} onChange={(v) => setReceiptDate(v)} placeholder="Pick receipt date" />
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => setShowCreateItem((value) => !value)}
            className="inline-flex items-center gap-2 rounded-md border border-[#E8E5DF] bg-white px-4 py-2 text-sm font-medium text-[#1A1916] transition hover:bg-[#F7F6F3]"
          >
            <PlusCircle className="h-4 w-4" />
            Create Item
          </button>

          <button
            type="submit"
            disabled={submittingReceipt}
            className="inline-flex items-center gap-2 rounded-md bg-[#1A1916] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#2D2B27] disabled:opacity-60"
          >
            <Save className="h-4 w-4" />
            {submittingReceipt ? "Saving..." : "Save Receipt"}
          </button>
        </div>
        </motion.form>
      ) : (
        <motion.div
          key="receipts"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.45 }}
          className="overflow-hidden rounded-2xl border border-[#E8E5DF] bg-white shadow-sm"
        >
        <div className="flex items-center justify-between border-b border-[#E8E5DF] px-6 py-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#1A1916] text-white">
              <ClipboardList className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-[#1A1916]">Recent Receipts</h2>
              <p className="text-xs text-[#9A9690]">Latest delivery entries and stock additions.</p>
            </div>
          </div>
          <span className="text-xs font-medium text-[#9A9690]">{receipts.length} records</span>
        </div>

        {loading ? (
          <div className="p-6 text-sm text-[#5A5650]">Loading receipts...</div>
        ) : receipts.length === 0 ? (
          <div className="p-6 text-sm text-[#5A5650]">No receipts recorded yet.</div>
        ) : (
          <div className={receipts.length > 5? "max-h-screen overflow-y-auto" : ""}>
            <Table>
              <TableHeader>
                <TableRow className="sticky top-0 z-10 bg-[#FAFAF8]">
                  <TableHead className="text-[#5A5650]">Date</TableHead>
                  <TableHead className="text-[#5A5650]">Category</TableHead>
                  <TableHead className="text-[#5A5650]">Item</TableHead>
                  <TableHead className="text-[#5A5650]">Qty</TableHead>
                  <TableHead className="text-[#5A5650]">Supplier</TableHead>
                  <TableHead className="text-[#5A5650]">Challan</TableHead>
                  <TableHead className="text-[#5A5650]">Quality</TableHead>
                  <TableHead className="text-[#5A5650]">Bill</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {receipts.map((receipt) => (
                  <TableRow key={receipt.id} className="transition hover:bg-[#F7F6F3]">
                    <TableCell className="text-[#1A1916]">{String(receipt.receipt_date).slice(0, 10)}</TableCell>
                    <TableCell className="text-[#1A1916]">{receipt.category_name || "-"}</TableCell>
                    <TableCell className="font-medium text-[#1A1916]">{receipt.item_name}</TableCell>
                    <TableCell className="text-[#1A1916]">{receipt.quantity_received}</TableCell>
                    <TableCell className="text-[#1A1916]">{receipt.supplier_name}</TableCell>
                    <TableCell className="text-[#1A1916]">{receipt.challan_no}</TableCell>
                    <TableCell className="text-[#1A1916] capitalize">{receipt.quality_status}</TableCell>
                    <TableCell className="text-[#1A1916] capitalize">{receipt.bill_status}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
        </motion.div>
      )}
      </AnimatePresence>

      <Sheet open={showCreateItem} onOpenChange={setShowCreateItem}>
        <SheetContent className="overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Create New Item</SheetTitle>
            <SheetDescription>
              If item name is not listed for the selected category, create it here.
            </SheetDescription>
          </SheetHeader>

          <form onSubmit={handleCreateItem} className="space-y-4 p-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-black">Category</label>
                <input
                  type="text"
                  value={
                    selectedCategory
                      ? categories.find((cat) => cat.id === selectedCategory)?.name || ""
                      : "Select category first"
                  }
                  readOnly
                  className="w-full rounded-md border border-slate-300 bg-slate-100 px-3 py-2 text-black"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-black">New Product Name</label>
                <input
                  type="text"
                  value={newItemName}
                  onChange={(e) => setNewItemName(e.target.value)}
                  className="w-full rounded-md border border-slate-300 px-3 py-2 text-black focus:outline-none focus:ring-2 focus:ring-slate-500"
                  required
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-black">Unit</label>
                <input
                  type="text"
                  value={newItemUnit}
                  onChange={(e) => setNewItemUnit(e.target.value)}
                  placeholder="pcs / box / kg"
                  className="w-full rounded-md border border-slate-300 px-3 py-2 text-black focus:outline-none focus:ring-2 focus:ring-slate-500"
                  required
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-black">Current Stock</label>
                <input
                  type="number"
                  min={0}
                  step={1}
                  value={newItemCurrentStock}
                  onChange={(e) => setNewItemCurrentStock(e.target.value)}
                  className="w-full rounded-md border border-slate-300 px-3 py-2 text-black focus:outline-none focus:ring-2 focus:ring-slate-500"
                  required
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-black">Low Stock Threshold</label>
                <input
                  type="number"
                  min={0}
                  step={1}
                  value={newItemLowThreshold}
                  onChange={(e) => setNewItemLowThreshold(e.target.value)}
                  className="w-full rounded-md border border-slate-300 px-3 py-2 text-black focus:outline-none focus:ring-2 focus:ring-slate-500"
                  required
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-black">Description</label>
                <textarea
                  value={newItemDescription}
                  onChange={(e) => setNewItemDescription(e.target.value)}
                  rows={4}
                  className="w-full rounded-md border border-slate-300 px-3 py-2 text-black focus:outline-none focus:ring-2 focus:ring-slate-500"
                />
              </div>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                type="submit"
                disabled={submittingNewItem || !selectedCategory}
                className="rounded-md bg-black px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-60"
              >
                {submittingNewItem ? "Creating..." : "Create Item"}
              </button>
              <button
                type="button"
                onClick={() => setShowCreateItem(false)}
                className="rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-black hover:bg-slate-100"
              >
                Cancel
              </button>
            </div>
          </form>
        </SheetContent>
      </Sheet>

    </div>
  )
}