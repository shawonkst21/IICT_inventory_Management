import { ThemeContextProvider } from "@/context/ThemeContext";
import LenisScroll from "@/components/Lenis";
import { ReactNode } from "react";

export default function landinglayout({ children }: { children: ReactNode }) {
    return (
        <ThemeContextProvider>
            <LenisScroll />
            {children}
        </ThemeContextProvider>
    );
}