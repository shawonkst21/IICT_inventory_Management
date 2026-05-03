"use client"

import { ReactNode, useEffect } from "react"
import { motion } from "framer-motion"

interface ScrollToTopProps {
  children: ReactNode
}

export default function ScrollToTop({ children }: ScrollToTopProps) {
  useEffect(() => {
    // Scroll to top when content changes
    window.scrollTo({ top: 0, behavior: "smooth" })
  }, [children])

  return <>{children}</>
}
