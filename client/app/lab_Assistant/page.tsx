"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"

export default function LabAssistantPage() {
  const router = useRouter()

  useEffect(() => {
    router.push("/lab_Assistant/item-requests")
  }, [router])

  return null
}
