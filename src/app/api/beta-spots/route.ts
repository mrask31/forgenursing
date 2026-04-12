import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

const BETA_CAP = 20

export async function GET() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  console.log('[Beta Spots] URL:', supabaseUrl ? 'SET' : 'MISSING')
  console.log('[Beta Spots] KEY:', serviceRoleKey ? `SET (${serviceRoleKey.length} chars)` : 'MISSING')

  if (!supabaseUrl || !serviceRoleKey) {
    console.error('[Beta Spots] Missing env vars')
    return NextResponse.json({ spotsRemaining: 0, isFull: true })
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey)

  const { count, error } = await supabase
    .from('profiles')
    .select('*', { count: 'exact', head: true })
    .eq('is_beta', true)

  console.log('[Beta Spots] count:', count, 'error:', error)

  const betaCount = count ?? 0
  const spotsRemaining = Math.max(0, BETA_CAP - betaCount)

  return NextResponse.json(
    { spotsRemaining, isFull: spotsRemaining === 0 },
    { headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate' } }
  )
}
