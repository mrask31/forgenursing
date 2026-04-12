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

    // Use a direct count query as the source of truth instead of the RPC,
    // which may return stale results if the STABLE→VOLATILE migration
    // has not been applied yet.
    const { count, error } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .eq('is_beta', true)

    if (error) {
      console.error('[Beta Spots] Error fetching beta count:', error)
      return jsonResponse({ spotsRemaining: 0, isFull: true })
    }

    const betaCount = count ?? 0
    const spotsRemaining = Math.max(0, BETA_CAP - betaCount)
    const isFull = spotsRemaining === 0

    console.log(`[Beta Spots] betaCount=${betaCount}, BETA_CAP=${BETA_CAP}, spotsRemaining=${spotsRemaining}, isFull=${isFull}`)

    return jsonResponse({ spotsRemaining, isFull })
  } catch (err: any) {
    console.error('[Beta Spots] Unexpected error:', err)
    return jsonResponse({ spotsRemaining: 0, isFull: true })
  }
}
