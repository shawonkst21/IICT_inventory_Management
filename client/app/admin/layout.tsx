import AdminSidebar from "../../components/AdminSidebar"

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="h-screen bg-white overflow-hidden">
      <AdminSidebar />
      <main className="fixed top-0 right-0 bottom-0 w-[calc(100%-16rem)] overflow-y-auto" style={{ left: 'var(--sidebar-width, 16rem)' }}>{children}</main>
    </div>
  )
}
