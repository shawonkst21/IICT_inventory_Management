"use client"

import { ReactNode } from "react"
import { motion } from "framer-motion"

interface ContentTransitionProps {
  children: ReactNode
}

export default function ContentTransition({ children }: ContentTransitionProps) {
  return (
    <motion.div
      initial={{ opacity: 0, x: 8 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -8 }}
      transition={{
        duration: 0.3,
        ease: [0.32, 0.72, 0, 1],
      }}
    >
      {children}
    </motion.div>
  )
}
