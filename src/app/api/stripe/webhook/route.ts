import { NextResponse } from 'next/server'
import Stripe from 'stripe'
import { Resend } from 'resend'
import { createClient } from '@supabase/supabase-js'
import { headers } from 'next/headers'
import type { Database } from '@/types/database'

const resend = new Resend(process.env.RESEND_API_KEY)
const RETAKE_90_DAY_PRICE_ID = 'price_1U5TaXANsjwnC4OKNGTQiDoF'
const RETAKE_ACCESS_DAYS = 90

function getStripeClient(): Stripe {
  if (!process.env.STRIPE_SECRET_KEY) {
    throw new Error('STRIPE_SECRET_KEY is not configured')
  }
  return new Stripe(process.env.STRIPE_SECRET_KEY, {
    apiVersion: '2025-12-15.clover',
  })
}

export const dynamic = 'force-dynamic'

function addDays(days: number): string {
  const date = new Date()
  date.setDate(date.getDate() + days)
  return date.toISOString()
}

function mapPriceIdToTierType(priceId: string): string | null {
  if (!priceId) return null

  const monthlyIds = [
    process.env.NEXT_PUBLIC_STRIPE_PRICE_MONTHLY,
    process.env.STRIPE_PRICE_MONTHLY_FOUNDER,
  ].filter(Boolean)

  const semesterIds = [
    process.env.NEXT_PUBLIC_STRIPE_PRICE_SEMESTER,
    process.env.STRIPE_PRICE_SEMESTER_FOUNDER,
  ].filter(Boolean)

  const annualIds = [
    process.env.NEXT_PUBLIC_STRIPE_PRICE_ANNUAL,
    process.env.STRIPE_PRICE_ANNUAL_FOUNDER,
  ].filter(Boolean)

  const retakeIds = [
    process.env.NEXT_PUBLIC_STRIPE_PRICE_RETAKE_90_DAY,
    process.env.STRIPE_PRICE_RETAKE_90_DAY_FOUNDER,
    RETAKE_90_DAY_PRICE_ID,
  ].filter(Boolean)

  if (monthlyIds.includes(priceId)) return 'monthly'
  if (semesterIds.includes(priceId)) return 'semester'
  if (annualIds.includes(priceId)) return 'annual'
  if (retakeIds.includes(priceId)) return 'retake'

  console.warn(`[Webhook] Unknown price ID: ${priceId} — tier_type not set`)
  return null
}

function extractEventMetadata(event: Stripe.Event) {
  let userId: string | null = null
  let customerId: string | null = null
  let subscriptionId: string | null = null

  try {
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as Stripe.Checkout.Session
      userId = session.client_reference_id || session.metadata?.user_id || null
      customerId = typeof session.customer === 'string' ? session.customer : null
      subscriptionId = typeof session.subscription === 'string' ? session.subscription : null
    } else if (event.type.startsWith('customer.subscription.')) {
      const subscription = event.data.object as Stripe.Subscription
      customerId = subscription.customer as string || null
      subscriptionId = subscription.id || null
    }
  } catch (error) {
    console.error('[Webhook] Error extracting metadata:', error)
  }

  return { userId, customerId, subscriptionId }
}

async function logWebhookEvent(
  supabase: any,
  event: Stripe.Event,
  status: 'pending' | 'processing' | 'succeeded' | 'failed',
  error?: string
) {
  try {
    const metadata = extractEventMetadata(event)

    const { error: dbError } = await supabase
      .from('webhook_events')
      .upsert({
        stripe_event_id: event.id,
        event_type: event.type,
        payload: event as any,
        status,
        attempt_count: 1,
        last_attempt_at: new Date().toISOString(),
        last_error: error || null,
        succeeded_at: status === 'succeeded' ? new Date().toISOString() : null,
        user_id: metadata.userId,
        customer_id: metadata.customerId,
        subscription_id: metadata.subscriptionId,
      }, {
        onConflict: 'stripe_event_id',
        ignoreDuplicates: false,
      })

    if (dbError) {
      console.error('[Webhook] Error logging to database:', dbError)
    }
  } catch (err) {
    console.error('[Webhook] Error in logWebhookEvent:', err)
  }
}

async function updateWebhookAttempt(
  supabase: any,
  eventId: string,
  status: 'succeeded' | 'failed' | 'retrying',
  error?: string
) {
  try {
    const updates: any = {
      status,
      last_attempt_at: new Date().toISOString(),
      last_error: error || null,
    }

    if (status === 'succeeded') {
      updates.succeeded_at = new Date().toISOString()
    }

    const { error: dbError } = await supabase
      .from('webhook_events')
      .update(updates)
      .eq('stripe_event_id', eventId)

    if (dbError) {
      console.error('[Webhook] Error updating attempt:', dbError)
    }
  } catch (err) {
    console.error('[Webhook] Error in updateWebhookAttempt:', err)
  }
}

function retakePassEmailHtml(accessEndsAt?: string | null) {
  const accessDate = accessEndsAt
    ? new Date(accessEndsAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
    : null

  return `<div style="font-family: 'DM Sans', -apple-system, BlinkMacSystemFont, sans-serif; max-width: 600px; margin: 0 auto; color: #1a1a1a; font-size: 16px; line-height: 1.6;">
  <p>You're in.</p>
  <p>Your ForgeNursing 90-Day Retake Recovery Pass is active${accessDate ? ` through ${accessDate}` : ''}.</p>
  <p>Start here:</p>
  <p style="background: #E0F4F6; border-left: 4px solid #0D8F9C; padding: 12px 16px; font-weight: bold;">Before you retake, know why you picked the wrong one.</p>
  <p>Use ForgeNursing to work through diagnostic questions, review Answer Autopsies, and build a clearer fix plan around your missed-answer patterns.</p>
  <p>Reply to this email anytime — I read every one personally.</p>
  <p>Michael</p>
  <a href="https://forgenursing.com/entry" style="background: linear-gradient(135deg, #0B2545 0%, #0D8F9C 100%); color: white; padding: 14px 28px; text-decoration: none; border-radius: 10px; display: inline-block; font-weight: 600;">Start Recovery →</a>
</div>`
}

function subscriptionConfirmationEmailHtml() {
  return `<div style="font-family: 'DM Sans', -apple-system, BlinkMacSystemFont, sans-serif; max-width: 600px; margin: 0 auto; color: #1a1a1a; font-size: 16px; line-height: 1.6;">
  <p>You're in — and this time it's official.</p>
  <p>Your ForgeNursing subscription is active. You now have full access to practice quizzes, mistake-type feedback, targeted retests, and the clinical reasoning tutor.</p>
  <p>If you haven't already, try this first:</p>
  <p style="background: #E0F4F6; border-left: 4px solid #0D8F9C; padding: 12px 16px; font-weight: bold;">Take a quick practice quiz. Miss one. Then use Forge to find the thinking mistake.</p>
  <p>That's where ForgeNursing is different: it helps you see why you picked the wrong answer, then lets you fix and retest that weakness.</p>
  <p>Reply to this email anytime — I read every one personally.</p>
  <p>Michael</p>
  <a href="https://forgenursing.com/entry" style="background: linear-gradient(135deg, #0B2545 0%, #0D8F9C 100%); color: white; padding: 14px 28px; text-decoration: none; border-radius: 10px; display: inline-block; font-weight: 600;">Start Learning →</a>
</div>`
}

async function resolveUserIdFromSession(supabase: any, session: Stripe.Checkout.Session): Promise<string | null> {
  let userId = session.client_reference_id || session.metadata?.user_id || null
  const customerId = typeof session.customer === 'string' ? session.customer : null

  if (!userId && customerId) {
    const { data: existingProfile } = await supabase
      .from('profiles')
      .select('id')
      .eq('stripe_customer_id', customerId)
      .single()

    if (existingProfile?.id) {
      userId = existingProfile.id
    }
  }

  return userId
}

async function sendEmail(to: string | null | undefined, subject: string, html: string) {
  if (!to) return

  try {
    await resend.emails.send({
      from: 'ForgeNursing <support@forgenursing.com>',
      to,
      replyTo: 'support@forgenursing.com',
      subject,
      html,
    })
  } catch (emailError) {
    console.error('[Webhook] Failed to send email:', emailError)
  }
}

async function processWebhookEvent(
  event: Stripe.Event,
  supabase: any,
  stripe: Stripe
): Promise<{ success: boolean; error?: string }> {
  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session
        const userId = await resolveUserIdFromSession(supabase, session)
        const customerId = typeof session.customer === 'string' ? session.customer : null
        const customerEmail = session.customer_details?.email || session.customer_email
        const isRetakePayment = session.mode === 'payment' || session.metadata?.plan === 'retake'

        if (!userId) {
          const error = 'No user ID found - cannot update profile'
          console.error('[Webhook]', error)
          return { success: false, error }
        }

        if (isRetakePayment) {
          if (session.payment_status !== 'paid') {
            console.warn('[Webhook] Retake payment checkout completed without paid status', {
              sessionId: session.id,
              paymentStatus: session.payment_status,
            })
            return { success: true }
          }

          const accessEndsAt = addDays(RETAKE_ACCESS_DAYS)
          const { error: updateError } = await supabase
            .from('profiles')
            .update({
              subscription_status: 'active',
              stripe_customer_id: customerId,
              stripe_subscription_id: null,
              trial_ends_at: accessEndsAt,
              tier_type: 'retake',
              quiz_first_enabled: true,
            })
            .eq('id', userId)

          if (updateError) {
            console.error('[Webhook] Error granting retake pass access:', updateError)
            return {
              success: false,
              error: `Failed to grant retake pass access: ${updateError.message}`,
            }
          }

          await sendEmail(
            customerEmail,
            'Your ForgeNursing Retake Recovery Pass is active',
            retakePassEmailHtml(accessEndsAt)
          )

          return { success: true }
        }

        const subscriptionId = typeof session.subscription === 'string' ? session.subscription : null
        if (!subscriptionId) {
          const error = 'No subscription ID in checkout session'
          console.error('[Webhook]', error)
          return { success: false, error }
        }

        const subscription = await stripe.subscriptions.retrieve(subscriptionId)
        const status = subscription.status === 'trialing' ? 'trialing' : 'active'
        const priceId = subscription.items?.data?.[0]?.price?.id || ''
        const tierType = mapPriceIdToTierType(priceId)

        const profileUpdate: Record<string, any> = {
          subscription_status: status,
          stripe_customer_id: customerId,
          stripe_subscription_id: subscriptionId,
          quiz_first_enabled: true,
        }
        if (tierType) {
          profileUpdate.tier_type = tierType
        }

        const { error: updateError } = await supabase
          .from('profiles')
          .update(profileUpdate)
          .eq('id', userId)

        if (updateError) {
          console.error('[Webhook] Error updating profile:', updateError)
          return {
            success: false,
            error: `Failed to update profile: ${updateError.message}`,
          }
        }

        await sendEmail(
          customerEmail,
          "You're now subscribed to ForgeNursing",
          subscriptionConfirmationEmailHtml()
        )

        return { success: true }
      }

      case 'customer.subscription.created':
      case 'customer.subscription.updated':
      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription
        const customerId = subscription.customer as string

        const { data: profile } = await supabase
          .from('profiles')
          .select('id')
          .eq('stripe_customer_id', customerId)
          .single()

        if (!profile) {
          const error = `No profile found for customer: ${customerId}`
          console.warn('[Webhook]', error)
          return { success: false, error }
        }

        let status: string
        if (subscription.status === 'trialing') {
          status = 'trialing'
        } else if (subscription.status === 'active') {
          status = 'active'
        } else if (subscription.status === 'past_due' || subscription.status === 'unpaid') {
          status = 'past_due'
        } else {
          status = 'expired'
        }

        const priceId = subscription.items?.data?.[0]?.price?.id || ''
        const tierType = mapPriceIdToTierType(priceId)
        const updatePayload: Record<string, any> = {
          subscription_status: status,
          stripe_customer_id: customerId,
          stripe_subscription_id: subscription.id,
        }

        if (tierType) updatePayload.tier_type = tierType
        if (status === 'active' || status === 'trialing') {
          updatePayload.quiz_first_enabled = true
        }

        const { error: updateError } = await supabase
          .from('profiles')
          .update(updatePayload)
          .eq('id', profile.id)

        if (updateError) {
          console.error('[Webhook] Error updating subscription:', updateError)
          return {
            success: false,
            error: `Failed to update subscription: ${updateError.message}`,
          }
        }

        return { success: true }
      }

      default:
        return { success: true }
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    console.error('[Webhook] Error processing event:', error)
    return { success: false, error: errorMessage }
  }
}

export async function POST(req: Request) {
  let event: Stripe.Event | null = null
  let supabase: any = null

  try {
    if (!process.env.STRIPE_SECRET_KEY) {
      console.error('[Webhook] STRIPE_SECRET_KEY is missing')
      return NextResponse.json({ error: 'Stripe is not configured' }, { status: 500 })
    }

    if (!process.env.STRIPE_WEBHOOK_SECRET) {
      console.error('[Webhook] STRIPE_WEBHOOK_SECRET is missing')
      return NextResponse.json({ error: 'Webhook secret not configured' }, { status: 500 })
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !serviceRoleKey) {
      console.error('[Webhook] Missing Supabase configuration')
      return NextResponse.json({ error: 'Server configuration error' }, { status: 500 })
    }

    const body = await req.text()
    const signature = headers().get('stripe-signature')

    if (!signature) {
      console.error('[Webhook] Missing stripe-signature header')
      return NextResponse.json({ error: 'Missing signature' }, { status: 400 })
    }

    const stripe = getStripeClient()
    supabase = createClient<Database>(supabaseUrl, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })

    try {
      event = stripe.webhooks.constructEvent(
        body,
        signature,
        process.env.STRIPE_WEBHOOK_SECRET
      )
    } catch (err) {
      console.error('[Webhook] Signature verification failed:', err)
      return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
    }

    await logWebhookEvent(supabase, event, 'pending')
    await updateWebhookAttempt(supabase, event.id, 'retrying')

    const result = await processWebhookEvent(event, supabase, stripe)

    if (result.success) {
      await updateWebhookAttempt(supabase, event.id, 'succeeded')
      return NextResponse.json({ received: true, success: true })
    }

    await updateWebhookAttempt(supabase, event.id, 'failed', result.error)
    console.error('[Webhook] ❌ Event processing failed:', event.id, result.error)

    return NextResponse.json(
      {
        error: 'Webhook processing failed',
        details: result.error,
        willRetry: true,
      },
      { status: 500 }
    )
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    console.error('[Webhook] Unexpected error:', error)

    if (event && supabase) {
      await updateWebhookAttempt(supabase, event.id, 'failed', errorMessage)
    }

    return NextResponse.json(
      { error: 'Webhook processing failed', details: errorMessage },
      { status: 500 }
    )
  }
}
