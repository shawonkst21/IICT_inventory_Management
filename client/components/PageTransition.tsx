"use client"

import { ReactNode } from "react"
import { motion } from "framer-motion"

interface PageTransitionProps {
  children: ReactNode
}

export default function PageTransition({ children }: PageTransitionProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -16 }}
      transition={{
        duration: 0.4,
        ease: [0.32, 0.72, 0, 1], // smooth easing
      }}
    >
      {children}
    </motion.div>
  )
}
