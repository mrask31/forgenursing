import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

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


    // Send email notification
    try {
      const notificationEmail = process.env.FEEDBACK_NOTIFICATION_EMAIL
      
      if (notificationEmail && process.env.RESEND_API_KEY) {
        const ratingStars = rating ? '⭐'.repeat(rating) : 'Not rated'
        
        await resend.emails.send({
          from: 'ForgeNursing Feedback <feedback@forgenursing.com>',
          to: notificationEmail,
          subject: `New Feedback Submission ${rating ? `(${rating}/5 stars)` : ''}`,
          html: `
            <div style="font-family: system-ui, -apple-system, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
              <h2 style="color: #4f46e5; margin-bottom: 20px;">New Feedback Received</h2>
              
              <div style="background: #f8fafc; border-left: 4px solid #4f46e5; padding: 16px; margin-bottom: 20px;">
                <strong style="color: #1e293b;">Rating:</strong> ${ratingStars}
              </div>

              ${whatYouLove ? `
                <div style="margin-bottom: 20px;">
                  <h3 style="color: #059669; margin-bottom: 8px;">❤️ What they love:</h3>
                  <p style="color: #334155; line-height: 1.6; white-space: pre-wrap;">${whatYouLove}</p>
                </div>
              ` : ''}

              ${whatsFrustrating ? `
                <div style="margin-bottom: 20px;">
                  <h3 style="color: #dc2626; margin-bottom: 8px;">🤔 What's frustrating:</h3>
                  <p style="color: #334155; line-height: 1.6; white-space: pre-wrap;">${whatsFrustrating}</p>
                </div>
              ` : ''}

              ${featureRequest ? `
                <div style="margin-bottom: 20px;">
                  <h3 style="color: #7c3aed; margin-bottom: 8px;">💡 Feature request:</h3>
                  <p style="color: #334155; line-height: 1.6; white-space: pre-wrap;">${featureRequest}</p>
                </div>
              ` : ''}

              ${email ? `
                <div style="background: #f1f5f9; padding: 12px; border-radius: 6px; margin-top: 20px;">
                  <strong style="color: #475569;">Contact email:</strong> 
                  <a href="mailto:${email}" style="color: #4f46e5;">${email}</a>
                </div>
              ` : ''}

              <div style="margin-top: 24px; padding-top: 20px; border-top: 1px solid #e2e8f0; color: #64748b; font-size: 14px;">
                <p>User ID: ${user.id}</p>
                <p>Submitted: ${new Date().toLocaleString()}</p>
              </div>
            </div>
          `,
        })
        
      } else {
      }
    } catch (emailError) {
      // Don't fail the request if email fails
      console.error('[Feedback API] Failed to send email notification:', emailError)
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[Feedback API] Unexpected error:', error)
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
