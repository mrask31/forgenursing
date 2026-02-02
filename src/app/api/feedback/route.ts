import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      console.error('[Feedback API] No authenticated user')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { whatYouLove, whatsFrustrating, featureRequest, email, rating } = body

    console.log('[Feedback API] Attempting to insert feedback:', {
      userId: user.id,
      hasLove: !!whatYouLove,
      hasFrustrating: !!whatsFrustrating,
      hasFeature: !!featureRequest,
      hasEmail: !!email,
      rating,
    })

    // Insert feedback into database
    const { data, error } = await supabase
      .from('feedback')
      .insert({
        user_id: user.id,
        what_you_love: whatYouLove || null,
        whats_frustrating: whatsFrustrating || null,
        feature_request: featureRequest || null,
        email: email || null,
        rating: rating || null,
      })
      .select()

    if (error) {
      console.error('[Feedback API] Error inserting feedback:', {
        message: error.message,
        code: error.code,
        details: error.details,
        hint: error.hint,
      })
      return NextResponse.json({ 
        error: 'Failed to save feedback', 
        details: error.message 
      }, { status: 500 })
    }

    console.log('[Feedback API] Feedback saved successfully:', data)
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[Feedback API] Unexpected error:', error)
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
