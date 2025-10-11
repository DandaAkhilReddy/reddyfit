'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { ReactNode, useState } from 'react'
import { X } from 'lucide-react'

interface PinterestCardProps {
  id: string
  children: ReactNode
  detailContent: ReactNode
  className?: string
}

export function PinterestCard({ id, children, detailContent, className = '' }: PinterestCardProps) {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <>
      {/* Card in Grid */}
      <motion.div
        layoutId={`card-${id}`}
        onClick={() => setIsOpen(true)}
        className={`cursor-pointer ${className}`}
        whileHover={{ scale: 1.05 }}
        transition={{ duration: 0.3 }}
      >
        {children}
      </motion.div>

      {/* Fullscreen Detail View */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50"
            />

            {/* Detail Card */}
            <div className="fixed inset-0 z-50 overflow-y-auto">
              <div className="min-h-screen px-4 py-8 flex items-center justify-center">
                <motion.div
                  layoutId={`card-${id}`}
                  className="relative w-full max-w-4xl glass-effect rounded-3xl p-8"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  {/* Close Button */}
                  <button
                    onClick={() => setIsOpen(false)}
                    className="absolute top-4 right-4 p-2 hover:bg-white/10 rounded-full transition-colors"
                  >
                    <X className="w-6 h-6" />
                  </button>

                  {/* Detail Content */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                  >
                    {detailContent}
                  </motion.div>
                </motion.div>
              </div>
            </div>
          </>
        )}
      </AnimatePresence>
    </>
  )
}

interface PinterestGridProps {
  children: ReactNode
  columns?: number
  className?: string
}

export function PinterestGrid({ children, columns = 3, className = '' }: PinterestGridProps) {
  return (
    <div
      className={`grid gap-6 ${className}`}
      style={{
        gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`
      }}
    >
      {children}
    </div>
  )
}
