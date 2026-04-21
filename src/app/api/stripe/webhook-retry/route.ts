import { NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database'

function getStripeClient(): Stripe {
  if (!process.env.STRIPE_SECRET_KEY) {
    throw new Error('STRIPE_SECRET_KEY is not configured')
  }
  return new Stripe(process.env.STRIPE_SECRET_KEY, {
    apiVersion: '2025-12-15.clover',
  })
}

export const dynamic = 'force-dynamic'

// Map Stripe price ID to tier_type
function mapPriceIdToTierType(priceId: string): string | null {
  if (!priceId) return null
  const monthlyIds = [process.env.NEXT_PUBLIC_STRIPE_PRICE_MONTHLY, process.env.STRIPE_PRICE_MONTHLY_FOUNDER].filter(Boolean)
  const semesterIds = [process.env.NEXT_PUBLIC_STRIPE_PRICE_SEMESTER, process.env.STRIPE_PRICE_SEMESTER_FOUNDER].filter(Boolean)
  const annualIds = [process.env.NEXT_PUBLIC_STRIPE_PRICE_ANNUAL, process.env.STRIPE_PRICE_ANNUAL_FOUNDER].filter(Boolean)
  if (monthlyIds.includes(priceId)) return 'monthly'
  if (semesterIds.includes(priceId)) return 'semester'
  if (annualIds.includes(priceId)) return 'annual'
  return null
}

// Import the processing logic from webhook route
async function processWebhookEvent(
  event: Stripe.Event,
  supabase: any,
  stripe: Stripe
): Promise<{ success: boolean; error?: string }> {
  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session
        
        let userId = session.client_reference_id
        const customerId = session.customer as string

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

        if (!userId) {
          return { success: false, error: 'No user ID found' }
        }

        const subscriptionId = session.subscription as string
        if (!subscriptionId) {
          return { success: false, error: 'No subscription ID' }
        }

        const subscription = await stripe.subscriptions.retrieve(subscriptionId)
        const status = subscription.status === 'trialing' ? 'trialing' : 'active'

        const priceId = subscription.items?.data?.[0]?.price?.id || ''
        const tierType = mapPriceIdToTierType(priceId)

        const profileUpdate: Record<string, any> = {
          subscription_status: status,
          stripe_customer_id: customerId,
          stripe_subscription_id: subscriptionId,
        }
        if (tierType) profileUpdate.tier_type = tierType

        const { error: updateError } = await supabase
          .from('profiles')
          .update(profileUpdate)
          .eq('id', userId)

        if (updateError) {
          return { success: false, error: updateError.message }
        }

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
          return { success: false, error: 'No profile found' }
        }

        let status: string
        if (subscription.status === 'trialing') {
          status = 'trialing'
        } else if (subscription.status === 'active') {
          status = 'active'
        } else {
          status = 'expired'
        }

        const { error: updateError } = await supabase
          .from('profiles')
          .update({
            subscription_status: status,
            stripe_customer_id: customerId,
            stripe_subscription_id: subscription.id,
          })
          .eq('id', profile.id)

        if (updateError) {
          return { success: false, error: updateError.message }
        }

        return { success: true }
      }

      default:
        return { success: true }
    }
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }
  }
}

// Webhook retry endpoint - should be called by cron job or manually
export async function POST(req: Request) {
  try {
    // Verify authorization (use a secret token)
    const authHeader = req.headers.get('authorization')
    const expectedToken = process.env.WEBHOOK_RETRY_SECRET || process.env.SUPABASE_SERVICE_ROLE_KEY
    const cronSecret = process.env.CRON_SECRET
    
    if (!authHeader || (
      authHeader !== `Bearer ${expectedToken}` &&
      (!cronSecret || authHeader !== `Bearer ${cronSecret}`)
    )) {
      console.error('[Webhook Retry] Unauthorized request')
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    
    if (!supabaseUrl || !serviceRoleKey) {
      return NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500 }
      )
    }

    const supabase: any = createClient<Database>(supabaseUrl, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })

    const stripe = getStripeClient()

    // Get failed webhooks that need retry
    const { data: failedWebhooks, error: fetchError } = await supabase
      .rpc('get_webhooks_for_retry', {
        max_attempts: 5,
        retry_delay_minutes: 5
      })

    if (fetchError) {
      console.error('[Webhook Retry] Error fetching failed webhooks:', fetchError)
      return NextResponse.json(
        { error: 'Failed to fetch webhooks', details: fetchError.message },
        { status: 500 }
      )
    }

    if (!failedWebhooks || failedWebhooks.length === 0) {
      return NextResponse.json({ 
        message: 'No webhooks to retry',
        processed: 0 
      })
    }


    const results = {
      total: failedWebhooks.length,
      succeeded: 0,
      failed: 0,
      errors: [] as string[]
    }

    // Process each failed webhook
    for (const webhook of failedWebhooks) {
      try {

        // Reconstruct the Stripe event from stored payload
        const event = webhook.payload as Stripe.Event

        // Update attempt count
        await supabase
          .from('webhook_events')
          .update({
            status: 'retrying',
            attempt_count: webhook.attempt_count + 1,
            last_attempt_at: new Date().toISOString(),
          })
          .eq('id', webhook.id)

        // Process the event
        const result = await processWebhookEvent(event, supabase, stripe)

        if (result.success) {
          // Mark as succeeded
          await supabase
            .from('webhook_events')
            .update({
              status: 'succeeded',
              succeeded_at: new Date().toISOString(),
              last_error: null,
            })
            .eq('id', webhook.id)

          results.succeeded++
        } else {
          // Mark as failed
          await supabase
            .from('webhook_events')
            .update({
              status: 'failed',
              last_error: result.error || 'Unknown error',
            })
            .eq('id', webhook.id)

          results.failed++
          results.errors.push(`${webhook.stripe_event_id}: ${result.error}`)
          console.error(`[Webhook Retry] ❌ Failed to retry ${webhook.stripe_event_id}:`, result.error)
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error'
        results.failed++
        results.errors.push(`${webhook.stripe_event_id}: ${errorMessage}`)
        console.error(`[Webhook Retry] Error processing ${webhook.stripe_event_id}:`, error)

        // Update with error
        await supabase
          .from('webhook_events')
          .update({
            status: 'failed',
            last_error: errorMessage,
          })
          .eq('id', webhook.id)
      }
    }


    return NextResponse.json({
      message: 'Webhook retry job complete',
      ...results
    })

  } catch (error) {
    console.error('[Webhook Retry] Unexpected error:', error)
    return NextResponse.json(
      { 
        error: 'Webhook retry job failed', 
        details: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    )
  }
}

// GET endpoint to check retry job status
export async function GET(req: Request) {
  try {
    // Verify authorization
    const authHeader = req.headers.get('authorization')
    const expectedToken = process.env.WEBHOOK_RETRY_SECRET || process.env.SUPABASE_SERVICE_ROLE_KEY
    const cronSecret = process.env.CRON_SECRET
    
    if (!authHeader || (
      authHeader !== `Bearer ${expectedToken}` &&
      (!cronSecret || authHeader !== `Bearer ${cronSecret}`)
    )) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    
    if (!supabaseUrl || !serviceRoleKey) {
      return NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500 }
      )
    }

    const supabase: any = createClient<Database>(supabaseUrl, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })

    // Get webhook statistics
    const { data: stats, error } = await supabase.rpc('get_webhook_stats')

    if (error) {
      return NextResponse.json(
        { error: 'Failed to fetch stats', details: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      stats: stats?.[0] || {},
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    return NextResponse.json(
      { 
        error: 'Failed to get status', 
        details: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    )
  }
}
