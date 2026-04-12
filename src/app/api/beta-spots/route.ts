import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const BETA_CAP = 20

export const dynamic = 'force-dynamic'

function jsonResponse(data: { spotsRemaining: number; isFull: boolean }) {
  return NextResponse.json(data, {
    headers: {
      'Cache-Control': 'no-store, no-cache, must-revalidate',
    },
  })
}

export async function GET() {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const { data: betaCount, error } = await supabase.rpc('get_beta_user_count')

    if (error) {
      console.error('[Beta Spots] Error fetching beta count:', error)
      // Fail safe: assume beta is full when we can't read the DB
      return jsonResponse({ spotsRemaining: 0, isFull: true })
    }

    const count = typeof betaCount === 'number' ? betaCount : 0
    const spotsRemaining = Math.max(0, BETA_CAP - count)
    const isFull = spotsRemaining === 0

    return jsonResponse({ spotsRemaining, isFull })
  } catch (err: any) {
    console.error('[Beta Spots] Unexpected error:', err)
    // Fail safe: assume beta is full on unexpected errors
    return jsonResponse({ spotsRemaining: 0, isFull: true })
  }
}
