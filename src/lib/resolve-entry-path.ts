/**
 * Centralized entry path resolver for quiz-first routing.
 * Used by auth callback, login page, signup page, and middleware.
 *
 * Rules:
 * - If default_entry_path is set ('quiz' or 'tutor'), honor it.
 * - If quiz_first_enabled is true and no preference saved, go to /entry.
 * - Otherwise, default to /tutor (existing behavior for legacy users).
 */
export function resolveEntryPath(profile: {
  quiz_first_enabled?: boolean | null
  default_entry_path?: string | null
} | null | undefined): string {
  if (profile?.default_entry_path === 'quiz') return '/quiz'
  if (profile?.default_entry_path === 'tutor') return '/tutor'
  if (profile?.quiz_first_enabled === true) return '/entry'
  return '/tutor'
}
