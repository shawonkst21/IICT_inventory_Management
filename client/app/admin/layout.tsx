import AdminSidebar from "../../components/AdminSidebar"

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex bg-white min-h-screen">
      <AdminSidebar />
      <main className="flex-1">{children}</main>
    </div>
  )
}
