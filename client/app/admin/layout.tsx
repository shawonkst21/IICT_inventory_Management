"use client"

import AdminSidebar from "@/components/AdminSidebar"
import { SidebarProvider, useSidebar } from "@/context/SidebarContext"
import { ProtectedRoute } from "@/components/ProtectedRoute"

function AdminLayoutShell({ children }: { children: React.ReactNode }) {
  const { collapsed } = useSidebar()

  return (
    <div className="flex h-screen overflow-hidden bg-[#F7F6F3]">
      <AdminSidebar />
      <main
        className={`flex-1 overflow-y-auto bg-[#F7F6F3] transition-all duration-300 ${
          collapsed ? "ml-16" : "ml-64"
        }`}
      >
        <div className="p-8">{children}</div>
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
    <ProtectedRoute requiredRoles={['admin']}>
      <SidebarProvider>
        <AdminLayoutShell>{children}</AdminLayoutShell>
      </SidebarProvider>
    </ProtectedRoute>
  )
}