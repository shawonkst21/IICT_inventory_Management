"use client"

import { FormEvent, useEffect, useMemo, useState, useRef } from "react"
import {
  Package,
  AlertCircle,
  CheckCircle,
  Loader2,
  ChevronDown,
  Search,
} from "lucide-react"
import { toast } from "sonner"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "../../../components/ui/Breadcrumb"
import { fetchItemOptions, submitItemRequest, type ItemOption } from "../../../lib/api"

export default function ItemRequestsPage() {
  const [items, setItems] = useState<ItemOption[]>([])
  const [loadingItems, setLoadingItems] = useState(true)
  const [fetchError, setFetchError] = useState("")

  const [itemSearch, setItemSearch] = useState("")
  const [selectedItemId, setSelectedItemId] = useState<number | null>(null)
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  const [quantity, setQuantity] = useState("")
  const [department, setDepartment] = useState("")
  const [purpose, setPurpose] = useState("")
  const [roomNo, setRoomNo] = useState("")

  const [submitting, setSubmitting] = useState(false)
  const [submitMessage, setSubmitMessage] = useState("")
  const [submitError, setSubmitError] = useState("")

  useEffect(() => {
    const loadItems = async () => {
      setLoadingItems(true)
      setFetchError("")
      try {
        const itemList = await fetchItemOptions()
        setItems(itemList)
      } catch (error) {
        setFetchError((error as Error).message || "Failed to load items from backend")
      } finally {
        setLoadingItems(false)
      }
    }
    void loadItems()
  }, [])

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  const handleItemSelect = (item: ItemOption) => {
    setSelectedItemId(item.id)
    setItemSearch(item.name)
    setDropdownOpen(false)
  }

  const filteredItems = useMemo(() => {
    const query = itemSearch.trim().toLowerCase()
    if (!query) return items
    return items.filter((item) => item.name.toLowerCase().includes(query))
  }, [itemSearch, items])

  const handleClear = () => {
    setItemSearch("")
    setSelectedItemId(null)
    setDropdownOpen(false)
    setQuantity("")
    setDepartment("")
    setPurpose("")
    setRoomNo("")
    setSubmitMessage("")
    setSubmitError("")
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setSubmitMessage("")
    setSubmitError("")

    if (!selectedItemId) {
      setSubmitError("Please select an item")
      return
    }

    const parsedQty = Number.parseInt(quantity, 10)
    if (!Number.isInteger(parsedQty) || parsedQty <= 0) {
      setSubmitError("Quantity must be a positive number")
      return
    }

    if (!department.trim() || !purpose.trim() || !roomNo.trim()) {
      setSubmitError("Department, purpose and room no are required")
      return
    }

    const requestPayload = {
      itemId: selectedItemId,
      quantityRequested: parsedQty,
      department: department.trim(),
      purpose: purpose.trim(),
      recipientRoom: roomNo.trim(),
    }

    setSubmitting(true)
    try {
      await submitItemRequest(requestPayload)
      setSubmitMessage("Item request submitted successfully")
      toast("Item request submitted", { description: "Your request was submitted successfully." })
      setQuantity("")
      setDepartment("")
      setPurpose("")
      setRoomNo("")
      setSelectedItemId(null)
      setItemSearch("")
      // removed redirect to history page to avoid shifting context
    } catch (error) {
      const msg = (error as Error).message || "Failed to submit request"
      setSubmitError(msg)
      toast(msg)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen w-full bg-[#F7F6F3] px-8 py-8 font-['DM_Sans',sans-serif]">
      
      {/* Top bar */}
      <div className="flex items-center justify-between mb-6">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="/">Home</BreadcrumbLink>
            </BreadcrumbItem>
            {/* <BreadcrumbSeparator className="text-[#C8C5BF]" /> */}
            {/* <BreadcrumbItem>
              <BreadcrumbLink href="/lab_Assistant" className="hover:text-[#1A1916] transition-colors">Dashboard</BreadcrumbLink>
            </BreadcrumbItem> */}
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>Item Requests</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </div>

      {/* Page Header */}
      <div className="mb-8">
        <div className="inline-flex items-center gap-2 rounded-full bg-[#ECEAE5] px-3 py-1 mb-4">
          <Package className="w-3.5 h-3.5 text-[#5A5650]" />
          <span className="text-xs font-medium text-[#5A5650] tracking-wide uppercase">Inventory</span>
        </div>
        <h1 className="text-4xl font-semibold tracking-tight text-[#1A1916] leading-none mb-2">
          Item Request
        </h1>
        <p className="text-sm text-[#9A9690] max-w-md">
          Request items from inventory for your department. Your admin team will review and respond.
        </p>
      </div>

      {/* Form Card */}
      <div className="bg-white rounded-2xl border border-[#E8E5DF] shadow-sm overflow-hidden">

        <form className="p-6 space-y-8" onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <div className="rounded-xl border border-[#ECE8E1] bg-[#FCFCFA] p-5 space-y-5">
              <div>
                <p className="text-xs text-[#9A9690] mt-1">Select item and provide request quantity with room number.</p>
              </div>

              <div ref={dropdownRef} className="relative space-y-2">
                <label className="block text-xs font-medium text-[#9A9690] uppercase tracking-wider">
                  Select Item <span className="text-rose-400">*</span>
                </label>
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#C8C5BF] pointer-events-none" />
                  <input
                    type="text"
                    value={itemSearch}
                    onChange={(e) => {
                      setItemSearch(e.target.value)
                      setDropdownOpen(true)
                      setSelectedItemId(null)
                    }}
                    onFocus={() => setDropdownOpen(true)}
                    placeholder={loadingItems ? "Loading items..." : "Search items..."}
                    disabled={loadingItems}
                    className="w-full rounded-xl border border-[#E2DFD9] bg-white pl-11 pr-10 py-3 text-sm text-[#1A1916] placeholder-[#C8C5BF] outline-none focus:border-[#1A1916] focus:ring-2 focus:ring-[#1A1916]/8 transition-all duration-200 disabled:opacity-50"
                  />
                  <ChevronDown
                    className={`absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9A9690] pointer-events-none transition-transform duration-200 ${dropdownOpen ? "rotate-180" : ""}`}
                  />
                </div>

                {dropdownOpen && !loadingItems && (
                  <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-[#E2DFD9] rounded-xl shadow-lg z-50 max-h-56 overflow-y-auto">
                    {filteredItems.length > 0 ? (
                      filteredItems.map((item) => (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => handleItemSelect(item)}
                          className={`w-full flex items-center justify-between px-4 py-3 transition-colors border-b border-[#F0EDE8] last:border-b-0 ${
                            selectedItemId === item.id
                              ? "bg-[#1A1916] text-white"
                              : "text-[#1A1916] hover:bg-[#F7F6F3]"
                          }`}
                        >
                          <span className="text-sm font-medium truncate">{item.name}</span>
                        
                        </button>
                      ))
                    ) : (
                      <div className="px-4 py-8 text-center text-sm text-[#9A9690]">No items found</div>
                    )}
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <label className="block text-xs font-medium uppercase tracking-wider text-[#9A9690]">
                  Quantity <span className="text-rose-400">*</span>
                </label>
                <input
                  type="number"
                  min={1}
                  step={1}
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  placeholder="e.g. 5"
                  required
                  className="w-full rounded-xl border border-[#E2DFD9] bg-white px-4 py-3 text-sm text-[#1A1916] placeholder-[#C8C5BF] outline-none focus:border-[#1A1916] focus:ring-2 focus:ring-[#1A1916]/8 transition-all duration-200"
                />
              </div>

              <div className="space-y-2">
                <label className="block text-xs font-medium uppercase tracking-wider text-[#9A9690]">
                  Room No <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  value={roomNo}
                  onChange={(e) => setRoomNo(e.target.value)}
                  placeholder="e.g. Lab 1"
                  required
                  className="w-full rounded-xl border border-[#E2DFD9] bg-white px-4 py-3 text-sm text-[#1A1916] placeholder-[#C8C5BF] outline-none focus:border-[#1A1916] focus:ring-2 focus:ring-[#1A1916]/8 transition-all duration-200"
                />
              </div>
            </div>

            <div className="rounded-xl border border-[#ECE8E1] bg-[#FCFCFA] p-5 space-y-5">
              <div>
                <p className="text-xs text-[#9A9690] mt-1">Provide department and a clear description for approval.</p>
              </div>

              <div className="space-y-2">
                <label className="block text-xs font-medium uppercase tracking-wider text-[#9A9690]">
                  Department <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  placeholder="e.g. Laboratory"
                  required
                  className="w-full rounded-xl border border-[#E2DFD9] bg-white px-4 py-3 text-sm text-[#1A1916] placeholder-[#C8C5BF] outline-none focus:border-[#1A1916] focus:ring-2 focus:ring-[#1A1916]/8 transition-all duration-200"
                />
              </div>

              <div className="space-y-2">
                <label className="block text-xs font-medium uppercase tracking-wider text-[#9A9690]">
                  Description <span className="text-rose-400">*</span>
                </label>
                <textarea
                  rows={6}
                  value={purpose}
                  onChange={(e) => setPurpose(e.target.value)}
                  placeholder="Why do you need this item? Mention usage details."
                  required
                  className="w-full resize-none rounded-xl border border-[#E2DFD9] bg-white px-4 py-3 text-sm text-[#1A1916] placeholder-[#C8C5BF] outline-none focus:border-[#1A1916] focus:ring-2 focus:ring-[#1A1916]/8 transition-all duration-200"
                />
              </div>
            </div>
          </div>

          {fetchError && (
            <div className="flex items-start gap-2.5 rounded-xl bg-rose-50 border border-rose-200 px-4 py-3">
              <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
              <p className="text-sm text-rose-700">{fetchError}</p>
            </div>
          )}

          {/* ── Feedback Messages ── */}
          {submitError && (
            <div className="flex items-start gap-2.5 rounded-xl bg-rose-50 border border-rose-200 px-4 py-3">
              <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
              <p className="text-sm text-rose-700">{submitError}</p>
            </div>
          )}
         

          {/* ── Actions ── */}
          <div className="flex items-center justify-end gap-3 pt-6 border-t border-[#E8E5DF]">
            <button
              type="submit"
              disabled={submitting || loadingItems}
              className="group inline-flex items-center justify-center gap-2 rounded-md bg-[#1A1916] px-4 py-2 text-sm 
              font-semibold text-white hover:bg-[#2D2B27] disabled:opacity-50
               disabled:cursor-not-allowed transition-all duration-200"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Submitting…
                </>
              ) : (
                <>
                  Submit Request
                </>
              )}
            </button>

            <button
              type="button"
              onClick={handleClear}
              disabled={submitting}
              className="px-4 py-2 rounded-md border border-[#E2DFD9] bg-[#FAFAF8] text-sm font-medium text-[#5A5650] hover:border-[#1A1916] hover:text-[#1A1916] disabled:opacity-50 transition-all duration-200"
            >
              Clear
            </button>
          </div>
        </form>
      </div>

      {/* Note */}
      <div className="mt-4 flex items-start gap-2.5 px-1">
        <div className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-[#C8C5BF]" />
        <p className="text-xs text-[#9A9690] leading-relaxed">
          Requests are reviewed by the admin team. You will be notified once a decision is made.
        </p>
      </div>
    </div>
  )
}