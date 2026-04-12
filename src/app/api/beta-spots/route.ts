import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

const BETA_CAP = 20

function jsonResponse(data: { spotsRemaining: number; isFull: boolean }) {
  return NextResponse.json(data, {
    headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate' },
  })
}

export async function GET() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !anonKey) {
    console.error('[Beta Spots] Missing SUPABASE_URL or ANON_KEY')
    return jsonResponse({ spotsRemaining: 0, isFull: true })
  }

  try {
    // Use anon key — the RPC is SECURITY DEFINER so it bypasses RLS
    const supabase = createClient(supabaseUrl, anonKey)

    const { data: betaCount, error } = await supabase.rpc('get_beta_spot_data')

    console.log(`[Beta Spots] rpc result: data=${betaCount}, type=${typeof betaCount}, error=${JSON.stringify(error)}`)

    if (error) {
      console.error('[Beta Spots] RPC error:', error)
      return jsonResponse({ spotsRemaining: 0, isFull: true })
    }

    const count = typeof betaCount === 'number' ? betaCount : 0
    const spotsRemaining = Math.max(0, BETA_CAP - count)
    const isFull = spotsRemaining === 0

    console.log(`[Beta Spots] betaCount=${count}, spotsRemaining=${spotsRemaining}, isFull=${isFull}`)

    return jsonResponse({ spotsRemaining, isFull })
  } catch (err: any) {
    console.error('[Beta Spots] Unexpected error:', err)
    return jsonResponse({ spotsRemaining: 0, isFull: true })
  }
}
