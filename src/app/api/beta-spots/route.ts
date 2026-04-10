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

    // Try RPC first
    const { data: betaCount, error: rpcError } = await supabase.rpc('get_beta_user_count')

    if (!rpcError && typeof betaCount === 'number') {
      const spotsRemaining = Math.max(0, BETA_CAP - betaCount)
      return NextResponse.json({ spotsRemaining, isFull: spotsRemaining === 0 })
    }

    if (rpcError) {
      console.error('[Beta Spots] RPC error, falling back to direct query:', rpcError)
    }

    // Fallback: direct count query
    const { count, error: countError } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .eq('is_beta', true)

    if (countError) {
      console.error('[Beta Spots] Error counting beta users:', countError)
      return NextResponse.json({ spotsRemaining: BETA_CAP, isFull: false })
    }

    const total = count ?? 0
    const spotsRemaining = Math.max(0, BETA_CAP - total)

    return NextResponse.json({ spotsRemaining, isFull: spotsRemaining === 0 })
  } catch (err: any) {
    console.error('[Beta Spots] Unexpected error:', err)
    return NextResponse.json({ spotsRemaining: BETA_CAP, isFull: false })
  }
}
