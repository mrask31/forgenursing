import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'

const COOKIE_NAME_PATTERNS = [
  /^sb-/i,
  /supabase/i,
  /auth-token/i,
]

const COMMON_SUPABASE_COOKIE_NAMES = [
  'supabase-auth-token',
  'supabase.auth.token',
]

function getCookieNamesToClear() {
  const store = cookies()
  const names = new Set<string>()

  for (const cookie of store.getAll()) {
    if (COOKIE_NAME_PATTERNS.some((pattern) => pattern.test(cookie.name))) {
      names.add(cookie.name)
    }
  }

  for (const name of COMMON_SUPABASE_COOKIE_NAMES) {
    names.add(name)
  }

  const projectRef = process.env.NEXT_PUBLIC_SUPABASE_URL
    ?.match(/^https:\/\/([^.]+)\./)?.[1]

  if (projectRef) {
    names.add(`sb-${projectRef}-auth-token`)
    names.add(`sb-${projectRef}-auth-token.0`)
    names.add(`sb-${projectRef}-auth-token.1`)
    names.add(`sb-${projectRef}-auth-token.2`)
  }

  return Array.from(names)
}

function expireCookie(response: NextResponse, name: string) {
  const commonOptions = {
    value: '',
    expires: new Date(0),
    maxAge: 0,
    path: '/',
  }

  response.cookies.set(name, commonOptions)

  const appUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://forgenursing.com'
  const hostname = (() => {
    try {
      return new URL(appUrl).hostname
    } catch {
      return 'forgenursing.com'
    }
  })()

  const baseDomain = hostname.split('.').slice(-2).join('.')
  const domains = Array.from(new Set([
    hostname,
    `.${hostname}`,
    baseDomain,
    `.${baseDomain}`,
  ]))

  for (const domain of domains) {
    response.cookies.set(name, {
      ...commonOptions,
      domain,
    })
  }
}

export async function POST() {
  const response = NextResponse.json({ ok: true })

  for (const name of getCookieNamesToClear()) {
    expireCookie(response, name)
  }

  response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate')
  response.headers.set('Pragma', 'no-cache')
  response.headers.set('Expires', '0')

  return response
}

export async function GET() {
  return POST()
}
