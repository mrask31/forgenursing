import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { whatYouLove, whatsFrustrating, featureRequest, email, rating } = body

    // Insert feedback into database
    const { error } = await supabase
      .from('feedback')
      .insert({
        user_id: user.id,
        what_you_love: whatYouLove || null,
        whats_frustrating: whatsFrustrating || null,
        feature_request: featureRequest || null,
        email: email || null,
        rating: rating || null,
      })

    if (error) {
      console.error('[Feedback API] Error inserting feedback:', error)
      return NextResponse.json({ error: 'Failed to save feedback' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[Feedback API] Unexpected error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
