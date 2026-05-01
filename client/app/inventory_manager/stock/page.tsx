import React from "react"
import StockLevel from "../../../components/StockLevel"
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbSeparator,
  BreadcrumbPage,
} from "../../../components/ui/Breadcrumb"

export default function StockPage() {
  return (
    <>
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
            <BreadcrumbPage>Stock Levels</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <h1 className="text-2xl font-semibold mb-2 mt-6 text-slate-900">
        <span className="bg-gradient-to-r from-[#923FEF] to-[#C35DE8] bg-clip-text text-transparent">
          Stock
        </span>
        {" "}Levels
      </h1>
      <p className="text-slate-600 mb-6">Monitor and manage inventory stock levels</p>

      <StockLevel />
    </>
  )
}
