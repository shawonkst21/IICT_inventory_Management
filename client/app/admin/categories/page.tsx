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
  createAdminCategory,
  deleteAdminCategory,
  fetchAdminCategories,
  updateAdminCategory,
  type AdminCategory,
} from "@/lib/api"

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Something went wrong"
}

function isDuplicateError(error: unknown) {
  const message = getErrorMessage(error).toLowerCase()
  return message.includes("already exists")
}

export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState<AdminCategory[]>([])
  const [search, setSearch] = useState("")
  const [draftName, setDraftName] = useState("")
  const [draftDescription, setDraftDescription] = useState("")
  const [editingId, setEditingId] = useState<number | null>(null)
  const [editingName, setEditingName] = useState("")
  const [editingDescription, setEditingDescription] = useState("")
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [pageError, setPageError] = useState("")
  const [alertOpen, setAlertOpen] = useState(false)
  const [alertMessage, setAlertMessage] = useState("")
  const [deleteTarget, setDeleteTarget] = useState<AdminCategory | null>(null)

  const loadCategories = async (query = search) => {
    setLoading(true)
    setPageError("")

    try {
      const data = await fetchAdminCategories(query)
      setCategories(data)
    } catch (error) {
      setPageError(getErrorMessage(error))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadCategories(search)
  }, [search])

  const openDuplicateAlert = (message: string) => {
    setAlertMessage(message)
    setAlertOpen(true)
  }

  const resetCreateForm = () => {
    setDraftName("")
    setDraftDescription("")
  }

  const handleCreate = async () => {
    const name = draftName.trim()
    if (!name) return

    setSaving(true)
    setPageError("")

    try {
      await createAdminCategory(name, draftDescription.trim())
      setDraftName("")
      setDraftDescription("")
      await loadCategories()
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

  const handleEdit = (category: AdminCategory) => {
    setEditingId(category.id)
    setEditingName(category.name)
    setEditingDescription(category.description || "")
  }

  const handleCancelEdit = () => {
    setEditingId(null)
    setEditingName("")
    setEditingDescription("")
  }

  const handleUpdate = async (categoryId: number) => {
    const name = editingName.trim()
    if (!name) return

    setSaving(true)
    setPageError("")

    try {
      await updateAdminCategory(categoryId, name, editingDescription.trim())
      handleCancelEdit()
      await loadCategories()
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

  const handleDelete = async (categoryId: number) => {
    setSaving(true)
    setPageError("")

    try {
      await deleteAdminCategory(categoryId)
      if (editingId === categoryId) {
        handleCancelEdit()
      }
      await loadCategories()
    } catch (error) {
      setPageError(getErrorMessage(error))
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <AlertDialog open={alertOpen} onOpenChange={setAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Duplicate category</AlertDialogTitle>
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
            <AlertDialogTitle>Delete category?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete {deleteTarget?.name || "this category"}. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={async () => {
                if (!deleteTarget) return
                const categoryId = deleteTarget.id
                setDeleteTarget(null)
                await handleDelete(categoryId)
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
            <h1 className="mt-2 text-3xl font-semibold text-black">Categories</h1>
            <p className="mt-2 max-w-2xl text-sm text-black">
              Add, rename, search, and remove inventory categories from a clean task-list view.
          </p>
        </div>

        <label className="flex w-full max-w-sm items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
          <Search className="h-4 w-4 text-slate-400" />
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search categories"
            className="w-full text-black bg-transparent text-sm outline-none placeholder:text-slate-400"
          />
        </label>
      </div>

      {pageError ? (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {pageError}
        </div>
      ) : null}

      <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-3 md:flex-row md:items-center">
          <input
            value={draftName}
            onChange={(event) => setDraftName(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault()
                void handleCreate()
              }
            }}
            placeholder="Type a new category name"
            className="h-12 flex-1 text-black rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm outline-none transition focus:border-slate-400"
          />
        </div>

        <div className="mt-3">
          <textarea
            value={draftDescription}
            onChange={(event) => setDraftDescription(event.target.value)}
            placeholder="Category description"
            rows={3}
            className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-black outline-none transition focus:border-slate-400"
          />
        </div>

        <div className="mt-3 flex gap-2">
          <Button onClick={() => void handleCreate()} disabled={saving || !draftName.trim()}>
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
            Add category
          </Button>
          <Button variant="outline" onClick={resetCreateForm} disabled={!draftName.trim() && !draftDescription.trim() || saving}>
            Clear
          </Button>
        </div>
      </div>

      <div className="space-y-3">
        {loading ? (
          <div className="flex items-center gap-2 rounded-3xl border border-slate-200 bg-white p-6 text-sm text-black">
            <Loader2 className="h-4 w-4 animate-spin" /> Loading categories
          </div>
        ) : categories.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-10 text-center text-sm text-black">
            No categories found.
          </div>
        ) : (
          categories.map((category, index) => {
            const isEditing = editingId === category.id

            return (
              <div
                key={category.id}
                className="flex flex-col gap-4 rounded-3xl border border-slate-200 bg-white p-4 shadow-sm md:flex-row md:items-center"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-100 text-sm font-semibold text-black">
                  {index + 1}
                </div>

                <div className="flex-1 space-y-2">
                  {isEditing ? (
                    <div className="space-y-3">
                      <input
                        value={editingName}
                        onChange={(event) => setEditingName(event.target.value)}
                        className="h-11 w-full text-black rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm outline-none focus:border-slate-400"
                        autoFocus
                      />
                      <textarea
                        value={editingDescription}
                        onChange={(event) => setEditingDescription(event.target.value)}
                        rows={3}
                        className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-black outline-none focus:border-slate-400"
                      />
                    </div>
                  ) : (
                    <div>
                        <p className="text-base font-semibold text-black">{category.name}</p>
                        <p className="text-xs text-black">
                          {category.description || "Tap edit to add a category description."}
                        </p>
                    </div>
                  )}
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  {isEditing ? (
                    <>
                      <Button onClick={() => void handleUpdate(category.id)} disabled={saving || !editingName.trim()}>
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
                      <Button variant="outline" onClick={() => handleEdit(category)} disabled={saving}>
                        <Pencil className="h-4 w-4" />
                        Edit
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => setDeleteTarget(category)}
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