const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5000"

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
  quantity_requested: number
  department: string
  purpose: string
  recipient_room: string
}

export async function submitItemRequest(
  payload: SubmitItemRequestPayload,
): Promise<SubmitItemRequestResponse> {
  const response = await fetch(`${API_BASE_URL}/api/item-requests`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  })

  const responseData = (await response.json()) as ApiResponse<SubmitItemRequestResponse>

  if (!response.ok || !responseData.ok) {
    throw new Error(responseData.message || "Failed to submit item request")
  }

  return responseData.data!
}
