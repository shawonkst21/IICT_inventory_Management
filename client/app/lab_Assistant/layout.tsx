"use client"

import StafSidebar from "../../components/StafSidebar"
import { ProtectedRoute } from "@/components/ProtectedRoute"

export default function StafLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <ProtectedRoute requiredRoles={['admin', 'manager', 'user']}>
      <div className="h-screen overflow-hidden bg-[#F7F6F3]">
        <StafSidebar />
        <main
          className="fixed top-0 right-0 bottom-0 overflow-y-auto bg-[#F7F6F3] transition-[left] duration-300 ease-in-out will-change-[left]"
          style={{ left: "var(--staff-sidebar-width, 16rem)" }}
        >
          {children}
        </main>
      </div>
    </ProtectedRoute>
  )
}