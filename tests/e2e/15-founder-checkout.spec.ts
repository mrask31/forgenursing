import { test, expect } from '@playwright/test'
import { admin } from './helpers/supabase'
import { uniqueTestEmail, TEST_PASSWORD } from './helpers/users'

const SUPABASE_URL = process.env.SUPABASE_URL!
const ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const BASE_URL = process.env.PLAYWRIGHT_BASE_URL || 'https://forgenursing.com'
const PROJECT_REF = 'gqrpjvmxquipurmhmvfs'
const ENDPOINT = `${BASE_URL}/api/stripe/checkout-founder`

/** Sign in via Supabase password grant and return a Cookie header string */
async function signInForCookie(email: string): Promise<string> {
  const res = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      apikey: ANON_KEY,
    },
    body: JSON.stringify({ email, password: TEST_PASSWORD }),
  })
  if (!res.ok) {
    const text = await res.text()
    throw new Error(`Supabase sign-in failed ${res.status}: ${text}`)
  }
  const session = await res.json()
  const cookieName = `sb-${PROJECT_REF}-auth-token`
  const value = JSON.stringify(session)

  // @supabase/ssr chunks cookie values at 3180 bytes
  const MAX_CHUNK = 3180
  if (value.length <= MAX_CHUNK) {
    return `${cookieName}=${value}`
  }
  const chunks: string[] = []
  for (let i = 0; i * MAX_CHUNK < value.length; i++) {
    chunks.push(
      `${cookieName}.${i}=${value.slice(i * MAX_CHUNK, (i + 1) * MAX_CHUNK)}`
    )
  }
  return chunks.join('; ')
}

async function createBetaUser(
  tag: string,
  overrides: Partial<{
    is_beta: boolean
    subscription_status: string
  }> = {}
): Promise<{ userId: string; email: string; cookie: string }> {
  const email = uniqueTestEmail(tag)
  const { data, error } = await admin.auth.admin.createUser({
    email,
    password: TEST_PASSWORD,
    email_confirm: true,
  })
  if (error) throw error
  const userId = data.user!.id

  await admin.from('profiles').update({
    is_beta: overrides.is_beta ?? true,
    subscription_status: overrides.subscription_status ?? 'trialing',
    phi_acknowledged_at: new Date().toISOString(),
    program_level: 'BSN',
  }).eq('id', userId)

  const cookie = await signInForCookie(email)
  return { userId, email, cookie }
}

test.describe('POST /api/stripe/checkout-founder', () => {
  // ─── 401: no auth ───────────────────────────────────────────────────────────
  test('401 when no auth cookie is sent', async ({ request }) => {
    const res = await request.post(ENDPOINT, {
      data: { plan: 'monthly' },
    })
    expect(res.status()).toBe(401)
  })

  // ─── 403: non-beta user ─────────────────────────────────────────────────────
  test('403 when authenticated user has is_beta=false', async ({ request }) => {
    const { userId, cookie } = await createBetaUser('founder-nonbeta', {
      is_beta: false,
      subscription_status: 'trialing',
    })
    try {
      const res = await request.post(ENDPOINT, {
        data: { plan: 'monthly' },
        headers: { Cookie: cookie },
      })
      expect(res.status()).toBe(403)
      const body = await res.json()
      expect(body.error).toContain('beta')
    } finally {
      await admin.auth.admin.deleteUser(userId)
    }
  })

  // ─── 409: already subscribed ────────────────────────────────────────────────
  test('409 when beta user already has active subscription', async ({ request }) => {
    const { userId, cookie } = await createBetaUser('founder-active', {
      is_beta: true,
      subscription_status: 'active',
    })
    try {
      const res = await request.post(ENDPOINT, {
        data: { plan: 'monthly' },
        headers: { Cookie: cookie },
      })
      expect(res.status()).toBe(409)
      const body = await res.json()
      expect(body.error).toContain('subscribed')
    } finally {
      await admin.auth.admin.deleteUser(userId)
    }
  })

  // ─── 400: invalid plan ──────────────────────────────────────────────────────
  test('400 when plan is not monthly/semester/annual', async ({ request }) => {
    const { userId, cookie } = await createBetaUser('founder-badplan')
    try {
      const res = await request.post(ENDPOINT, {
        data: { plan: 'enterprise' },
        headers: { Cookie: cookie },
      })
      expect(res.status()).toBe(400)
      const body = await res.json()
      expect(body.error).toContain('plan')
    } finally {
      await admin.auth.admin.deleteUser(userId)
    }
  })

  // ─── 200: valid founder checkout ────────────────────────────────────────────
  test('200 with Stripe URL when valid beta user requests monthly plan', async ({ request }) => {
    const { userId, cookie } = await createBetaUser('founder-valid')
    try {
      const res = await request.post(ENDPOINT, {
        data: { plan: 'monthly' },
        headers: { Cookie: cookie },
      })
      expect(res.status()).toBe(200)
      const body = await res.json()
      expect(typeof body.url, 'response should include a url string').toBe('string')
      expect(body.url, 'url should be a Stripe checkout URL').toContain('stripe.com')
      expect(typeof body.sessionId, 'response should include a sessionId string').toBe('string')
    } finally {
      await admin.auth.admin.deleteUser(userId)
    }
  })

  // ─── 403: standard trial user ───────────────────────────────────────────────
  test('403 when standard trial user (is_beta=false, subscription_status=trialing)', async ({ request }) => {
    const { userId, cookie } = await createBetaUser('founder-trial', {
      is_beta: false,
      subscription_status: 'trialing',
    })
    try {
      const res = await request.post(ENDPOINT, {
        data: { plan: 'annual' },
        headers: { Cookie: cookie },
      })
      expect(res.status()).toBe(403)
    } finally {
      await admin.auth.admin.deleteUser(userId)
    }
  })
})
