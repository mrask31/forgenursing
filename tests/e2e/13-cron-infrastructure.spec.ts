import { test, expect } from '@playwright/test'

/**
 * Cron Infrastructure Guard (@infra)
 *
 * Verifies that every authenticated cron endpoint accepts the credential
 * patterns Vercel's cron runner actually uses, and rejects unauthenticated
 * requests. Runs against production.
 *
 * Created April 14, 2026 as part of I-004 diagnosis.
 */

const PRODUCTION_URL = 'https://forgenursing.com'

const CRON_ROUTES = [
  '/api/cron/process-emails',
  '/api/emails/process-welcome-queue',
  '/api/emails/process-trial-expiration',
  '/api/emails/process-beta-sequence',
  '/api/emails/process-beta-reengagement',
  '/api/emails/process-onboarding-sequence',
  '/api/stripe/webhook-retry',
] as const

function requireEnv(name: string): string {
  const value = process.env[name]
  if (!value) {
    throw new Error(
      `Required env var ${name} is missing. Add it to .env.test before running @infra tests.`
    )
  }
  return value
}

test.describe('@infra cron endpoints accept Vercel cron credentials', () => {
  let cronSecret: string
  let serviceRoleKey: string

  test.beforeAll(() => {
    cronSecret = requireEnv('CRON_SECRET')
    serviceRoleKey = requireEnv('SUPABASE_SERVICE_ROLE_KEY')
  })

  for (const route of CRON_ROUTES) {
    test(`${route} accepts at least one valid credential pattern`, async ({ request }) => {
      const results: Array<{ pattern: string; status: number }> = []

      const bearerCronRes = await request.get(`${PRODUCTION_URL}${route}`, {
        headers: { Authorization: `Bearer ${cronSecret}` },
        failOnStatusCode: false,
      })
      results.push({ pattern: 'Bearer CRON_SECRET', status: bearerCronRes.status() })

      const bearerServiceRes = await request.get(`${PRODUCTION_URL}${route}`, {
        headers: { Authorization: `Bearer ${serviceRoleKey}` },
        failOnStatusCode: false,
      })
      results.push({ pattern: 'Bearer SERVICE_ROLE', status: bearerServiceRes.status() })

      const headerRes = await request.get(`${PRODUCTION_URL}${route}`, {
        headers: { 'x-cron-secret': cronSecret },
        failOnStatusCode: false,
      })
      results.push({ pattern: 'x-cron-secret header', status: headerRes.status() })

      const acceptedPatterns = results.filter(r => r.status >= 200 && r.status < 300)
      const failureReport = results
        .map(r => `  ${r.pattern}: ${r.status}`)
        .join('\n')

      expect(
        acceptedPatterns.length,
        `Route ${route} rejected all three valid credential patterns:\n${failureReport}\n\n` +
        `Vercel's cron runner sends "Authorization: Bearer \${CRON_SECRET}". ` +
        `If none of the three patterns above returns 2xx, the cron cannot fire on schedule.`
      ).toBeGreaterThan(0)
    })

    test(`${route} rejects unauthenticated requests`, async ({ request }) => {
      const noAuthRes = await request.get(`${PRODUCTION_URL}${route}`, {
        failOnStatusCode: false,
      })
      expect(
        noAuthRes.status(),
        `Route ${route} accepted an unauthenticated request. This is a security issue.`
      ).toBe(401)
    })

    test(`${route} rejects wrong bearer token`, async ({ request }) => {
      const wrongBearerRes = await request.get(`${PRODUCTION_URL}${route}`, {
        headers: { Authorization: 'Bearer definitely-not-the-real-secret-xyz' },
        failOnStatusCode: false,
      })
      expect(
        wrongBearerRes.status(),
        `Route ${route} accepted a request with an invalid bearer token. Auth check is broken.`
      ).toBe(401)
    })
  }
})
