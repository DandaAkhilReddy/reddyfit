'use client'

import { Suspense } from 'react'
import WaitlistSuccessContent from './WaitlistSuccessContent'

export default function WaitlistSuccessPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen pt-24 pb-20 flex items-center justify-center">
        <div className="text-2xl gradient-text">Loading...</div>
      </div>
    }>
      <WaitlistSuccessContent />
    </Suspense>
  )
}
