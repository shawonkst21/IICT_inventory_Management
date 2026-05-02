import { PackageCheck } from "lucide-react"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "../../../components/ui/Breadcrumb"
import InventoryRequestBoard from "../../../components/InventoryRequestBoard"

export default function OrdersPage() {
  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,rgba(15,23,42,0.08),transparent_34%),linear-gradient(180deg,#f8fafc_0%,#eef2ff_100%)] p-8">
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
            <BreadcrumbPage>Issuance</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <div className="mt-8 space-y-3">
        <div className="flex items-center gap-3">
          <PackageCheck className="h-8 w-8 text-slate-900" />
          <h1 className="text-3xl font-bold text-slate-900">Issuance Queue</h1>
        </div>
        <p className="max-w-3xl text-sm text-slate-700">
          Approved requests appear here for issuance. Mark them as issued once the item is handed over.
        </p>
      </div>

      <div className="mt-8">
        <InventoryRequestBoard mode="issuance" />
      </div>
    </div>
  )
}
