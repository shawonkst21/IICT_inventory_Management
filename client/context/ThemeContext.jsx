"use client";
import { createContext, useContext, useEffect, useState } from "react";

export const ThemeContext = createContext();

export function ThemeContextProvider({ children }) {
    const [theme, setTheme] = useState("dark");

    useEffect(() => {
        const stored = localStorage.getItem("theme");
        const resolved = stored
            ? stored
            : window.matchMedia("(prefers-color-scheme: dark)").matches
            ? "dark"
            : "light";

        // eslint-disable-next-line react-hooks/set-state-in-effect
        setTheme(resolved);
        document.documentElement.classList.toggle("dark", resolved === "dark");
    }, []);

    return (
        <ThemeContext.Provider value={{
            theme, setTheme
        }}>
            {children}
        </ThemeContext.Provider>
    );
}

export function useThemeContext() {
    return useContext(ThemeContext);
}