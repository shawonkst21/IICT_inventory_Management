import Sidebar from "../../components/Sidebar"

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex bg-white min-h-screen">
      <Sidebar />
      <main className="flex-1">{children}</main>
    </div>
  )
}
