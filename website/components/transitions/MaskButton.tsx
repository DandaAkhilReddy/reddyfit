'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'
import { useState, MouseEvent } from 'react'

interface MaskButtonProps {
  children: React.ReactNode
  variant?: 'primary' | 'secondary' | 'ghost'
  href?: string
  onClick?: () => void
  className?: string
  type?: 'button' | 'submit'
}

export default function MaskButton({
  children,
  variant = 'primary',
  href,
  onClick,
  className = '',
  type = 'button'
}: MaskButtonProps) {
  const [ripples, setRipples] = useState<{ x: number; y: number; id: number }[]>([])

  const createRipple = (event: MouseEvent<HTMLElement>) => {
    const button = event.currentTarget
    const rect = button.getBoundingClientRect()
    const x = event.clientX - rect.left
    const y = event.clientY - rect.top
    const newRipple = { x, y, id: Date.now() }

    setRipples([...ripples, newRipple])

    // Remove ripple after animation
    setTimeout(() => {
      setRipples(prev => prev.filter(ripple => ripple.id !== newRipple.id))
    }, 600)

    onClick?.()
  }

  const baseClasses = 'relative overflow-hidden px-6 py-3 rounded-lg font-semibold transition-all duration-300'

  const variantClasses = {
    primary: 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white shadow-lg hover:shadow-xl',
    secondary: 'bg-white/10 hover:bg-white/20 text-white border border-white/20',
    ghost: 'hover:bg-white/10 text-white'
  }

  const combinedClasses = `${baseClasses} ${variantClasses[variant]} ${className}`

  const content = (
    <>
      <span className="relative z-10">{children}</span>
      {ripples.map(ripple => (
        <span
          key={ripple.id}
          className="ripple"
          style={{
            left: ripple.x,
            top: ripple.y,
          }}
        />
      ))}
    </>
  )

  if (href) {
    return (
      <Link href={href} className={combinedClasses} onClick={createRipple}>
        {content}
      </Link>
    )
  }

  return (
    <motion.button
      type={type}
      className={combinedClasses}
      onClick={createRipple}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
    >
      {content}
    </motion.button>
  )
}
