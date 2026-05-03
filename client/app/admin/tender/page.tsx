"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
import {
  FileImage,
  FileText,
  Loader2,
  Pencil,
  Plus,
  Save,
  Trash2,
  Upload,
  X,
} from "lucide-react"
import { toast } from "sonner"

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
  createAdminTenderNotice,
  deleteAdminTenderNotice,
  fetchAdminTenderNotices,
  getFileUrl,
  updateAdminTenderNotice,
  type TenderNotice,
  type TenderNoticePayload,
  type TenderNoticeStatus,
} from "@/lib/api"

type TenderDraft = {
  title: string
  summary: string
  deadline: string
  status: TenderNoticeStatus
}

type UploadedFileState = {
  fileName: string
  mimeType: string
  fileData: string
}

const emptyDraft: TenderDraft = {
  title: "",
  summary: "",
  deadline: "",
  status: "draft",
}

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Something went wrong"
}

function formatStatus(status: string) {
  return status.charAt(0).toUpperCase() + status.slice(1)
}

function formatDeadline(value: string) {
  return new Intl.DateTimeFormat("en-BD", { dateStyle: "medium" }).format(new Date(value))
}

function statusTone(status: TenderNoticeStatus) {
  switch (status) {
    case "published":
      return "bg-emerald-50 text-emerald-700"
    case "draft":
      return "bg-amber-50 text-amber-700"
    case "expired":
      return "bg-rose-50 text-rose-700"
    default:
      return "bg-slate-100 text-slate-700"
  }
}

function isImageFile(fileType: string) {
  return fileType.startsWith("image/")
}

async function readFileAsDataUrl(file: File): Promise<UploadedFileState> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()

    reader.onload = () => {
      resolve({
        fileName: file.name,
        mimeType: file.type,
        fileData: String(reader.result || ""),
      })
    }

    reader.onerror = () => reject(new Error("Failed to read selected file"))
    reader.readAsDataURL(file)
  })
}

export default function AdminTenderPage() {
  const [tenders, setTenders] = useState<TenderNotice[]>([])
  const [draft, setDraft] = useState<TenderDraft>(emptyDraft)
  const [draftFile, setDraftFile] = useState<UploadedFileState | null>(null)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [editingDraft, setEditingDraft] = useState<TenderDraft>(emptyDraft)
  const [editingFile, setEditingFile] = useState<UploadedFileState | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [pageError, setPageError] = useState("")
  const [deleteTarget, setDeleteTarget] = useState<TenderNotice | null>(null)

  const loadTenders = async () => {
    setLoading(true)
    setPageError("")

    try {
      const data = await fetchAdminTenderNotices()
      setTenders(data)
    } catch (error) {
      setPageError(getErrorMessage(error))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadTenders()
  }, [])

  const resetCreateForm = () => {
    setDraft(emptyDraft)
    setDraftFile(null)
  }

  const handleDraftFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    try {
      const uploaded = await readFileAsDataUrl(file)
      setDraftFile(uploaded)
    } catch (error) {
      toast.error(getErrorMessage(error))
    }
  }

  const handleEditingFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    try {
      const uploaded = await readFileAsDataUrl(file)
      setEditingFile(uploaded)
    } catch (error) {
      toast.error(getErrorMessage(error))
    }
  }

  const handleCreate = async () => {
    if (!draft.title.trim() || !draft.deadline || !draftFile) {
      setPageError("Title, deadline, and a PDF/image file are required")
      return
    }

    setSaving(true)
    setPageError("")

    try {
      const payload: TenderNoticePayload = {
        title: draft.title.trim(),
        summary: draft.summary.trim(),
        deadline: draft.deadline,
        status: draft.status,
        ...draftFile,
      }

      await createAdminTenderNotice(payload)
      resetCreateForm()
      await loadTenders()
      toast.success("Tender notice created")
    } catch (error) {
      setPageError(getErrorMessage(error))
    } finally {
      setSaving(false)
    }
  }

  const handleEdit = (tender: TenderNotice) => {
    setEditingId(tender.id)
    setEditingFile(null)
    setEditingDraft({
      title: tender.title,
      summary: tender.summary || "",
      deadline: tender.deadline.slice(0, 10),
      status: tender.status,
    })
  }

  const handleCancelEdit = () => {
    setEditingId(null)
    setEditingDraft(emptyDraft)
    setEditingFile(null)
  }

  const handleUpdate = async (tender: TenderNotice) => {
    if (!editingDraft.title.trim() || !editingDraft.deadline) {
      setPageError("Title and deadline are required")
      return
    }

    setSaving(true)
    setPageError("")

    try {
      const payload: TenderNoticePayload = {
        title: editingDraft.title.trim(),
        summary: editingDraft.summary.trim(),
        deadline: editingDraft.deadline,
        status: editingDraft.status,
        ...(editingFile || {}),
      }

      await updateAdminTenderNotice(tender.id, payload)
      handleCancelEdit()
      await loadTenders()
      toast.success("Tender notice updated")
    } catch (error) {
      setPageError(getErrorMessage(error))
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (tenderId: number) => {
    setSaving(true)
    setPageError("")

    try {
      await deleteAdminTenderNotice(tenderId)
      await loadTenders()
      toast.success("Tender notice deleted")
    } catch (error) {
      setPageError(getErrorMessage(error))
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <AlertDialog
        open={Boolean(deleteTarget)}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null)
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete tender notice?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete {deleteTarget?.title || "this tender notice"} and its stored file.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={async () => {
                if (!deleteTarget) return
                const tenderId = deleteTarget.id
                setDeleteTarget(null)
                await handleDelete(tenderId)
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
          <h1 className="mt-2 text-3xl font-semibold text-black">Tender notices</h1>
          <p className="mt-2 max-w-2xl text-sm text-black/70">
            Upload a PDF or image notice here. Published notices will appear on the landing page.
          </p>
        </div>
      </div>

      {pageError ? (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {pageError}
        </div>
      ) : null}

      <section className="rounded-[28px] border border-slate-200 bg-white p-6">
        <div className="flex items-center gap-3">
          <div className="rounded-2xl bg-slate-950 p-3 text-white">
            <Plus className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-slate-950">Create tender notice</h2>
            <p className="text-sm text-slate-600">Upload one PDF or image and control whether it is public.</p>
          </div>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-2">
          <label className="space-y-2">
            <span className="text-sm font-medium text-slate-900">Title</span>
            <input
              value={draft.title}
              onChange={(event) => setDraft((current) => ({ ...current, title: event.target.value }))}
              className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-black outline-none transition focus:border-slate-400"
              placeholder="Tender notice title"
            />
          </label>

          <label className="space-y-2">
            <span className="text-sm font-medium text-slate-900">Deadline</span>
            <input
              type="date"
              value={draft.deadline}
              onChange={(event) => setDraft((current) => ({ ...current, deadline: event.target.value }))}
              className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-black outline-none transition focus:border-slate-400"
            />
          </label>

          <label className="space-y-2 md:col-span-2">
            <span className="text-sm font-medium text-slate-900">Summary</span>
            <textarea
              value={draft.summary}
              onChange={(event) => setDraft((current) => ({ ...current, summary: event.target.value }))}
              className="min-h-28 w-full rounded-2xl border border-slate-200 px-4 py-3 text-black outline-none transition focus:border-slate-400"
              placeholder="Short note shown on the landing page"
            />
          </label>

          <label className="space-y-2">
            <span className="text-sm font-medium text-slate-900">Status</span>
            <select
              value={draft.status}
              onChange={(event) =>
                setDraft((current) => ({ ...current, status: event.target.value as TenderNoticeStatus }))
              }
              className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-black outline-none transition focus:border-slate-400"
            >
              <option value="draft">Draft</option>
              <option value="published">Published</option>
              <option value="expired">Expired</option>
              <option value="archived">Archived</option>
            </select>
          </label>

          <label className="space-y-2">
            <span className="text-sm font-medium text-slate-900">Notice file</span>
            <div className="relative">
              <div className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-slate-500">
                <Upload className="h-5 w-5" />
              </div>
              <input
                type="file"
                accept=".pdf,image/png,image/jpeg,image/webp"
                onChange={handleDraftFileChange}
                className="block w-full rounded-2xl border border-slate-200 px-10 py-3 text-sm text-black"
              />
            </div>
            <p className="text-xs text-slate-500">
              {draftFile ? `Selected: ${draftFile.fileName}` : "Accepted: PDF, JPG, PNG, WEBP"}
            </p>
          </label>
        </div>

        <div className="mt-6 flex flex-wrap gap-3">
          <Button onClick={handleCreate} disabled={saving}>
            {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}
            Create notice
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={resetCreateForm}
            disabled={saving}
          >
            Reset
          </Button>
        </div>
      </section>

      <section className="rounded-[28px] border border-slate-200 bg-white p-6">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-semibold text-slate-950">Existing notices</h2>
            <p className="text-sm text-slate-600">Manage what is visible on the landing page from here.</p>
          </div>
          <Button type="button" variant="outline" onClick={() => void loadTenders()} disabled={loading}>
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Refresh"}
          </Button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12 text-slate-600">
            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
            Loading tender notices...
          </div>
        ) : tenders.length === 0 ? (
          <div className="mt-6 rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-10 text-center text-sm text-slate-500">
            No tender notices have been created yet.
          </div>
        ) : (
          <div className="mt-6 space-y-4">
            {tenders.map((tender) => {
              const isEditing = editingId === tender.id

              return (
                <div key={tender.id} className="rounded-3xl border border-slate-200 bg-slate-50/70 p-5">
                  {isEditing ? (
                    <div className="space-y-4">
                      <div className="grid gap-4 md:grid-cols-2">
                        <label className="space-y-2">
                          <span className="text-sm font-medium text-slate-900">Title</span>
                          <input
                            value={editingDraft.title}
                            onChange={(event) =>
                              setEditingDraft((current) => ({ ...current, title: event.target.value }))
                            }
                            className="w-full text-black rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none transition focus:border-slate-400"
                          />
                        </label>

                        <label className="space-y-2">
                          <span className="text-sm font-medium text-slate-900">Deadline</span>
                          <input
                            type="date"
                            value={editingDraft.deadline}
                            onChange={(event) =>
                              setEditingDraft((current) => ({ ...current, deadline: event.target.value }))
                            }
                            className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-black outline-none transition focus:border-slate-400"
                          />
                        </label>

                        <label className="space-y-2 md:col-span-2">
                          <span className="text-sm font-medium text-slate-900">Summary</span>
                          <textarea
                            value={editingDraft.summary}
                            onChange={(event) =>
                              setEditingDraft((current) => ({ ...current, summary: event.target.value }))
                            }
                            className="min-h-28 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-black outline-none transition focus:border-slate-400"
                          />
                        </label>

                        <label className="space-y-2">
                          <span className="text-sm font-medium text-slate-900">Status</span>
                          <select
                            value={editingDraft.status}
                            onChange={(event) =>
                              setEditingDraft((current) => ({
                                ...current,
                                status: event.target.value as TenderNoticeStatus,
                              }))
                            }
                            className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-black outline-none transition focus:border-slate-400"
                          >
                            <option value="draft">Draft</option>
                            <option value="published">Published</option>
                            <option value="expired">Expired</option>
                            <option value="archived">Archived</option>
                          </select>
                        </label>

                        <label className="space-y-2">
                          <span className="text-sm font-medium text-slate-900">Replace file</span>
                          <div className="relative">
                            <div className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-slate-500">
                              <Upload className="h-5 w-5" />
                            </div>
                            <input
                              type="file"
                              accept=".pdf,image/png,image/jpeg,image/webp"
                              onChange={handleEditingFileChange}
                              className="block w-full rounded-2xl border border-slate-200 bg-white px-10 py-3 text-sm text-black"
                            />
                          </div>
                          <p className="text-xs text-slate-500">
                            {editingFile ? `Selected: ${editingFile.fileName}` : "Leave empty to keep current file"}
                          </p>
                        </label>
                      </div>

                      <div className="flex flex-wrap gap-3">
                        <Button onClick={() => void handleUpdate(tender)} disabled={saving}>
                          <Save className="mr-2 h-4 w-4" />
                          Save changes
                        </Button>
                        <Button type="button" variant="outline" onClick={handleCancelEdit} disabled={saving}>
                          <X className="mr-2 h-4 w-4" />
                          Cancel
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                      <div className="min-w-0 flex-1 space-y-3">
                        <div className="flex flex-wrap items-center gap-3">
                          <h3 className="text-xl font-semibold text-slate-950">{tender.title}</h3>
                          <span className={`rounded-full px-3 py-1 text-xs font-medium ${statusTone(tender.status)}`}>
                            {formatStatus(tender.status)}
                          </span>
                        </div>

                        <p className="text-sm leading-6 text-slate-600">
                          {tender.summary || "No summary added for this notice yet."}
                        </p>

                        <div className="flex flex-wrap items-center gap-4 text-sm text-slate-500">
                          <span>Deadline: {formatDeadline(tender.deadline)}</span>
                          <span>Type: {tender.file_type}</span>
                          <span>By: {tender.creator_name || "Admin"}</span>
                        </div>

                        <div className="flex flex-wrap items-center gap-3">
                          <Link
                            href={getFileUrl(tender.file_path)}
                            target="_blank"
                            className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:border-slate-300 hover:text-slate-950"
                          >
                            {isImageFile(tender.file_type) ? (
                              <FileImage className="h-4 w-4" />
                            ) : (
                              <FileText className="h-4 w-4" />
                            )}
                            View file
                          </Link>
                        </div>
                      </div>

                      <div className="flex shrink-0 gap-2">
                        <Button type="button" variant="outline" onClick={() => handleEdit(tender)} disabled={saving}>
                          <Pencil className="mr-2 h-4 w-4" />
                          Edit
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => setDeleteTarget(tender)}
                          disabled={saving}
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </section>
    </div>
  )
}
