"use client"

import Link from "next/link"
import React from "react"

export function Breadcrumb({ children }: { children: React.ReactNode }) {
  return (
    <nav aria-label="Breadcrumb" className="mb-3">
      <ol className="flex items-center text-sm text-slate-600">{children}</ol>
    </nav>
  )
}

export function BreadcrumbList({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}

export function BreadcrumbItem({ children }: { children: React.ReactNode }) {
  return <li className="flex items-center">{children}</li>
}

export function BreadcrumbSeparator() {
  return <li className="px-2 text-slate-300">/</li>
}

export function BreadcrumbLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link href={href} className="text-slate-600 hover:text-slate-800">
      {children}
    </Link>
  )
}

export function BreadcrumbPage({ children }: { children: React.ReactNode }) {
  return (
    <span aria-current="page" className="text-slate-800 font-medium">
      {children}
    </span>
  )
}

export default Breadcrumb
