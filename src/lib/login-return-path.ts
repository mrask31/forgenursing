export function loginReturnPath(value: string | null): string | null {
  if (!value || !value.startsWith('/') || value.startsWith('//') || /[\\\u0000-\u0020]/.test(value)) return null
  try {
    const url = new URL(value, 'https://forgenursing.invalid')
    if (url.origin !== 'https://forgenursing.invalid' || ['/login', '/signup', '/auth/callback'].includes(url.pathname)) return null
    return `${url.pathname}${url.search}${url.hash}`
  } catch { return null }
}
