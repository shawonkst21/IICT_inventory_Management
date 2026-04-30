import StafSidebar from "../../components/StafSidebar"

export default function StafLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex bg-white min-h-screen">
      <StafSidebar />
      <main className="flex-1">{children}</main>
    </div>
  )
}
