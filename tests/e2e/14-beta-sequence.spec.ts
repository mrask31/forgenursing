import { test, expect } from '@playwright/test'
import { uniqueTestEmail, TEST_PASSWORD } from './helpers/users'
import { admin } from './helpers/supabase'

/** Backdate auth.users.created_at and profiles.created_at via the test helper RPC */
async function setUserCreatedAt(userId: string, date: Date): Promise<void> {
  const { error } = await admin.rpc('test_set_user_created_at', {
    p_user_id: userId,
    p_created_at: date.toISOString(),
  })
  if (error) throw new Error(`test_set_user_created_at failed: ${JSON.stringify(error)}`)
}

function daysAgo(n: number): Date {
  return new Date(Date.now() - n * 24 * 60 * 60 * 1000)
}

function daysFromNow(n: number): Date {
  return new Date(Date.now() + n * 24 * 60 * 60 * 1000)
}

test.describe.serial('Beta email sequence — RPC eligibility', () => {
  let userId: string
  let userEmail: string

  test.beforeAll(async () => {
    userEmail = uniqueTestEmail('beta-seq')
    const { data, error } = await admin.auth.admin.createUser({
      email: userEmail,
      password: TEST_PASSWORD,
      email_confirm: true,
    })
    if (error) throw error
    userId = data.user!.id

    await admin.from('profiles').update({
      is_beta: true,
      beta_expires_at: daysFromNow(90).toISOString(),
      subscription_status: 'trialing',
      phi_acknowledged_at: new Date().toISOString(),
      program_level: 'BSN',
    }).eq('id', userId)
  })

  test.afterAll(async () => {
    await admin.auth.admin.deleteUser(userId)
  })

  /** Remove any pending/sent lifecycle email rows for this user+type */
  async function clearLifecycleEmail(type: string) {
    await (admin.from as any)('beta_lifecycle_emails')
      .delete()
      .eq('user_id', userId)
      .eq('email_type', type)
  }

  /** Queue a dedup row using the real RPC the route uses */
  async function queueDedup(emailType: string) {
    const { error } = await admin.rpc('queue_beta_lifecycle_email', {
      p_user_id: userId,
      p_email: userEmail,
      p_email_type: emailType,
    })
    if (error) throw new Error(`queue_beta_lifecycle_email failed: ${JSON.stringify(error)}`)
  }

  // ─── Day 3 ──────────────────────────────────────────────────────────────────

  test('day_3: eligible after 3 days, deduped by beta_lifecycle_emails', async () => {
    await setUserCreatedAt(userId, daysAgo(3.5))
    await clearLifecycleEmail('day_3')

    const { data, error } = await admin.rpc('get_beta_users_for_day_3')
    expect(error, `RPC error: ${JSON.stringify(error)}`).toBeNull()
    expect(
      (data ?? []).some((r: any) => r.user_id === userId),
      'user should appear in day_3 eligible list'
    ).toBe(true)

    await queueDedup('day_3')

    const { data: after } = await admin.rpc('get_beta_users_for_day_3')
    expect(
      (after ?? []).some((r: any) => r.user_id === userId),
      'user should be excluded after dedup row'
    ).toBe(false)
  })

  // ─── Week 1 ─────────────────────────────────────────────────────────────────

  test('week_1: eligible after 7 days, deduped by beta_lifecycle_emails', async () => {
    await setUserCreatedAt(userId, daysAgo(7.5))
    await clearLifecycleEmail('week_1')

    const { data, error } = await admin.rpc('get_beta_users_for_week_1')
    expect(error, `RPC error: ${JSON.stringify(error)}`).toBeNull()
    expect(
      (data ?? []).some((r: any) => r.user_id === userId),
      'user should appear in week_1 eligible list'
    ).toBe(true)

    await queueDedup('week_1')

    const { data: after } = await admin.rpc('get_beta_users_for_week_1')
    expect(
      (after ?? []).some((r: any) => r.user_id === userId),
      'user should be excluded after dedup row'
    ).toBe(false)
  })

  // ─── Day 30 ─────────────────────────────────────────────────────────────────

  test('day_30: eligible after 30 days, deduped by beta_lifecycle_emails', async () => {
    await setUserCreatedAt(userId, daysAgo(30.5))
    await clearLifecycleEmail('day_30')

    const { data, error } = await admin.rpc('get_beta_users_for_day_30')
    expect(error, `RPC error: ${JSON.stringify(error)}`).toBeNull()
    expect(
      (data ?? []).some((r: any) => r.user_id === userId),
      'user should appear in day_30 eligible list'
    ).toBe(true)

    await queueDedup('day_30')

    const { data: after } = await admin.rpc('get_beta_users_for_day_30')
    expect(
      (after ?? []).some((r: any) => r.user_id === userId),
      'user should be excluded after dedup row'
    ).toBe(false)
  })

  // ─── Day 45 ─────────────────────────────────────────────────────────────────

  test('day_45: eligible after 45 days, deduped by beta_lifecycle_emails', async () => {
    await setUserCreatedAt(userId, daysAgo(45.5))
    await clearLifecycleEmail('day_45')

    const { data, error } = await admin.rpc('get_beta_users_for_day_45')
    expect(error, `RPC error: ${JSON.stringify(error)}`).toBeNull()
    expect(
      (data ?? []).some((r: any) => r.user_id === userId),
      'user should appear in day_45 eligible list'
    ).toBe(true)

    await queueDedup('day_45')

    const { data: after } = await admin.rpc('get_beta_users_for_day_45')
    expect(
      (after ?? []).some((r: any) => r.user_id === userId),
      'user should be excluded after dedup row'
    ).toBe(false)
  })

  // ─── Day 60 ─────────────────────────────────────────────────────────────────

  test('day_60: eligible after 60 days, deduped by beta_lifecycle_emails', async () => {
    await setUserCreatedAt(userId, daysAgo(60.5))
    await clearLifecycleEmail('day_60')

    const { data, error } = await admin.rpc('get_beta_users_for_day_60')
    expect(error, `RPC error: ${JSON.stringify(error)}`).toBeNull()
    expect(
      (data ?? []).some((r: any) => r.user_id === userId),
      'user should appear in day_60 eligible list'
    ).toBe(true)

    await queueDedup('day_60')

    const { data: after } = await admin.rpc('get_beta_users_for_day_60')
    expect(
      (after ?? []).some((r: any) => r.user_id === userId),
      'user should be excluded after dedup row'
    ).toBe(false)
  })

  // ─── Day 76 ─────────────────────────────────────────────────────────────────

  test('day_76: eligible when beta_expires_at is ~14 days away, deduped by beta_lifecycle_emails', async () => {
    // Window: beta_expires_at <= NOW()+15d AND beta_expires_at > NOW()+13d
    const betaExpiresAt = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString()
    const { error: profileErr } = await admin.from('profiles').update({
      beta_expires_at: betaExpiresAt,
      is_beta: true,
    }).eq('id', userId)
    expect(profileErr, `Profile update error: ${JSON.stringify(profileErr)}`).toBeNull()
    // Clear ALL lifecycle emails — prior tests leave day_3..day_60 rows
    await (admin.from as any)('beta_lifecycle_emails').delete().eq('user_id', userId)

    const { data, error } = await admin.rpc('get_beta_users_for_day_76')
    expect(error, `RPC error: ${JSON.stringify(error)}`).toBeNull()
    expect(
      (data ?? []).some((r: any) => r.user_id === userId),
      `user should appear in day_76 list (beta_expires_at=${betaExpiresAt})`
    ).toBe(true)

    await queueDedup('day_76')

    const { data: after } = await admin.rpc('get_beta_users_for_day_76')
    expect(
      (after ?? []).some((r: any) => r.user_id === userId),
      'user should be excluded after dedup row'
    ).toBe(false)
  })

  // ─── Day 90 ─────────────────────────────────────────────────────────────────

  test('day_90: eligible when beta_expires_at expired within last 24h, deduped by beta_lifecycle_emails', async () => {
    // Window: beta_expires_at <= NOW() AND beta_expires_at > NOW()-24h
    const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000)
    await admin.from('profiles').update({
      beta_expires_at: twoHoursAgo.toISOString(),
    }).eq('id', userId)
    await clearLifecycleEmail('day_90')

    const { data, error } = await admin.rpc('get_beta_users_for_day_90')
    expect(error, `RPC error: ${JSON.stringify(error)}`).toBeNull()
    expect(
      (data ?? []).some((r: any) => r.user_id === userId),
      'user should appear in day_90 eligible list'
    ).toBe(true)

    await queueDedup('day_90')

    const { data: after } = await admin.rpc('get_beta_users_for_day_90')
    expect(
      (after ?? []).some((r: any) => r.user_id === userId),
      'user should be excluded after dedup row'
    ).toBe(false)
  })
})
