"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  LayoutDashboard,
  Users,
  ChevronLeft,
  ChevronDown,
  ChevronUp,
} from "lucide-react"
import { useState } from "react"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "./ui/Tooltip"
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar"
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
  { title: "Log Viewer", url: "/admin/log-viewer", icon: LayoutDashboard },
  { title: "Tender", url: "/admin/tender", icon: LayoutDashboard },
  { title: "Item Categories", url: "/admin/item-categories", icon: LayoutDashboard },
  { title: "System settings", url: "/admin/system-settings", icon: LayoutDashboard },

]

export default function AdminSidebar() {
  const pathname = usePathname()
  const [collapsed, setCollapsed] = useState(false)
  const [openSub, setOpenSub] = useState<Record<string, boolean>>({})

  const toggle = (t: string) =>
    setOpenSub((p) => ({ ...p, [t]: !p[t] }))

  const isActive = (url: string) =>
    pathname === url || pathname.startsWith(url + "/")

  const base = "flex items-center rounded-lg px-3 py-2 transition"
  const active = "bg-black text-white hover:bg-black"
  const normal = "text-black hover:bg-slate-100"

  const subActive = "bg-slate-900 text-white border-l-2 border-white"
  const subNormal =
    "text-black hover:bg-slate-50 border-l-2 border-transparent"

  const renderItem = (item: (typeof mainItems)[number]) => {
    const hasSub = item.subItems?.length
    const itemActive = isActive(item.url)
    const hasActiveSub = item.subItems?.some((s) => pathname === s.url)
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
        {!collapsed && (
          <>
            <span className="text-sm font-medium flex-1 text-left">
              {item.title}
            </span>
            {hasSub &&
              (openMenu ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              ))}
          </>
        )}
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
      className={`fixed left-0 top-0 bottom-0 border-r border-slate-200 bg-white transition-all duration-300 flex flex-col ${
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
              className="p-1.5 rounded-md hover:bg-slate-100"
            >
              <ChevronLeft className="h-4 w-4 text-black" />
            </button>
          )}

          {collapsed && (
            <button
              onClick={() => setCollapsed(false)}
              className="p-1.5 rounded-md hover:bg-slate-100"
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
                <button className="w-full cursor-pointer hover:opacity-80 transition">
                  <div
                    className={`flex ${
                      collapsed
                        ? "justify-center"
                        : "items-center gap-3"
                    }`}
                  >
                    <Avatar className="h-10 w-10">
                      <AvatarImage src="https://api.dicebear.com/7.x/avataaars/svg?seed=Admin" />
                      <AvatarFallback>AD</AvatarFallback>
                    </Avatar>

                    {!collapsed && (
                      <div className="min-w-0 text-left">
                        <p className="truncate text-sm font-semibold text-slate-800">
                          Admin User
                        </p>
                        <p className="truncate text-xs text-slate-500">
                          Administrator
                        </p>
                      </div>
                    )}
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
                    (window.location.href = "#profile")
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
                  onClick={() => (window.location.href = "/")}
                  className="text-red-600!"
                >
                  Logout
                </DropdownMenuItem>
              </DropdownMenuGroup>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </aside>
  )
}