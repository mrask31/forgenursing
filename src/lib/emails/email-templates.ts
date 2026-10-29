import { retakeLifecycleEmail } from '@/lib/emails/retake-lifecycle'
/**
 * Email templates for the onboarding and beta re-engagement sequences.
 * Each function returns { subject, html } with inline CSS, table-based layout
 * for email client compatibility, gradient headers, and CTA buttons.
 *
 * Brand colors: teal (#0D8F9C), navy (#0B2545)
 */

export function getOnboardingDay0Email(): { subject: string; html: string } {
  return retakeLifecycleEmail('welcome')
}

// ---------------------------------------------------------------------------
// Template 2: Onboarding Day 3 — Trial Reminder
// ---------------------------------------------------------------------------

export function getOnboardingDay3Email(): { subject: string; html: string } {
  return retakeLifecycleEmail('day3')
}

// ---------------------------------------------------------------------------
// Template 3: Onboarding Day 6 — Trial Expiration Warning
// ---------------------------------------------------------------------------

export function getOnboardingDay6Email(): { subject: string; html: string } {
  return retakeLifecycleEmail('day6')
}

// ---------------------------------------------------------------------------
// Template 4: Beta Day 7 — Re-engagement
// ---------------------------------------------------------------------------

export function getBetaDay7ReengagementEmail(): { subject: string; html: string } {
  return retakeLifecycleEmail('beta')
}

// ---------------------------------------------------------------------------
// Lookup function
// ---------------------------------------------------------------------------

export function getEmailTemplate(emailType: string): { subject: string; html: string } {
  switch (emailType) {
    case 'onboarding_day_0':
      return getOnboardingDay0Email()
    case 'onboarding_day_3':
      return getOnboardingDay3Email()
    case 'onboarding_day_6':
      return getOnboardingDay6Email()
    case 'beta_day_7_reengagement':
      return getBetaDay7ReengagementEmail()
    default:
      throw new Error(`Unknown email type: ${emailType}`)
  }
}
