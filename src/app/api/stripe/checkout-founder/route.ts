import { NextResponse } from 'next/server'

// Retire new purchases only. Existing subscription webhooks and agreed rates remain supported.
export async function POST() {
  return NextResponse.json({ error: 'This offer has ended. Choose a current plan on Pricing.', pricing_url: '/pricing' }, { status: 410 })
}
