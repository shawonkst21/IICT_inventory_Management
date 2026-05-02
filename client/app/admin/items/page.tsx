"use client"

import { useEffect, useState } from "react"
import { Loader2, Plus, Pencil, Search, Trash2, Save, X } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import {
  createAdminItem,
  deleteAdminItem,
  fetchAdminCategories,
  fetchAdminItems,
  updateAdminItem,
  type AdminCategory,
  type AdminItem,
} from "@/lib/api"

type ItemDraft = {
  categoryId: string
  name: string
  description: string
  unit: string
  currentStock: string
  lowStockThreshold: string
}

const emptyDraft: ItemDraft = {
  categoryId: "",
  name: "",
  description: "",
  unit: "pcs",
  currentStock: "0",
  lowStockThreshold: "0",
}

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Something went wrong"
}

function isDuplicateError(error: unknown) {
  return getErrorMessage(error).toLowerCase().includes("already exists")
}

function toDraft(item: AdminItem): ItemDraft {
  return {
    categoryId: String(item.category_id),
    name: item.name,
    description: item.description || "",
    unit: item.unit,
    currentStock: String(item.current_stock),
    lowStockThreshold: String(item.low_stock_threshold),
  }
}

export default function AdminItemsPage() {
  const [items, setItems] = useState<AdminItem[]>([])
  const [categories, setCategories] = useState<AdminCategory[]>([])
  const [search, setSearch] = useState("")
  const [draft, setDraft] = useState<ItemDraft>(emptyDraft)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [editingDraft, setEditingDraft] = useState<ItemDraft>(emptyDraft)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [pageError, setPageError] = useState("")
  const [alertOpen, setAlertOpen] = useState(false)
  const [alertMessage, setAlertMessage] = useState("")
  const [deleteTarget, setDeleteTarget] = useState<AdminItem | null>(null)

  const loadItems = async (query = search) => {
    setLoading(true)
    setPageError("")

    try {
      const data = await fetchAdminItems(query)
      setItems(data)
    } catch (error) {
      setPageError(getErrorMessage(error))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const load = async () => {
      try {
        const [categoryData, itemData] = await Promise.all([fetchAdminCategories(), fetchAdminItems(search)])
        setCategories(categoryData)
        setItems(itemData)
      } catch (error) {
        setPageError(getErrorMessage(error))
      } finally {
        setLoading(false)
      }
    }

    void load()
  }, [])

  useEffect(() => {
    const timer = setTimeout(() => {
      void loadItems(search)
    }, 250)

    return () => clearTimeout(timer)
  }, [search])

  const openDuplicateAlert = (message: string) => {
    setAlertMessage(message)
    setAlertOpen(true)
  }

  const resetCreateForm = () => setDraft(emptyDraft)

  const handleCreate = async () => {
    const categoryId = Number.parseInt(draft.categoryId, 10)

    if (!Number.isInteger(categoryId) || categoryId <= 0) return

    setSaving(true)
    setPageError("")

    try {
      await createAdminItem({
        categoryId,
        name: draft.name.trim(),
        description: draft.description.trim(),
        unit: draft.unit.trim(),
        currentStock: Number.parseInt(draft.currentStock, 10) || 0,
        lowStockThreshold: Number.parseInt(draft.lowStockThreshold, 10) || 0,
      })
      setDraft(emptyDraft)
      await loadItems()
    } catch (error) {
      if (isDuplicateError(error)) {
        openDuplicateAlert(getErrorMessage(error))
      } else {
        setPageError(getErrorMessage(error))
      }
    } finally {
      setSaving(false)
    }
  }

  const handleEdit = (item: AdminItem) => {
    setEditingId(item.id)
    setEditingDraft(toDraft(item))
  }

  const handleCancelEdit = () => {
    setEditingId(null)
    setEditingDraft(emptyDraft)
  }

  const handleUpdate = async (itemId: number) => {
    const categoryId = Number.parseInt(editingDraft.categoryId, 10)

    if (!Number.isInteger(categoryId) || categoryId <= 0) return

    setSaving(true)
    setPageError("")

    try {
      await updateAdminItem(itemId, {
        categoryId,
        name: editingDraft.name.trim(),
        description: editingDraft.description.trim(),
        unit: editingDraft.unit.trim(),
        currentStock: Number.parseInt(editingDraft.currentStock, 10) || 0,
        lowStockThreshold: Number.parseInt(editingDraft.lowStockThreshold, 10) || 0,
      })
      handleCancelEdit()
      await loadItems()
    } catch (error) {
      if (isDuplicateError(error)) {
        openDuplicateAlert(getErrorMessage(error))
      } else {
        setPageError(getErrorMessage(error))
      }
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (itemId: number) => {
    setSaving(true)
    setPageError("")

    try {
      await deleteAdminItem(itemId)
      if (editingId === itemId) {
        handleCancelEdit()
      }
      await loadItems()
    } catch (error) {
      setPageError(getErrorMessage(error))
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <AlertDialog open={alertOpen} onOpenChange={setAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Duplicate item</AlertDialogTitle>
            <AlertDialogDescription>{alertMessage}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Close</AlertDialogCancel>
            <AlertDialogAction onClick={() => setAlertOpen(false)}>OK</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog
        open={Boolean(deleteTarget)}
        onOpenChange={(open) => {
          if (!open) {
            setDeleteTarget(null)
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete item?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete {deleteTarget?.name || "this item"}. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={async () => {
                if (!deleteTarget) return
                const itemId = deleteTarget.id
                setDeleteTarget(null)
                await handleDelete(itemId)
              }}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
            <p className="text-sm font-medium uppercase tracking-[0.2em] text-black">Admin tools</p>
            <h1 className="mt-2 text-3xl font-semibold text-black">Items</h1>
            <p className="mt-2 max-w-2xl text-sm text-black">
              Create items, manage duplicates, and edit or delete entries from one searchable panel.
          </p>
        </div>

        <label className="flex w-full max-w-sm items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
          <Search className="h-4 w-4 text-slate-400" />
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search items or categories"
            className="w-full bg-transparent text-black text-sm outline-none placeholder:text-slate-400"
          />
        </label>
      </div>

      {pageError ? (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {pageError}
        </div>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-black">Create item</h2>
            <Button variant="outline" onClick={resetCreateForm} disabled={saving}>
              Clear
            </Button>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <label className="space-y-2 md:col-span-2">
              <span className="text-sm font-medium text-black">Item name</span>
              <input
                value={draft.name}
                onChange={(event) => setDraft((current) => ({ ...current, name: event.target.value }))}
                placeholder="Wireless Mouse"
                className="h-12 w-full text-black rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm outline-none focus:border-slate-400"
              />
            </label>

            <label className="space-y-2">
              <span className="text-sm font-medium text-black">Category</span>
              <select
                value={draft.categoryId}
                onChange={(event) => setDraft((current) => ({ ...current, categoryId: event.target.value }))}
                className="h-12 w-full text-black rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm outline-none focus:border-slate-400"
              >
                <option value="">Select category</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </label>

            <label className="space-y-2">
              <span className="text-sm font-medium text-black">Unit</span>
              <input
                value={draft.unit}
                onChange={(event) => setDraft((current) => ({ ...current, unit: event.target.value }))}
                placeholder="pcs"
                className="h-12 w-full text-black rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm outline-none focus:border-slate-400"
              />
            </label>

            <label className="space-y-2">
              <span className="text-sm font-medium text-black">Current stock</span>
              <input
                type="number"
                min="0"
                value={draft.currentStock}
                onChange={(event) => setDraft((current) => ({ ...current, currentStock: event.target.value }))}
                className="h-12 w-full rounded-2xl text-black  border border-slate-200 bg-slate-50 px-4 text-sm outline-none focus:border-slate-400"
              />
            </label>

            <label className="space-y-2">
              <span className="text-sm font-medium text-black">Low stock threshold</span>
              <input
                type="number"
                min="0"
                value={draft.lowStockThreshold}
                onChange={(event) => setDraft((current) => ({ ...current, lowStockThreshold: event.target.value }))}
                className="h-12 w-full text-black rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm outline-none focus:border-slate-400"
              />
            </label>

            <label className="space-y-2 md:col-span-2">
              <span className="text-sm font-medium text-black">Description</span>
              <textarea
                value={draft.description}
                onChange={(event) => setDraft((current) => ({ ...current, description: event.target.value }))}
                rows={3}
                placeholder="Optional item description"
                className="w-full rounded-2xl border text-black border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-slate-400"
              />
            </label>
          </div>

          <div className="mt-5 flex justify-end">
            <Button
              onClick={() => void handleCreate()}
              disabled={saving || !draft.name.trim() || !draft.categoryId}
            >
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
              Add item
            </Button>
          </div>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-lg font-semibold text-black">Categories</h2>
          <div className="mt-4 space-y-2">
            {categories.length === 0 ? (
                    <p className="text-sm text-black">No categories available.</p>
            ) : (
              categories.map((category) => (
                <div key={category.id} className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-black">
                  {category.name}
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      <div className="space-y-3">
        {loading ? (
          <div className="flex items-center gap-2 rounded-3xl border border-slate-200 bg-white p-6 text-sm text-black">
            <Loader2 className="h-4 w-4 animate-spin" /> Loading items
          </div>
        ) : items.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-10 text-center text-sm text-black">
            No items found.
          </div>
        ) : (
          items.map((item, index) => {
            const isEditing = editingId === item.id

            return (
              <div
                key={item.id}
                className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm"
              >
                <div className="mb-4 flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-100 text-sm font-semibold text-black">
                    {index + 1}
                  </div>
                  <div>
                    <p className="text-base font-semibold text-black">{item.name}</p>
                    <p className="text-xs text-black">{item.category_name || "No category"}</p>
                  </div>
                </div>

                {isEditing ? (
                  <div className="grid gap-4 md:grid-cols-2">
                    <label className="space-y-2 md:col-span-2">
                      <span className="text-sm font-medium text-black">Item name</span>
                      <input
                        value={editingDraft.name}
                        onChange={(event) => setEditingDraft((current) => ({ ...current, name: event.target.value }))}
                        className="h-12 w-full text-black rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm outline-none focus:border-slate-400"
                        autoFocus
                      />
                    </label>

                    <label className="space-y-2">
                      <span className="text-sm font-medium text-black">Category</span>
                      <select
                        value={editingDraft.categoryId}
                        onChange={(event) => setEditingDraft((current) => ({ ...current, categoryId: event.target.value }))}
                        className="h-12 w-full text-black rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm outline-none focus:border-slate-400"
                      >
                        {categories.map((category) => (
                          <option key={category.id} value={category.id}>
                            {category.name}
                          </option>
                        ))}
                      </select>
                    </label>

                    <label className="space-y-2">
                      <span className="text-sm font-medium text-black">Unit</span>
                      <input
                        value={editingDraft.unit}
                        onChange={(event) => setEditingDraft((current) => ({ ...current, unit: event.target.value }))}
                        className="h-12 w-full text-black rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm outline-none focus:border-slate-400"
                      />
                    </label>

                    <label className="space-y-2">
                      <span className="text-sm font-medium text-black">Current stock</span>
                      <input
                        type="number"
                        min="0"
                        value={editingDraft.currentStock}
                        onChange={(event) => setEditingDraft((current) => ({ ...current, currentStock: event.target.value }))}
                        className="h-12 w-full text-black rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm outline-none focus:border-slate-400"
                      />
                    </label>

                    <label className="space-y-2">
                      <span className="text-sm font-medium text-black">Low stock threshold</span>
                      <input
                        type="number"
                        min="0"
                        value={editingDraft.lowStockThreshold}
                        onChange={(event) => setEditingDraft((current) => ({ ...current, lowStockThreshold: event.target.value }))}
                        className="h-12 w-full  text-black rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm outline-none focus:border-slate-400"
                      />
                    </label>

                    <label className="space-y-2 md:col-span-2">
                      <span className="text-sm font-medium text-black">Description</span>
                      <textarea
                        value={editingDraft.description}
                        onChange={(event) => setEditingDraft((current) => ({ ...current, description: event.target.value }))}
                        rows={3}
                        className="w-full text-black rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-slate-400"
                      />
                    </label>
                  </div>
                ) : (
                  <div className="grid gap-3 rounded-2xl bg-slate-50 p-4 text-sm text-black md:grid-cols-2 xl:grid-cols-4">
                    <div>
                      <p className="text-xs uppercase tracking-[0.18em] text-black">Category</p>
                      <p className="mt-1 font-medium">{item.category_name || "No category"}</p>
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-[0.18em] text-black">Unit</p>
                      <p className="mt-1 font-medium">{item.unit}</p>
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-[0.18em] text-black">Current stock</p>
                      <p className="mt-1 font-medium">{item.current_stock}</p>
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-[0.18em] text-black">Low threshold</p>
                      <p className="mt-1 font-medium">{item.low_stock_threshold}</p>
                    </div>
                    {item.description ? (
                      <div className="md:col-span-2 xl:col-span-4">
                        <p className="text-xs uppercase tracking-[0.18em] text-black">Description</p>
                        <p className="mt-1 text-sm text-black">{item.description}</p>
                      </div>
                    ) : null}
                  </div>
                )}

                <div className="mt-4 flex flex-wrap items-center justify-end gap-2">
                  {isEditing ? (
                    <>
                      <Button onClick={() => void handleUpdate(item.id)} disabled={saving || !editingDraft.name.trim()}>
                        <Save className="h-4 w-4" />
                        Save
                      </Button>
                      <Button variant="outline" onClick={handleCancelEdit} disabled={saving}>
                        <X className="h-4 w-4" />
                        Cancel
                      </Button>
                    </>
                  ) : (
                    <>
                      <Button variant="outline" onClick={() => handleEdit(item)} disabled={saving}>
                        <Pencil className="h-4 w-4" />
                        Edit
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => setDeleteTarget(item)}
                        disabled={saving}
                        className="border-rose-200 text-rose-700 hover:bg-rose-50"
                      >
                        <Trash2 className="h-4 w-4" />
                        Delete
                      </Button>
                    </>
                  )}
                </div>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}