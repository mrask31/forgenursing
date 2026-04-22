import { createClient, SupabaseClient } from '@supabase/supabase-js'
import { Resend } from 'resend'
import { getEmailTemplate } from './email-templates'

/**
 * Creates a Supabase client using the service role key.
 * Bypasses RLS — use only in server-side cron/API routes.
 */
export function createServiceRoleClient(): SupabaseClient {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

/**
 * Verifies that the incoming request is authorized via either:
 *  - `x-cron-secret` header matching CRON_SECRET env var
 *  - `Authorization: Bearer <SUPABASE_SERVICE_ROLE_KEY>` header
 *  - `Authorization: Bearer <CRON_SECRET>` header (used by Vercel cron)
 */
export function verifyAuthorization(request: Request): boolean {
  const authHeader = request.headers.get('authorization')
  const cronSecret = request.headers.get('x-cron-secret')

  return (
    authHeader === `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}` ||
    authHeader === `Bearer ${process.env.CRON_SECRET}` ||
    cronSecret === process.env.CRON_SECRET
  )
}

interface ProcessResult {
  sent: number
  failed: number
  errors: Array<{ email: string; type: string; error: string }>
}

/**
 * Queries pending emails from email_queue matching the given emailTypes
 * (with attempts < 3), sends each via Resend, and updates status accordingly.
 *
 * On success: status → 'sent', sets sent_at and resend_email_id.
 * On failure: increments attempts. At 3 attempts, status → 'failed' with error_message.
 */
export async function processPendingEmails(
  supabase: SupabaseClient,
  emailTypes: string[]
): Promise<ProcessResult> {
  const result: ProcessResult = { sent: 0, failed: 0, errors: [] }

  const { data: pendingEmails, error: fetchError } = await supabase
    .from('email_queue')
    .select('*')
    .in('email_type', emailTypes)
    .eq('status', 'pending')
    .lt('attempts', 3)

  if (fetchError) {
    console.error('[Email Utils] Error fetching pending emails:', fetchError)
    return result
  }

  if (!pendingEmails || pendingEmails.length === 0) {
    return result
  }

  const resend = new Resend(process.env.RESEND_API_KEY)

  for (const item of pendingEmails) {
    try {
      const template = getEmailTemplate(item.email_type)

      const { data: emailData, error: emailError } = await resend.emails.send({
        from: 'ForgeNursing <support@forgenursing.com>',
        to: item.email,
        replyTo: 'support@forgenursing.com',
        subject: template.subject,
        html: template.html,
      })

      if (emailError) {
        throw emailError
      }

      // Mark as sent
      const { error: updateError } = await supabase
        .from('email_queue')
        .update({
          status: 'sent',
          sent_at: new Date().toISOString(),
          resend_email_id: emailData?.id || null,
        })
        .eq('id', item.id)
      if (updateError) {
        console.error(`[Email Utils] Failed to mark ${item.email_type} as sent for ${item.email}:`, updateError)
      }

      result.sent++
    } catch (error: any) {
      const newAttempts = (item.attempts || 0) + 1
      const errorMessage = error.message || 'Unknown error'

      const updateData: Record<string, any> = {
        attempts: newAttempts,
        error_message: errorMessage,
      }

      if (newAttempts >= 3) {
        updateData.status = 'failed'
      }

      const { error: updateError } = await supabase
        .from('email_queue')
        .update(updateData)
        .eq('id', item.id)
      if (updateError) {
        console.error(`[Email Utils] Failed to update failure state for ${item.email_type} / ${item.email}:`, updateError)
      }

      result.failed++
      result.errors.push({
        email: item.email,
        type: item.email_type,
        error: errorMessage,
      })

      console.error(
        `[Email Utils] Failed to send ${item.email_type} to ${item.email}:`,
        error
      )
    }
  }

  return result
}
