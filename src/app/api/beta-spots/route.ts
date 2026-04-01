import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const BETA_CAP = 20

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const { data: betaCount, error } = await supabase.rpc('get_beta_user_count')

    if (error) {
      console.error('[Beta Spots] Error fetching beta count:', error)
      return NextResponse.json({ spotsRemaining: BETA_CAP, isFull: false })
    }

    const count = typeof betaCount === 'number' ? betaCount : 0
    const spotsRemaining = Math.max(0, BETA_CAP - count)
    const isFull = spotsRemaining === 0

    return NextResponse.json({ spotsRemaining, isFull })
  } catch (err: any) {
    console.error('[Beta Spots] Unexpected error:', err)
    return NextResponse.json({ spotsRemaining: BETA_CAP, isFull: false })
  }
}
