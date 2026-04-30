"use client"

import React from "react"

export function Avatar({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`relative inline-flex items-center justify-center overflow-hidden rounded-full bg-slate-200 ${className}`}>
      {children}
    </div>
  )
}

export function AvatarImage({ src, alt = "", className = "" }: { src: string; alt?: string; className?: string }) {
  return <img src={src} alt={alt} className={`h-full w-full object-cover ${className}`} />
}

export function AvatarFallback({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <span className={`flex h-full w-full items-center justify-center bg-slate-300 text-sm font-medium text-slate-700 ${className}`}>
      {children}
    </span>
  )
}
