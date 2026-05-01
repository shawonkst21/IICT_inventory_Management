import { ClipboardList } from "lucide-react"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "../../../components/ui/Breadcrumb"
import InventoryRequestBoard from "../../../components/InventoryRequestBoard"

export default function RequestsPage() {
  return (
    <div
      className="min-h-screen bg-slate-50 p-8"
      style={{
        backgroundImage:
          "radial-gradient(circle_at_top,rgba(15,23,42,0.08),transparent_34%),linear-gradient(180deg,#f8fafc_0%,#eef2ff_100%)",
      }}
    >
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href="/">Home</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink href="/inventory_manager">Inventory Manager</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>Requests</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <div className="mt-8 space-y-3">
        <div className="flex items-center gap-3">
          <ClipboardList className="h-8 w-8 text-slate-900" />
          <h1 className="text-3xl font-bold text-slate-900">Request Review</h1>
        </div>
        <p className="max-w-3xl text-sm text-slate-700">
          Review every item request in one place, approve or reject pending items, and move approved requests into issuance.
        </p>
      </div>

      <div className="mt-8">
        <InventoryRequestBoard mode="review" />
      </div>
    </div>
  )
}
