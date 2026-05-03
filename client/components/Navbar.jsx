"use client";
import { navLinks } from "@/data/navLinks";
import { MenuIcon, XIcon } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import ThemeToggle from "./ThemeToggle";
import { useThemeContext } from "@/context/ThemeContext";

export default function Navbar() {
    const [openMobileMenu, setOpenMobileMenu] = useState(false);
    const { theme } = useThemeContext();
    const isDark = theme === 'dark';

    useEffect(() => {
        if (openMobileMenu) {
            document.body.classList.add("max-md:overflow-hidden");
        } else {
            document.body.classList.remove("max-md:overflow-hidden");
        }
    }, [openMobileMenu]);

    return (
        <nav className={`flex items-center justify-between fixed z-50 top-0 w-full px-6 md:px-16 lg:px-24 xl:px-32 py-4 ${openMobileMenu ? '' : 'backdrop-blur'}`}>
            <a href="/">
                <Image className="h-9 md:h-9.5 w-auto shrink-0" src={isDark ? "/assets/iict_darkmode.png" : "/assets/iict.png"} alt="IICT Logo" width={140} height={40} priority fetchPriority="high" />
            </a>
            {/* <div className="hidden items-center md:gap-8 lg:gap-9 md:flex lg:pl-20">
                {navLinks.map((link) => (
                    <Link key={link.name} href={link.href} className="hover:text-slate-600 dark:hover:text-slate-300">
                        {link.name}
                    </Link>
                ))}
            </div> */}
            {/* Mobile menu */}
            <div className={`fixed inset-0 flex flex-col items-center justify-center gap-6 text-lg font-medium bg-white/60 dark:bg-black/40 backdrop-blur-md md:hidden transition duration-300 ${openMobileMenu ? "translate-x-0" : "-translate-x-full"}`}>
                {navLinks.map((link) => (
                    <Link key={link.name} href={link.href} onClick={() => setOpenMobileMenu(false)}>
                        {link.name}
                    </Link>
                ))}
                <Link href="/auth/login" onClick={() => setOpenMobileMenu(false)} className={`${isDark ? 'text-white' : 'text-[#1A1916]'}`}>
                    Sign in
                </Link>
                <Link href="/auth/register" onClick={() => setOpenMobileMenu(false)} className={`${isDark ? 'bg-purple-600 hover:bg-purple-700 text-white' : 'bg-[#1A1916] hover:bg-[#5A5650] text-white'} px-4 py-2 rounded-md`}>
                    Get started
                </Link>
                <button className="aspect-square size-10 p-1 items-center justify-center bg-purple-600 hover:bg-purple-700 transition text-white rounded-md flex" onClick={() => setOpenMobileMenu(false)}>
                    <XIcon />
                </button>
            </div>
            <div className="flex items-center gap-4">
                <ThemeToggle />
                <Link href="/auth/login" className={`hidden md:block transition px-4 py-2 border rounded-md ${isDark ? 'hover:bg-slate-100 border-purple-600 text-white' : 'hover:bg-slate-100 border-[#E2DFD9] text-[#1A1916]'}`}>
                    Sign in
                </Link>
                <Link href="/auth/register" className={`hidden md:block px-4 py-2 transition text-white rounded-md ${isDark ? 'bg-purple-600 hover:bg-purple-700' : 'bg-[#1A1916] hover:bg-[#5A5650]'}`}>
                    Get started
                </Link>
                <button onClick={() => setOpenMobileMenu(!openMobileMenu)} aria-label="Toggle navigation menu" className="md:hidden">
                    <MenuIcon size={26} className="active:scale-90 transition" />
                </button>
            </div>
        </nav>
    );
}