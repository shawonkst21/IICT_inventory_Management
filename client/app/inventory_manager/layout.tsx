"use client"

import Sidebar from "../../components/InventorySidebar"
import { SidebarProvider, useSidebar } from "@/context/SidebarContext"
import { ProtectedRoute } from "@/components/ProtectedRoute"

function InventoryLayout({ children }: { children: React.ReactNode }) {
  const { collapsed } = useSidebar()
  const sidebarWidth = collapsed ? "4rem" : "16rem"

  return (
    <div className="flex bg-white h-screen overflow-hidden">
      <Sidebar />
      <main
        className="min-h-0 bg-white overflow-y-auto"
        style={{
          marginLeft: sidebarWidth,
          width: `calc(100% - ${sidebarWidth})`,
          transition:
            "margin-left 420ms cubic-bezier(0.22, 1, 0.36, 1), width 420ms cubic-bezier(0.22, 1, 0.36, 1)",
          willChange: "margin-left, width",
        }}
      >
        <div className="p-8 bg-[#F7F6F3]">
          {children}
        </div>
      </main>
    </div>
  )
}

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <ProtectedRoute requiredRoles={['admin', 'manager']}>
      <SidebarProvider>
        <InventoryLayout>{children}</InventoryLayout>
      </SidebarProvider>
    </ProtectedRoute>
  )
}
