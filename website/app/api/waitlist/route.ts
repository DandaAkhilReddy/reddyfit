import { NextRequest, NextResponse } from 'next/server'
import { getFirestore, collection, doc, setDoc, getDoc, serverTimestamp, Firestore } from 'firebase/firestore'
import { Resend } from 'resend'
import { getWaitlistEmailHTML, getWaitlistEmailText } from '@/lib/email'

// TypeScript interfaces for type safety
interface WaitlistUser {
  name: string
  email: string
  photoUrl: string
  uid: string
  tier: 'starter' | 'pro' | 'elite' | 'platinum'
  position: number
  referralCode: string
  referredBy: string | null
  referrerUid: string | null
  referralCount: number
  signupDate: string
  notified: boolean
}

interface TierRange {
  start: number
  max: number
}

// Constants for magic numbers
const POSITION_BOOST_PER_REFERRAL = 10
const REFERRAL_CODE_LENGTH = 6

// Initialize Resend (only if API key is available)
const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null

// Helper: Generate unique referral code
function generateReferralCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  let code = ''
  for (let i = 0; i < REFERRAL_CODE_LENGTH; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return code
}

// Helper: Calculate position based on tier and signup order
async function calculatePosition(db: Firestore, tier: string): Promise<number> {
  const { getDocs, collection, query, where } = await import('firebase/firestore')

  // Tier-based position ranges
  const tierRanges: Record<string, TierRange> = {
    platinum: { start: 1, max: 100 },
    elite: { start: 101, max: 500 },
    pro: { start: 501, max: 2000 },
    starter: { start: 2001, max: 999999 }
  }

  const range = tierRanges[tier.toLowerCase()] || tierRanges.starter

  // Count existing users in this tier
  const waitlistRef = collection(db, 'waitlist')
  const q = query(waitlistRef, where('tier', '==', tier))
  const snapshot = await getDocs(q)

  // Position is tier start + count of users in tier
  const position = range.start + snapshot.size

  // Ensure we don't exceed tier maximum
  return Math.min(position, range.max)
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, email, photoUrl, uid, tier, referredBy } = body

    // Validate required fields
    if (!name || !email || !uid) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Use client Firebase SDK
    const { db } = await import('@/lib/firebase')

    // Check if user already exists
    const userRef = doc(db, 'waitlist', uid)
    const userDoc = await getDoc(userRef)

    if (userDoc.exists()) {
      const existingData = userDoc.data()
      return NextResponse.json(
        {
          error: 'You\'re already on the waitlist!',
          position: existingData.position,
          referralCode: existingData.referralCode
        },
        { status: 400 }
      )
    }

    // Generate unique referral code
    const referralCode = generateReferralCode()

    // Calculate position
    const position = await calculatePosition(db, tier || 'pro')

    // Process referral if provided
    let referrerUid = null
    if (referredBy) {
      try {
        // Find the referrer by their referral code
        const { getDocs, collection, query, where, updateDoc, increment } = await import('firebase/firestore')
        const waitlistRef = collection(db, 'waitlist')
        const q = query(waitlistRef, where('referralCode', '==', referredBy))
        const snapshot = await getDocs(q)

        if (!snapshot.empty) {
          const referrerDoc = snapshot.docs[0]
          referrerUid = referrerDoc.id

          // Update referrer's referral count and improve their position
          const referrerRef = doc(db, 'waitlist', referrerUid)
          const currentReferralCount = referrerDoc.data().referralCount || 0

          await updateDoc(referrerRef, {
            referralCount: increment(1),
            position: Math.max(1, referrerDoc.data().position - POSITION_BOOST_PER_REFERRAL)
          })
        }
      } catch (referralError) {
        console.error('Referral processing error:', referralError)
        // Continue even if referral fails
      }
    }

    // Save to Firestore with new fields
    await setDoc(userRef, {
      name,
      email,
      photoUrl: photoUrl || '',
      tier: tier || 'pro',
      position,
      referralCode,
      referredBy: referredBy || null,
      referrerUid: referrerUid,
      referralCount: 0,
      signupDate: new Date().toISOString(),
      notified: false,
    })

    // Send welcome email with position and referral link
    if (resend) {
      try {
        await resend.emails.send({
          from: 'ReddyFit <onboarding@resend.dev>', // Use your verified domain in production
          to: email,
          subject: `You\'re #${position} on the ReddyFit Waitlist! 🎉`,
          html: getWaitlistEmailHTML(name, position, referralCode),
          text: getWaitlistEmailText(name, position, referralCode),
        })
      } catch (emailError) {
        console.error('Email send error:', emailError)
        // Don't fail the whole request if email fails
      }
    } else {
      console.warn('Resend not configured - email not sent')
    }

    return NextResponse.json({
      success: true,
      message: 'Successfully joined the waitlist!',
      position,
      referralCode,
    })
  } catch (error: any) {
    console.error('Waitlist API error:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const { db } = await import('@/lib/firebase')
    const { getDocs, collection, query, orderBy } = await import('firebase/firestore')

    // Get all waitlist users (admin only - add auth check in production)
    const waitlistRef = collection(db, 'waitlist')
    // Order by position (ascending) to show top positions first
    const q = query(waitlistRef, orderBy('position', 'asc'))
    const snapshot = await getDocs(q)

    const users = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }))

    // Calculate analytics
    const totalUsers = users.length
    const tierBreakdown = users.reduce((acc: any, user: any) => {
      acc[user.tier] = (acc[user.tier] || 0) + 1
      return acc
    }, {})

    const totalReferrals = users.reduce((sum: number, user: any) => sum + (user.referralCount || 0), 0)
    const avgReferralsPerUser = totalUsers > 0 ? totalReferrals / totalUsers : 0

    // Get top 10 referrers
    const topReferrers = users
      .filter((user: any) => user.referralCount > 0)
      .sort((a: any, b: any) => (b.referralCount || 0) - (a.referralCount || 0))
      .slice(0, 10)
      .map((user: any) => ({
        name: user.name,
        email: user.email,
        referralCount: user.referralCount,
        position: user.position
      }))

    return NextResponse.json({
      success: true,
      count: totalUsers,
      users,
      analytics: {
        totalUsers,
        tierBreakdown,
        totalReferrals,
        avgReferralsPerUser: Math.round(avgReferralsPerUser * 10) / 10,
        topReferrers
      }
    })
  } catch (error: any) {
    console.error('Waitlist GET error:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
