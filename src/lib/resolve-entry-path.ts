/** All sign-ins enter the practice plan. Legacy tools remain in More study tools. */
export function resolveEntryPath(_profile?: {
  quiz_first_enabled?: boolean | null
  default_entry_path?: string | null
} | null): string {
  return '/entry'
}
