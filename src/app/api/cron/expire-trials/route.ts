import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Daily cron: expire trial users whose trial_ends_at has passed
// Vercel cron sends GET with Authorization: Bearer $CRON_SECRET

export async function GET(request: Request) {
  try {
    const authHeader = request.headers.get('authorization')
    const cronSecret = request.headers.get('x-cron-secret')

    const isAuthorized =
      authHeader === `Bearer ${process.env.CRON_SECRET}` ||
      cronSecret === process.env.CRON_SECRET

    if (!isAuthorized) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // Find trialing, non-beta profiles whose trial has ended
    // Exclude test accounts by joining with auth.users
    const { data: expired, error: queryError } = await supabase
      .from('profiles')
      .select('id, user_id, trial_ends_at')
      .eq('subscription_status', 'trialing')
      .eq('is_beta', false)
      .lt('trial_ends_at', new Date().toISOString())

    if (queryError) {
      console.error('[expire-trials] Query error:', queryError)
      return NextResponse.json(
        { error: 'Failed to query expired trials', details: queryError.message },
        { status: 500 }
      )
    }

    if (!expired || expired.length === 0) {
      return NextResponse.json({ success: true, expired_count: 0 })
    }

    // Filter out test accounts
    const testEmails = [
      'qa-seed@forgenursing.test',
      'qa-beta-clone@forgenursing.test',
    ]

    const userIds = expired.map((p) => p.user_id)

    // Fetch emails from auth.users via admin API
    const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers()

    let excludedUserIds = new Set<string>()
    if (!authError && authUsers?.users) {
      for (const u of authUsers.users) {
        if (u.email && testEmails.includes(u.email)) {
          excludedUserIds.add(u.id)
        }
      }
    }

    const toExpire = expired.filter((p) => !excludedUserIds.has(p.user_id))

    if (toExpire.length === 0) {
      return NextResponse.json({ success: true, expired_count: 0 })
    }

    const idsToExpire = toExpire.map((p) => p.user_id)

    const { error: updateError } = await supabase
      .from('profiles')
      .update({ subscription_status: 'expired' })
      .in('user_id', idsToExpire)

    if (updateError) {
      console.error('[expire-trials] Update error:', updateError)
      return NextResponse.json(
        { error: 'Failed to update expired trials', details: updateError.message },
        { status: 500 }
      )
    }

    console.log(`[expire-trials] Expired ${idsToExpire.length} trial(s)`)

    return NextResponse.json({
      success: true,
      expired_count: idsToExpire.length,
    })
  } catch (error: any) {
    console.error('[expire-trials] Unexpected error:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    )
  }
}
