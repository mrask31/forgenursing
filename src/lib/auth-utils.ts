/**
 * Auth utilities for handling session issues and storage cleanup
 */

/**
 * Clears all Supabase-related storage from localStorage and sessionStorage
 * Also aggressively clears all Supabase cookies including domain variations
 */
export function clearSupabaseStorage(): void {
  if (typeof window === 'undefined') return

  try {
    // Clear localStorage
    const localStorageKeys = Object.keys(localStorage)
    localStorageKeys.forEach((key) => {
      if (key.toLowerCase().includes('supabase') || key.toLowerCase().startsWith('sb-')) {
        localStorage.removeItem(key)
      }
    })

    // Clear sessionStorage
    const sessionStorageKeys = Object.keys(sessionStorage)
    sessionStorageKeys.forEach((key) => {
      if (key.toLowerCase().includes('supabase') || key.toLowerCase().startsWith('sb-')) {
        sessionStorage.removeItem(key)
      }
    })

    // Aggressively clear ALL Supabase cookies with multiple domain/path combinations
    const domain = window.location.hostname
    const domainParts = domain.split('.')
    const baseDomain = domainParts.length > 1 ? `.${domainParts.slice(-2).join('.')}` : domain
    
    // Common Supabase cookie patterns
    const cookiePatterns = [
      'sb-',
      'supabase',
      'supabase-auth-token',
      'supabase.auth.token',
    ]

    // Get all cookies and clear matching ones
    document.cookie.split(';').forEach((cookie) => {
      const eqPos = cookie.indexOf('=')
      const name = eqPos > -1 ? cookie.substr(0, eqPos).trim() : cookie.trim()
      
      // Check if this cookie matches any Supabase pattern
      const isSupabaseCookie = cookiePatterns.some(pattern => 
        name.toLowerCase().includes(pattern.toLowerCase())
      )

      if (isSupabaseCookie) {
        // Clear with multiple domain/path combinations to ensure it's gone
        const paths = ['/', '/login', '/signup']
        const domains = [domain, baseDomain, `.${domain}`, '']
        
        paths.forEach(path => {
          domains.forEach(dom => {
            // Clear with expires in past
            const domainPart = dom ? `;domain=${dom}` : ''
            document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=${path}${domainPart};SameSite=None;Secure`
            document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=${path}${domainPart}`
          })
        })
      }
    })
  } catch (error) {
    console.error('[Auth] Error clearing Supabase storage:', error)
  }
}

/**
 * Checks if an error indicates a session/storage corruption issue
 */
export function isSessionError(error: any): boolean {
  if (!error) return false

  const errorMessage = error.message?.toLowerCase() || ''
  const errorCode = error.code?.toLowerCase() || ''

  // Common session-related error patterns
  const sessionErrorPatterns = [
    'invalid session',
    'session expired',
    'session not found',
    'token expired',
    'invalid token',
    'unauthorized',
    'storage',
    'localstorage',
    'cookie',
    'network',
    'fetch',
  ]

  return (
    sessionErrorPatterns.some((pattern) => errorMessage.includes(pattern)) ||
    errorCode === 'invalid_session' ||
    errorCode === 'session_not_found' ||
    errorCode === 'token_expired'
  )
}

/**
 * Reset session helper - clears storage and navigates to login
 */
export function resetSession(): void {
  if (typeof window === 'undefined') return

  clearSupabaseStorage()
  window.location.href = '/login'
}

/**
 * Debug logger for auth operations (only logs if NEXT_PUBLIC_DEBUG_AUTH === "true")
 */
export function debugAuthLog(message: string, data?: any): void {
  if (process.env.NEXT_PUBLIC_DEBUG_AUTH === 'true') {
  }
}
