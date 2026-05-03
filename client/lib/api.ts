const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5000"

function getAuthToken() {
  if (typeof window === 'undefined') {
    return ''
  }

  return localStorage.getItem('token') || ''
}

function getAuthHeaders(extraHeaders: HeadersInit = {}): HeadersInit {
  const token = getAuthToken()

  return token
    ? {
        Authorization: `Bearer ${token}`,
        ...extraHeaders,
      }
    : extraHeaders
}

export type ItemOption = {
  id: number
  name: string
}

type ApiResponse<T> = {
  ok: boolean
  data?: T
  message?: string
  error?: string
}

export async function fetchItemOptions(): Promise<ItemOption[]> {
  const response = await fetch(`${API_BASE_URL}/api/items/options`, {
    cache: "no-store",
    headers: getAuthHeaders(),
  })

  if (!response.ok) {
    throw new Error("Unable to fetch item list")
  }

  const payload = (await response.json()) as ApiResponse<ItemOption[]>

  if (!payload.ok || !Array.isArray(payload.data)) {
    throw new Error(payload.message || "Unexpected response from items endpoint")
  }

  return payload.data
}

export type SubmitItemRequestPayload = {
  itemId: number
  quantityRequested: number
  department: string
  purpose: string
  recipientRoom: string
}

export type SubmitItemRequestResponse = {
  id: number
  item_id: number
  requested_by: number
  quantity_requested: number
  department: string
  purpose: string
  recipient_room: string
  status: string
  requested_at: string
}

export type ItemRequestRecord = {
  id: number
  item_id: number
  item_name: string
  stock_quantity: number
  requested_by: number
  requester_name: string | null
  approved_by: number | null
  approved_by_name: string | null
  quantity_requested: number
  department: string | null
  purpose: string | null
  recipient_room: string | null
  status: string
  rejection_reason: string | null
  requested_at: string
  reviewed_at: string | null
}

export type ReviewItemRequestPayload = {
  status: "approved" | "rejected"
  rejectionReason?: string
}

export type IssueItemRequestResponse = {
  request: ItemRequestRecord
  issuance: {
    id: number
    request_id: number
    item_id: number
    issued_by: number
    quantity_issued: number
    recipient_name: string
    recipient_room: string | null
    recipient_dept: string | null
    issued_date: string
  }
  updatedRequest: {
    id: number
  }
}

export async function submitItemRequest(
  payload: SubmitItemRequestPayload,
): Promise<SubmitItemRequestResponse> {
  const response = await fetch(`${API_BASE_URL}/api/item-requests`, {
    method: "POST",
    headers: getAuthHeaders({
      "Content-Type": "application/json",
    }),
    body: JSON.stringify(payload),
  })

  const responseData = (await response.json()) as ApiResponse<SubmitItemRequestResponse>

  if (!response.ok || !responseData.ok) {
    throw new Error(responseData.message || "Failed to submit item request")
  }

  return responseData.data!
}

export async function fetchItemRequests(): Promise<ItemRequestRecord[]> {
  const response = await fetch(`${API_BASE_URL}/api/item-requests`, {
    cache: "no-store",
    headers: getAuthHeaders(),
  })

  if (!response.ok) {
    throw new Error("Unable to fetch item requests")
  }

  const payload = (await response.json()) as ApiResponse<ItemRequestRecord[]>

  if (!payload.ok || !Array.isArray(payload.data)) {
    throw new Error(payload.message || "Unexpected response from item requests endpoint")
  }

  return payload.data
}

export async function reviewItemRequest(
  requestId: number,
  payload: ReviewItemRequestPayload,
): Promise<ItemRequestRecord> {
  const response = await fetch(`${API_BASE_URL}/api/item-requests/${requestId}/review`, {
    method: "PATCH",
    headers: getAuthHeaders({
      "Content-Type": "application/json",
    }),
    body: JSON.stringify(payload),
  })

  const responseData = (await response.json()) as ApiResponse<ItemRequestRecord>

  if (!response.ok || !responseData.ok) {
    const errMsg = (responseData && (responseData.error || responseData.message)) || "Failed to review item request"
    throw new Error(errMsg)
  }

  return responseData.data!
}

export async function issueItemRequest(requestId: number): Promise<IssueItemRequestResponse> {
  const response = await fetch(`${API_BASE_URL}/api/item-requests/${requestId}/issue`, {
    method: "POST",
    headers: getAuthHeaders(),
  })

  const responseData = (await response.json()) as ApiResponse<IssueItemRequestResponse>

  if (!response.ok || !responseData.ok) {
    const errMsg = (responseData && (responseData.error || responseData.message)) || "Failed to issue item request"
    throw new Error(errMsg)
  }

  return responseData.data!
}

export type Category = {
  id: number
  name: string
  description?: string | null
}

export type AdminUser = {
  id: number
  name: string
  email: string
  role: string | null
  expected_role: string
  status: string
  created_at: string
}

export type StockLevelItem = {
  id: number
  item_name: string
  category_id: number
  category_name: string
  unit: string
  quantity: number
  low_stock_threshold: number
  stock_status: 'available' | 'low' | 'not_available'
}

export async function fetchCategories(): Promise<Category[]> {
  const response = await fetch(`${API_BASE_URL}/api/items/categories`, {
    cache: "no-store",
    headers: getAuthHeaders(),
  })

  if (!response.ok) {
    throw new Error("Unable to fetch categories")
  }

  const payload = (await response.json()) as ApiResponse<Category[]>

  if (!payload.ok || !Array.isArray(payload.data)) {
    throw new Error(payload.message || "Unexpected response from categories endpoint")
  }

  return payload.data
}

export async function fetchAdminUsers(): Promise<AdminUser[]> {
  const response = await fetch(`${API_BASE_URL}/api/auth/admin/users`, {
    cache: "no-store",
    headers: getAuthHeaders(),
  })

  if (!response.ok) {
    throw new Error("Unable to fetch admin users")
  }

  const payload = (await response.json()) as AdminUser[]

  if (!Array.isArray(payload)) {
    throw new Error("Unexpected response from admin users endpoint")
  }

  return payload
}

export async function fetchPendingUsers(): Promise<AdminUser[]> {
  const response = await fetch(`${API_BASE_URL}/api/auth/admin/pending`, {
    cache: "no-store",
    headers: getAuthHeaders(),
  })

  if (!response.ok) {
    throw new Error("Unable to fetch pending users")
  }

  const payload = (await response.json()) as AdminUser[]

  if (!Array.isArray(payload)) {
    throw new Error("Unexpected response from pending users endpoint")
  }

  return payload
}

export type AdminCategory = Category

export async function fetchAdminCategories(search = ""): Promise<AdminCategory[]> {
  const params = new URLSearchParams()

  if (search) params.set("search", search)

  const response = await fetch(`${API_BASE_URL}/api/items/admin/categories?${params.toString()}`, {
    cache: "no-store",
    headers: getAuthHeaders(),
  })

  if (!response.ok) {
    throw new Error("Unable to fetch admin categories")
  }

  const payload = (await response.json()) as ApiResponse<AdminCategory[]>

  if (!payload.ok || !Array.isArray(payload.data)) {
    throw new Error(payload.message || "Unexpected response from admin categories endpoint")
  }

  return payload.data
}

export async function createAdminCategory(name: string, description?: string): Promise<AdminCategory> {
  const response = await fetch(`${API_BASE_URL}/api/items/admin/categories`, {
    method: "POST",
    headers: getAuthHeaders({
      "Content-Type": "application/json",
    }),
    body: JSON.stringify({ name, description }),
  })

  const responseData = (await response.json()) as ApiResponse<AdminCategory>

  if (!response.ok || !responseData.ok) {
    throw new Error(responseData.message || "Failed to create category")
  }

  return responseData.data!
}

export async function updateAdminCategory(categoryId: number, name: string, description?: string): Promise<AdminCategory> {
  const response = await fetch(`${API_BASE_URL}/api/items/admin/categories/${categoryId}`, {
    method: "PATCH",
    headers: getAuthHeaders({
      "Content-Type": "application/json",
    }),
    body: JSON.stringify({ name, description }),
  })

  const responseData = (await response.json()) as ApiResponse<AdminCategory>

  if (!response.ok || !responseData.ok) {
    throw new Error(responseData.message || "Failed to update category")
  }

  return responseData.data!
}

export async function deleteAdminCategory(categoryId: number): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/api/items/admin/categories/${categoryId}`, {
    method: "DELETE",
    headers: getAuthHeaders(),
  })

  const responseData = (await response.json()) as ApiResponse<null>

  if (!response.ok || !responseData.ok) {
    throw new Error(responseData.message || "Failed to delete category")
  }
}

export type AuditLogEntry = {
  id: number
  user_id: number | null
  user_name: string | null
  user_email: string | null
  action: string
  table_name: string | null
  record_id: number | null
  details: string | null
  created_at: string
}

export type AuditLogQuery = {
  search?: string
  action?: string
  tableName?: string
  fromDate?: string
  toDate?: string
}

export async function fetchAdminLogs(query: AuditLogQuery = {}): Promise<AuditLogEntry[]> {
  const params = new URLSearchParams()

  if (query.search) params.set('search', query.search)
  if (query.action) params.set('action', query.action)
  if (query.tableName) params.set('tableName', query.tableName)
  if (query.fromDate) params.set('fromDate', query.fromDate)
  if (query.toDate) params.set('toDate', query.toDate)

  const response = await fetch(`${API_BASE_URL}/api/admin/logs?${params.toString()}`, {
    cache: 'no-store',
    headers: getAuthHeaders(),
  })

  if (!response.ok) {
    throw new Error('Unable to fetch audit logs')
  }

  const payload = (await response.json()) as ApiResponse<AuditLogEntry[]>

  if (!payload.ok || !Array.isArray(payload.data)) {
    throw new Error(payload.message || 'Unexpected response from audit logs endpoint')
  }

  return payload.data
}

export type AdminItem = {
  id: number
  category_id: number
  category_name: string | null
  name: string
  description: string | null
  unit: string
  current_stock: number
  low_stock_threshold: number
}

export async function fetchAdminItems(search = ""): Promise<AdminItem[]> {
  const params = new URLSearchParams()

  if (search) params.set("search", search)

  const response = await fetch(`${API_BASE_URL}/api/items/admin/items?${params.toString()}`, {
    cache: "no-store",
    headers: getAuthHeaders(),
  })

  if (!response.ok) {
    throw new Error("Unable to fetch admin items")
  }

  const payload = (await response.json()) as ApiResponse<AdminItem[]>

  if (!payload.ok || !Array.isArray(payload.data)) {
    throw new Error(payload.message || "Unexpected response from admin items endpoint")
  }

  return payload.data
}

export async function createAdminItem(payload: CreateItemPayload & { description?: string }): Promise<CreatedItem> {
  const response = await fetch(`${API_BASE_URL}/api/items/admin/items`, {
    method: "POST",
    headers: getAuthHeaders({
      "Content-Type": "application/json",
    }),
    body: JSON.stringify(payload),
  })

  const responseData = (await response.json()) as ApiResponse<CreatedItem>

  if (!response.ok || !responseData.ok) {
    throw new Error(responseData.message || "Failed to create item")
  }

  return responseData.data!
}

export async function updateAdminItem(itemId: number, payload: CreateItemPayload & { description?: string }): Promise<CreatedItem> {
  const response = await fetch(`${API_BASE_URL}/api/items/admin/items/${itemId}`, {
    method: "PATCH",
    headers: getAuthHeaders({
      "Content-Type": "application/json",
    }),
    body: JSON.stringify(payload),
  })

  const responseData = (await response.json()) as ApiResponse<CreatedItem>

  if (!response.ok || !responseData.ok) {
    throw new Error(responseData.message || "Failed to update item")
  }

  return responseData.data!
}

export async function deleteAdminItem(itemId: number): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/api/items/admin/items/${itemId}`, {
    method: "DELETE",
    headers: getAuthHeaders(),
  })

  const responseData = (await response.json()) as ApiResponse<null>

  if (!response.ok || !responseData.ok) {
    throw new Error(responseData.message || "Failed to delete item")
  }
}

export async function fetchStockLevels(
  itemName?: string,
  categoryId?: number,
  status?: string,
): Promise<StockLevelItem[]> {
  const params = new URLSearchParams()

  if (itemName) params.append('itemName', itemName)
  if (categoryId) params.append('categoryId', categoryId.toString())
  if (status) params.append('status', status)

  const response = await fetch(`${API_BASE_URL}/api/items/stock-levels?${params.toString()}`, {
    cache: "no-store",
    headers: getAuthHeaders(),
  })

  if (!response.ok) {
    throw new Error("Unable to fetch stock levels")
  }

  const payload = (await response.json()) as ApiResponse<StockLevelItem[]>

  if (!payload.ok || !Array.isArray(payload.data)) {
    throw new Error(payload.message || "Unexpected response from stock levels endpoint")
  }

  return payload.data
}

export async function fetchItemsByCategory(categoryId: number): Promise<ItemOption[]> {
  const params = new URLSearchParams({ categoryId: String(categoryId) })

  const response = await fetch(`${API_BASE_URL}/api/items/options/by-category?${params.toString()}`, {
    cache: "no-store",
    headers: getAuthHeaders(),
  })

  if (!response.ok) {
    throw new Error("Unable to fetch items by category")
  }

  const payload = (await response.json()) as ApiResponse<ItemOption[]>

  if (!payload.ok || !Array.isArray(payload.data)) {
    throw new Error(payload.message || "Unexpected response from item options by category endpoint")
  }

  return payload.data
}

export type CreateItemPayload = {
  categoryId: number
  name: string
  description?: string
  unit: string
  currentStock: number
  lowStockThreshold: number
}

export type CreatedItem = {
  id: number
  category_id: number
  name: string
  description: string | null
  unit: string
  current_stock: number
  low_stock_threshold: number
}

export async function createItem(payload: CreateItemPayload): Promise<CreatedItem> {
  const response = await fetch(`${API_BASE_URL}/api/items`, {
    method: "POST",
    headers: getAuthHeaders({
      "Content-Type": "application/json",
    }),
    body: JSON.stringify(payload),
  })

  const responseData = (await response.json()) as ApiResponse<CreatedItem>

  if (!response.ok || !responseData.ok) {
    throw new Error(responseData.message || "Failed to create item")
  }

  return responseData.data!
}

export type CreateItemReceiptPayload = {
  itemId: number
  quantityReceived: number
  supplierName: string
  challanNo: string
  qualityStatus: "good" | "partial" | "damaged" | "rejected"
  billStatus: "paid" | "pending" | "unpaid"
  receiptDate: string
}

export type ItemReceiptRecord = {
  id: number
  item_id: number
  item_name: string
  category_id: number | null
  category_name: string | null
  received_by: number
  received_by_name: string | null
  quantity_received: number
  supplier_name: string
  challan_no: string
  quality_status: "good" | "partial" | "damaged" | "rejected"
  bill_status: "paid" | "pending" | "unpaid"
  receipt_date: string
}

export type CreateItemReceiptResponse = {
  receipt: {
    id: number
    item_id: number
    received_by: number
    quantity_received: number
    supplier_name: string
    challan_no: string
    quality_status: "good" | "partial" | "damaged" | "rejected"
    bill_status: "paid" | "pending" | "unpaid"
    receipt_date: string
  }
  stock: {
    id: number
    current_stock: number
  }
}

export async function createItemReceipt(
  payload: CreateItemReceiptPayload,
): Promise<CreateItemReceiptResponse> {
  const response = await fetch(`${API_BASE_URL}/api/item-receipts`, {
    method: "POST",
    headers: getAuthHeaders({
      "Content-Type": "application/json",
    }),
    body: JSON.stringify(payload),
  })

  const responseData = (await response.json()) as ApiResponse<CreateItemReceiptResponse>

  if (!response.ok || !responseData.ok) {
    throw new Error(responseData.message || "Failed to create item receipt")
  }

  return responseData.data!
}

export async function fetchItemReceipts(): Promise<ItemReceiptRecord[]> {
  const response = await fetch(`${API_BASE_URL}/api/item-receipts`, {
    cache: "no-store",
    headers: getAuthHeaders(),
  })

  if (!response.ok) {
    throw new Error("Unable to fetch item receipts")
  }

  const payload = (await response.json()) as ApiResponse<ItemReceiptRecord[]>

  if (!payload.ok || !Array.isArray(payload.data)) {
    throw new Error(payload.message || "Unexpected response from item receipts endpoint")
  }

  return payload.data
}
