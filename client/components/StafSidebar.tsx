"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import {
  Bell,
  FileText,
  History,
  Package,
  ChevronLeft,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { useLayoutEffect, useState } from "react";
import type { LucideIcon } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { Tooltip, TooltipContent, TooltipTrigger } from "./ui/Tooltip";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import ProfileSheet from "./ProfileSheet";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";

interface MenuItem {
  title: string;
  url: string;
  icon: LucideIcon;
  subItems?: MenuItem[];
}

const mainItems: MenuItem[] = [
  // { title: "My Requests", url: "/lab_Assistant/my-requests", icon: FileText },
  {
    title: "Item Requests",
    url: "/lab_Assistant/item-requests",
    icon: Package,
  },
  {
    title: "Request History",
    url: "/lab_Assistant/item-requests/history",
    icon: History,
  },
  // { title: "Notifications", url: "/lab_Assistant/notifications", icon: Bell },
];

export default function StafSidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const [collapsed, setCollapsed] = useState(false);
  const [openSub, setOpenSub] = useState<Record<string, boolean>>({});
  const [profileSheetOpen, setProfileSheetOpen] = useState(false);

  useLayoutEffect(() => {
    document.documentElement.style.setProperty(
      "--staff-sidebar-width",
      collapsed ? "4rem" : "16rem",
    );
  }, [collapsed]);

  const toggle = (t: string) => setOpenSub((p) => ({ ...p, [t]: !p[t] }));

  const isActive = (url: string) => pathname === url;

  const base = "flex items-center rounded-lg px-3 py-2 transition";
  const active = "bg-[#1A1916] text-white";
  const normal = "text-black hover:bg-slate-100";
  const displayName = user?.name || "Staff Member";
  const displayEmail = user?.email || "staff@iict.local";
  const avatarSeed = encodeURIComponent(displayName);
  const initials = displayName
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
  const labelMotion =
    "overflow-hidden whitespace-nowrap transition-[max-width,opacity,transform] duration-300 ease-in-out";
  const expandedLabel = "max-w-40 opacity-100 translate-x-0";
  const collapsedLabel = "max-w-0 opacity-0 -translate-x-2";

  const renderItem = (item: MenuItem) => {
    const hasSub = item.subItems?.length;
    const itemActive = isActive(item.url);
    const subActive = item.subItems?.some((s) => pathname === s.url);
    const openMenu = openSub[item.title] || subActive;

    const button = (
      <motion.button
        whileHover={{ x: 2 }}
        whileTap={{ scale: 0.98 }}
        onClick={() => {
          if (hasSub) toggle(item.title);
          else window.location.href = item.url;
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
            <motion.div
              animate={{ rotate: openMenu ? 180 : 0 }}
              transition={{ duration: 0.2 }}
            >
              {openMenu ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
            </motion.div>
          </span>
        ) : null}
      </motion.button>
    );

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

        {!collapsed && hasSub && openMenu && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="ml-7 mt-1 space-y-1 border-l border-slate-300 pl-3 overflow-hidden"
          >
            {item.subItems?.map((sub, idx) => {
              const subIsActive = pathname === sub.url;

              return (
                <motion.div
                  key={sub.title}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.05, duration: 0.2 }}
                >
                  <Link
                    href={sub.url}
                    className={`block ${base} ${subIsActive ? active : normal}`}
                  >
                    <span className="text-sm">{sub.title}</span>
                  </Link>
                </motion.div>
              );
            })}
          </motion.div>
        )}
      </div>
    );
  };

  return (
    <aside
      className={`fixed left-0 top-0 bottom-0 z-20 shrink-0 border-r border-slate-200 bg-[#F7F6F3] flex flex-col transition-[width] duration-300 ease-in-out will-change-[width] ${
        collapsed ? "w-16" : "w-64"
      }`}
    >
      {/* Header */}
      <div className="px-3 py-4">
        <div
          className={`flex items-center ${
            collapsed ? "justify-center" : "justify-between"
          }`}
        >
          <button
            onClick={() => setCollapsed(false)}
            className={`flex items-center ${collapsed ? "hidden" : "gap-3"}`}
          >
            <div className="h-9 w-9 rounded-lg bg-black text-white flex items-center justify-center text-sm font-bold">
              ST
            </div>
            <div className="leading-tight">
              <p className="text-sm font-semibold text-black">IICT</p>
              <p className="text-xs text-slate-500">Staff</p>
            </div>
          </button>

          <button
            onClick={() => setCollapsed(!collapsed)}
            className="p-1.5 rounded-md hover:bg-slate-100 transition-transform duration-300 ease-in-out"
          >
            <motion.div
              animate={{ rotate: collapsed ? 180 : 0 }}
              transition={{ duration: 0.3 }}
            >
              <ChevronLeft className="h-4 w-4 text-black" />
            </motion.div>
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 px-2  overflow-y-auto ">
        <div className="space-y-1">{mainItems.map(renderItem)}</div>
      </div>

      {/* Footer */}
      <div className="px-2 pb-3 pt-2 border-t border-slate-200">
        <DropdownMenu>
          <div className={`flex ${collapsed ? "justify-center" : ""}`}>
            <DropdownMenuTrigger>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="w-full hover:opacity-80 transition-opacity duration-300 ease-in-out"
              >
                <div
                  className={`flex ${
                    collapsed
                      ? "justify-center"
                      : "items-center gap-3 px-2 py-2"
                  }`}
                >
                  <Avatar className="h-9 w-9">
                    <AvatarImage src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${avatarSeed}`} />
                    <AvatarFallback>{initials}</AvatarFallback>
                  </Avatar>

                  <div
                    className={`overflow-hidden text-left transition-[max-width,opacity,transform] duration-300 ease-in-out ${
                      collapsed
                        ? "max-w-0 opacity-0 -translate-x-2"
                        : "max-w-32 opacity-100 translate-x-0"
                    }`}
                  >
                    <p className="text-sm font-semibold text-slate-800 whitespace-nowrap truncate">
                      {displayName}
                    </p>
                    <p className="text-xs text-slate-500 whitespace-nowrap truncate">
                      {displayEmail}
                    </p>
                  </div>
                </div>
              </motion.button>
            </DropdownMenuTrigger>
          </div>

          <DropdownMenuContent align="start" className="w-48" positionAbove>
            <DropdownMenuGroup>
              <DropdownMenuLabel className="text-black">
                My Account
              </DropdownMenuLabel>
              <DropdownMenuItem
                onClick={() => setProfileSheetOpen(true)}
              >
                Profile
              </DropdownMenuItem>
            </DropdownMenuGroup>

            <DropdownMenuItem onClick={logout} className="text-red-600!">
              Logout
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      <ProfileSheet open={profileSheetOpen} onOpenChange={setProfileSheetOpen} />
    </aside>
  );
}
