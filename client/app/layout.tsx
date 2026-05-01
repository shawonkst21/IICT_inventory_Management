import { Poppins } from "next/font/google";
import "./globals.css";
import { ThemeContextProvider } from "@/context/ThemeContext";
import LenisScroll from "@/components/Lenis";
import { ReactNode } from "react";

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
        <html lang="en" className={`${poppins.variable} h-screen overflow-hidden`} suppressHydrationWarning>
            <body className="h-screen overflow-hidden">
                <ThemeContextProvider>
                    <LenisScroll />            
                    {children}
                </ThemeContextProvider>
            </body>
        </html>
    );
}