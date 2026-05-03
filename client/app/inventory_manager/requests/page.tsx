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
    <div className="min-h-screen w-full bg-[#F7F6F3] px-8 py-8 font-['DM_Sans',sans-serif]">
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

      <div className="mb-8 mt-8">
        <div className="inline-flex items-center gap-2 rounded-full bg-[#ECEAE5] px-3 py-1 mb-4">
          <ClipboardList className="w-3.5 h-3.5 text-[#5A5650]" />
          <span className="text-xs font-medium text-[#5A5650] uppercase tracking-wide">Inventory</span>
        </div>
        <h1 className="text-4xl font-semibold tracking-tight text-[#1A1916] leading-none mb-2">Request Review</h1>
        <p className="max-w-3xl text-sm text-[#9A9690]">
          Review every item request in one place, approve or reject pending items, and move approved requests into issuance.
        </p>
      </div>

      <div>
        <InventoryRequestBoard mode="review" />
      </div>
    </div>
  )
}
