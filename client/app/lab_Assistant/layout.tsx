import StafSidebar from "../../components/StafSidebar"

export default function StafLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="h-screen bg-white overflow-hidden">
      <StafSidebar />
      <main className="fixed top-0 right-0 bottom-0 w-[calc(100%-16rem)] overflow-y-auto" style={{ left: 'var(--sidebar-width, 16rem)' }}>{children}</main>
    </div>
  )
}
