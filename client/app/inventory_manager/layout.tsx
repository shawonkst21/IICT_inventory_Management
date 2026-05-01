"use client"

import Sidebar from "../../components/Sidebar"
import { SidebarProvider, useSidebar } from "@/context/SidebarContext"

function InventoryLayout({ children }: { children: React.ReactNode }) {
  const { collapsed } = useSidebar()

  return (
    <div className="flex bg-white h-screen overflow-hidden">
      <Sidebar />
      <main
        className={`flex-1 bg-white transition-all duration-300 overflow-y-auto ${
          collapsed ? "ml-16" : "ml-64"
        }`}
      >
        <div className="p-8">
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
    <SidebarProvider>
      <InventoryLayout>{children}</InventoryLayout>
    </SidebarProvider>
  )
}
