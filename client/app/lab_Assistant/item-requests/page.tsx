"use client"

import { FormEvent, useEffect, useMemo, useState, useRef } from "react"
import { Package, AlertCircle, CheckCircle, Loader2, ChevronDown } from "lucide-react"
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

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [])

  const handleItemSelect = (item: ItemOption) => {
    setSelectedItemId(item.id)
    setItemSearch(item.name)
    setDropdownOpen(false)
  }

  const filteredItems = useMemo(() => {
    const query = itemSearch.trim().toLowerCase()

    if (!query) {
      return items
    }

    return items.filter((item) => item.name.toLowerCase().includes(query))
  }, [itemSearch, items])

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

    setSubmitting(true)

    try {
      await submitItemRequest({
        itemId: selectedItemId,
        quantityRequested: parsedQty,
        department: department.trim(),
        purpose: purpose.trim(),
        recipientRoom: roomNo.trim(),
      })

      setSubmitMessage("Item request submitted successfully")
      setQuantity("")
      setDepartment("")
      setPurpose("")
      setRoomNo("")
      setSelectedItemId(null)
      setItemSearch("")
    } catch (error) {
      setSubmitError((error as Error).message || "Failed to submit request")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="w-full bg-linear-to-br from-slate-50 to-slate-100 p-8">
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
            <BreadcrumbPage>Item Requests</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <div className="mt-8">
        <div className="flex items-center gap-3 mb-2">
          <Package className="w-8 h-8 text-black" />
          <h1 className="text-3xl font-bold text-black">Item Request Form</h1>
        </div>
        <p className="text-black text-opacity-70 text-sm mb-8">
          Submit a request to obtain items from inventory for your department.
        </p>

        <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-8">
          <form className="space-y-8" onSubmit={handleSubmit}>
            {/* Item Selection Section */}
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-black flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-black text-white flex items-center justify-center text-xs font-bold">1</span>
                Select Item
              </h2>

              {/* Searchable Dropdown - Combined Search and Dropdown */}
              <div ref={dropdownRef} className="space-y-3">
                <label className="block text-sm font-semibold text-black">
                  Search & Select Item <span className="text-red-600">*</span>
                </label>
                <div className="relative">
                  <div className="relative">
                    <input
                      type="text"
                      value={itemSearch}
                      onChange={(event) => {
                        setItemSearch(event.target.value)
                        setDropdownOpen(true)
                        setSelectedItemId(null)
                      }}
                      onFocus={() => setDropdownOpen(true)}
                      placeholder={
                        loadingItems
                          ? "Loading items..."
                          : "Search and select item..."
                      }
                      className="w-full rounded-lg border-2 border-slate-200 px-4 py-3 pr-10 text-black placeholder-slate-500 outline-none focus:border-black focus:ring-2 focus:ring-black focus:ring-opacity-10 transition"
                      disabled={loadingItems}
                    />
                    <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-500 pointer-events-none" />
                  </div>

                  {/* Dropdown Menu */}
                  {dropdownOpen && !loadingItems && (
                    <div className="absolute top-full left-0 right-0 mt-1 bg-white border-2 border-slate-200 rounded-lg shadow-lg z-50 max-h-64 overflow-y-auto">
                      {filteredItems.length > 0 ? (
                        filteredItems.map((item) => (
                          <button
                            key={item.id}
                            type="button"
                            onClick={() => handleItemSelect(item)}
                            className={`w-full text-left px-4 py-3 hover:bg-slate-100 transition border-b border-slate-100 last:border-b-0 ${
                              selectedItemId === item.id
                                ? "bg-black text-white hover:bg-slate-900"
                                : "text-black"
                            }`}
                          >
                            <div className="font-medium">{item.name}</div>
                            <div className={`text-xs ${
                              selectedItemId === item.id
                                ? "text-slate-300"
                                : "text-slate-500"
                            }`}>
                              ID: {item.id}
                            </div>
                          </button>
                        ))
                      ) : (
                        <div className="px-4 py-6 text-center text-slate-500 text-sm">
                          No items found
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {selectedItemId ? (
                  <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-blue-600" />
                    <p className="text-sm text-black font-medium">
                      ✓ {itemSearch} (ID: {selectedItemId})
                    </p>
                  </div>
                ) : null}
                {fetchError ? (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
                    <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
                    <p className="text-sm text-red-700">{fetchError}</p>
                  </div>
                ) : null}
              </div>
            </div>

            {/* Request Details Section */}
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-black flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-black text-white flex items-center justify-center text-xs font-bold">2</span>
                Request Details
              </h2>

              {/* 2-Column Grid */}
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-black mb-2">
                    Quantity <span className="text-red-600">*</span>
                  </label>
                  <input
                    type="number"
                    min={1}
                    step={1}
                    value={quantity}
                    onChange={(event) => setQuantity(event.target.value)}
                    placeholder="Enter quantity"
                    className="w-full rounded-lg border-2 border-slate-200 px-4 py-3 text-black placeholder-slate-500 outline-none focus:border-black focus:ring-2 focus:ring-black focus:ring-opacity-10 transition"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-black mb-2">
                    Department <span className="text-red-600">*</span>
                  </label>
                  <input
                    type="text"
                    value={department}
                    onChange={(event) => setDepartment(event.target.value)}
                    placeholder="e.g. Laboratory"
                    className="w-full rounded-lg border-2 border-slate-200 px-4 py-3 text-black placeholder-slate-500 outline-none focus:border-black focus:ring-2 focus:ring-black focus:ring-opacity-10 transition"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-black mb-2">
                    Room No <span className="text-red-600">*</span>
                  </label>
                  <input
                    type="text"
                    value={roomNo}
                    onChange={(event) => setRoomNo(event.target.value)}
                    placeholder="e.g. Lab 1"
                    className="w-full rounded-lg border-2 border-slate-200 px-4 py-3 text-black placeholder-slate-500 outline-none focus:border-black focus:ring-2 focus:ring-black focus:ring-opacity-10 transition"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-black mb-2">
                    Purpose <span className="text-red-600">*</span>
                  </label>
                  <textarea
                    rows={2}
                    value={purpose}
                    onChange={(event) => setPurpose(event.target.value)}
                    placeholder="Why do you need this item?"
                    className="w-full rounded-lg border-2 border-slate-200 px-4 py-3 text-black placeholder-slate-500 outline-none focus:border-black focus:ring-2 focus:ring-black focus:ring-opacity-10 transition resize-none"
                    required
                  />
                </div>
              </div>
            </div>

            {/* Messages */}
            {submitError ? (
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
                <p className="text-sm text-red-700">{submitError}</p>
              </div>
            ) : null}
            {submitMessage ? (
              <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-lg flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                <p className="text-sm text-emerald-700">{submitMessage}</p>
              </div>
            ) : null}

            {/* Submit Button */}
            <div className="flex gap-4 pt-6 border-t border-slate-200">
              <button
                type="submit"
                disabled={submitting || loadingItems}
                className="flex-1 rounded-lg bg-black text-white font-semibold py-3 hover:bg-slate-900 disabled:opacity-60 disabled:cursor-not-allowed transition flex items-center justify-center gap-2"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  "Submit Request"
                )}
              </button>
              <button
                type="reset"
                disabled={submitting}
                className="px-6 rounded-lg bg-slate-200 text-black font-semibold py-3 hover:bg-slate-300 disabled:opacity-60 transition"
              >
                Clear
              </button>
            </div>
          </form>
        </div>

        {/* Info Box */}
        <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-sm text-black">
            <span className="font-semibold">Note:</span> Submit your item request with required details. The admin team will review and approve/reject your request.
          </p>
        </div>
      </div>
    </div>
  )
}
