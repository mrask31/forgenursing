import { NextResponse } from 'next/server'
import { learningAdmin } from '@/lib/learning/server'
import { trialEmailAuthorized } from '@/lib/emails/trial-engagement'
import { deliverPurchaseEmail, type PurchaseDelivery } from '@/lib/emails/retake-purchase'
export const maxDuration = 60
export async function GET(request: Request) {
  if (!trialEmailAuthorized(request)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (process.env.VERCEL_ENV !== 'production') return NextResponse.json({ skipped: 'production_only' })
  if (!process.env.RESEND_API_KEY) return NextResponse.json({ error: 'Email service not configured' }, { status: 503 })
  const admin = learningAdmin()
  const { data, error } = await admin.from('retake_purchase_emails').select('*').in('status', ['pending', 'sending', 'uncertain']).order('created_at').limit(3)
  if (error) return NextResponse.json({ error: 'Queue unavailable' }, { status: 500 })
  const results: string[] = []
  for (const row of data ?? []) results.push(await deliverPurchaseEmail(admin, row as PurchaseDelivery))
  console.info('[Purchase Queue]', JSON.stringify(results))
  return NextResponse.json({ processed: results.length, results })
}
export const POST = GET
