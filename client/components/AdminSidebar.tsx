"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  LayoutDashboard,
  Users,
  ShoppingCart,
  ChevronLeft,
  ChevronDown,
  ChevronUp,
} from "lucide-react"
import { useState } from "react"
import { useAuth } from "@/context/AuthContext"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "./ui/Tooltip"
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar"
import ProfileSheet from "./ProfileSheet"
import { useSidebar } from "@/context/SidebarContext"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu"

const mainItems = [
  { title: "Dashboard", url: "/admin", icon: LayoutDashboard },
  {
    title: "Users Management",
    url: "/admin/users",
    icon: Users,
    subItems: [
      { title: "Manage Users", url: "/admin/users" },
      { title: "Roles", url: "/admin/users/roles" },
    ],
  },
  {
    title: "Item Management",
    url: "/admin/items",
    icon: ShoppingCart,
    subItems: [
      { title: "Manage Items", url: "/admin/items" },
      { title: "Categories", url: "/admin/categories" },
    ],
  },
  { title: "Log Viewer", url: "/admin/log-viewer", icon: LayoutDashboard },
  { title: "Tender", url: "/admin/tender", icon: LayoutDashboard },

]

export default function AdminSidebar() {
  const pathname = usePathname()
  const { collapsed, setCollapsed } = useSidebar()
  const { user, logout } = useAuth()
  const [openSub, setOpenSub] = useState<Record<string, boolean>>({})
  const [profileSheetOpen, setProfileSheetOpen] = useState(false)
  const displayName = user?.name || "Admin User"
  const displayEmail = user?.email || "admin@iict.local"
  const avatarSeed = encodeURIComponent(displayName)
  const initials = displayName
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase()

  const toggle = (t: string) =>
    setOpenSub((p) => ({ ...p, [t]: !p[t] }))

  const isActive = (url: string) => {
    // Keep dashboard active only on exact /admin to avoid multiple active items.
    if (url === "/admin") return pathname === url
    return pathname === url || pathname.startsWith(url + "/")
  }

  const base = "flex items-center rounded-lg px-3 py-2 transition"
  const active = "bg-black text-white hover:bg-black"
  const normal = "text-black hover:bg-slate-100"
  const labelMotion =
    "overflow-hidden whitespace-nowrap transition-[max-width,opacity,transform] duration-300 ease-in-out"
  const expandedLabel = "max-w-40 opacity-100 translate-x-0"
  const collapsedLabel = "max-w-0 opacity-0 -translate-x-2"

  const subActive = "bg-slate-900 text-white border-l-2 border-white"
  const subNormal =
    "text-black hover:bg-slate-50 border-l-2 border-transparent"

  const renderItem = (item: (typeof mainItems)[number]) => {
    const hasSub = item.subItems?.length
    const hasActiveSub =
      item.subItems?.some(
        (s) => pathname === s.url || pathname.startsWith(s.url + "/")
      ) ?? false
    const itemActive = hasSub ? false : isActive(item.url)
    const openMenu = openSub[item.title] || hasActiveSub

    const button = (
      <button
        onClick={() => {
          if (hasSub) {
            toggle(item.title)
          } else {
            window.location.href = item.url
          }
        }}
        className={`w-full ${base} ${
          collapsed ? "justify-center" : "gap-3"
        } ${itemActive ? active : normal}`}
      >
        <item.icon className="h-5 w-5 shrink-0" />
        <span
          className={`text-sm font-medium flex-1 text-left ${labelMotion} ${
            collapsed ? collapsedLabel : expandedLabel
          }`}
        >
          {item.title}
        </span>
        {hasSub ? (
          <span
            className={`ml-auto ${labelMotion} ${
              collapsed ? collapsedLabel : expandedLabel
            }`}
          >
            {openMenu ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </span>
        ) : null}
      </button>
    )

    return (
      <div key={item.title}>
        {collapsed ? (
          <Tooltip>
            <TooltipTrigger>{button}</TooltipTrigger>
            <TooltipContent>{item.title}</TooltipContent>
          </Tooltip>
        ) : (
          button
        )}

        {/* Sub Items */}
        {!collapsed && hasSub && openMenu && (
          <div className="ml-8 mt-1 space-y-1 border-l-2 border-slate-300 pl-4">
            {item.subItems?.map((sub) => {
              const subIsActive = pathname === sub.url

              return (
                <Link
                  key={sub.title}
                  href={sub.url}
                  className={`block ${base} ${
                    subIsActive ? subActive : subNormal
                  }`}
                >
                  <span className="text-sm font-medium">
                    {sub.title}
                  </span>
                </Link>
              )
            })}
          </div>
        )}
      </div>
    )
  }

  return (
    <aside
      className={`fixed left-0 top-0 bottom-0 z-20 shrink-0 border-r border-slate-200 bg-[#F7F6F3] flex flex-col transition-[width] duration-300 ease-in-out will-change-[width] ${
        collapsed ? "w-16" : "w-64"
      }`}
    >
      {/* Header */}
      <div className="px-2 py-4">
        <div
          className={`flex items-center ${
            collapsed ? "justify-center" : "justify-between"
          }`}
        >
          <button
            onClick={() => setCollapsed(false)}
            className={`flex items-center ${
              collapsed ? "hidden" : "gap-2"
            }`}
          >
            <div className="h-9 w-9 rounded-lg bg-black text-white flex items-center justify-center font-bold text-sm">
              AD
            </div>
            <div>
              <div className="font-semibold text-black text-sm text-left">
                IICT
              </div>
              <div className="text-xs text-slate-600">
                Admin
              </div>
            </div>
          </button>

          {!collapsed && (
            <button
              onClick={() => setCollapsed(true)}
              className="p-1.5 rounded-md hover:bg-slate-100 transition-transform duration-300 ease-in-out"
            >
              <ChevronLeft className="h-4 w-4 text-black" />
            </button>
          )}

          {collapsed && (
            <button
              onClick={() => setCollapsed(false)}
              className="p-1.5 rounded-md hover:bg-slate-100 transition-transform duration-300 ease-in-out"
            >
              <ChevronLeft className="h-4 w-4 text-black rotate-180" />
            </button>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 px-2 overflow-y-auto">
        <div className="space-y-2">{mainItems.map(renderItem)}</div>
      </div>

      {/* Footer */}
      <div className="px-2 pb-4">
        <div className="mt-4 space-y-2 border-t border-slate-200 pt-3">
          <DropdownMenu>
            <div
              className={`flex ${
                collapsed ? "justify-center" : ""
              }`}
            >
              <DropdownMenuTrigger>
                <button className="w-full cursor-pointer hover:opacity-80 transition-opacity duration-300 ease-in-out">
                  <div
                    className={`flex ${
                      collapsed
                        ? "justify-center"
                        : "items-center gap-3"
                    }`}
                  >
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${avatarSeed}`} />
                      <AvatarFallback>{initials}</AvatarFallback>
                    </Avatar>

                    <div
                      className={`overflow-hidden min-w-0 text-left transition-[max-width,opacity,transform] duration-300 ease-in-out ${
                        collapsed
                          ? "max-w-0 opacity-0 -translate-x-2"
                          : "max-w-40 opacity-100 translate-x-0"
                      }`}
                    >
                      <p className="truncate text-sm font-semibold text-slate-800 whitespace-nowrap">
                        {displayName}
                      </p>
                      <p className="truncate text-xs text-slate-500 whitespace-nowrap">
                        {displayEmail}
                      </p>
                    </div>
                  </div>
                </button>
              </DropdownMenuTrigger>
            </div>

            <DropdownMenuContent align="start" className="w-48" positionAbove>
              <DropdownMenuGroup>
                <DropdownMenuLabel>
                  My Account
                </DropdownMenuLabel>
                <DropdownMenuItem
                  onClick={() =>
                    setProfileSheetOpen(true)
                  }
                >
                  Profile
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() =>
                    (window.location.href = "/admin/settings")
                  }
                >
                  Settings
                </DropdownMenuItem>
              </DropdownMenuGroup>

              <DropdownMenuSeparator />

              <DropdownMenuGroup>
                <DropdownMenuItem
                  onClick={logout}
                  className="text-red-600!"
                >
                  Logout
                </DropdownMenuItem>
              </DropdownMenuGroup>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
      <ProfileSheet open={profileSheetOpen} onOpenChange={setProfileSheetOpen} />
    </aside>
  )
}