import { Poppins, Geist } from "next/font/google";
import "./globals.css";
import { ThemeContextProvider } from "@/context/ThemeContext";
import { AuthProvider } from "@/context/AuthContext";
import LenisScroll from "@/components/Lenis";
import { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { Toaster } from "sonner";

const geist = Geist({subsets:['latin'],variable:'--font-geist-sans'});

const poppins = Poppins({
    variable: "--font-poppins",
    subsets: ["latin"],
    weight: ["400", "500", "600", "700"],
});

export const metadata = {
    title: "IICT inventory management system",
    description: "Landing is a SaaS template for developers to build SaaS applications.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
    return (
        <html lang="en" className={cn("overflow-hidden", poppins.variable, "font-sans", geist.variable)} suppressHydrationWarning>
            <body className="h-full">
                <ThemeContextProvider>
                    <AuthProvider>
                        {/* <LenisScroll />             */}
                        {children}
                        <Toaster position="top-right" />
                    </AuthProvider>
                </ThemeContextProvider>
            </body>
        </html>
    );
}