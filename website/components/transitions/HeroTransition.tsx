'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { ReactNode } from 'react'

interface HeroTransitionProps {
  children: ReactNode
  heroKey: string
  className?: string
}

export function HeroImage({ children, heroKey, className = '' }: HeroTransitionProps) {
  return (
    <motion.div
      layoutId={`hero-image-${heroKey}`}
      className={className}
      transition={{
        duration: 0.5,
        ease: [0.4, 0, 0.2, 1]
      }}
    >
      {children}
    </motion.div>
  )
}

export function HeroContent({ children, heroKey, className = '' }: HeroTransitionProps) {
  return (
    <motion.div
      layoutId={`hero-content-${heroKey}`}
      className={className}
      transition={{
        duration: 0.5,
        ease: [0.4, 0, 0.2, 1]
      }}
    >
      {children}
    </motion.div>
  )
}

interface HeroContainerProps {
  children: ReactNode
  className?: string
}

export function HeroContainer({ children, className = '' }: HeroContainerProps) {
  return (
    <AnimatePresence mode="wait">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className={className}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  )
}
