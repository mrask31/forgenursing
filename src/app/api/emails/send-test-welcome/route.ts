import { NextResponse } from 'next/server'
import { Resend } from 'resend'
import { createClient } from '@supabase/supabase-js'

const resend = new Resend(process.env.RESEND_API_KEY)

// Test endpoint to send a welcome email to yourself
// Usage: POST /api/emails/send-test-welcome
// Body: { "email": "your-email@example.com" }

export async function POST(request: Request) {
  try {
    // Simple auth check - only allow in development or with service role key
    const authHeader = request.headers.get('authorization')
    const isDev = process.env.NODE_ENV === 'development'
    const isAuthorized = 
      isDev || 
      authHeader === `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`

    if (!isAuthorized) {
      return NextResponse.json(
        { error: 'Unauthorized - only available in development or with service role key' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { email } = body

    if (!email) {
      return NextResponse.json(
        { error: 'Missing email address' },
        { status: 400 }
      )
    }

    if (!process.env.RESEND_API_KEY) {
      return NextResponse.json(
        { error: 'RESEND_API_KEY not configured' },
        { status: 500 }
      )
    }

    // Calculate trial end date (7 days from now)
    const trialEndsAt = new Date()
    trialEndsAt.setDate(trialEndsAt.getDate() + 7)
    const trialEndDate = trialEndsAt.toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    })

    // Send test email
    const { data, error } = await resend.emails.send({
      from: 'ForgeNursing <welcome@forgenursing.com>',
      to: email,
      subject: '[TEST] You\'re in! Your 7-day ForgeNursing trial starts now 🩺',
      html: generateWelcomeEmailHTML(trialEndDate),
    })

    if (error) {
      console.error('[Test Welcome] Failed to send:', error)
      return NextResponse.json(
        { error: 'Failed to send email', details: error },
        { status: 500 }
      )
    }

    console.log('[Test Welcome] Sent successfully to:', email, 'ID:', data?.id)

    return NextResponse.json({
      success: true,
      emailId: data?.id,
      message: `Test welcome email sent to ${email}`,
      trialEndDate,
    })
  } catch (error: any) {
    console.error('[Test Welcome] Unexpected error:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    )
  }
}

function generateWelcomeEmailHTML(trialEndDate: string): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Welcome to ForgeNursing</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f8fafc; line-height: 1.6;">
  <table role="presentation" style="width: 100%; border-collapse: collapse;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table role="presentation" style="max-width: 600px; width: 100%; background-color: #ffffff; border-radius: 16px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); overflow: hidden;">
          
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%); padding: 40px 30px; text-align: center;">
              <h1 style="margin: 0; color: #ffffff; font-size: 32px; font-weight: 700; letter-spacing: -0.5px;">
                Welcome to the future of NCLEX Prep.
              </h1>
            </td>
          </tr>

          <!-- Main content -->
          <tr>
            <td style="padding: 40px 30px;">
              
              <!-- The 7-Day Promise -->
              <div style="margin-bottom: 32px;">
                <h2 style="margin: 0 0 16px 0; color: #1e293b; font-size: 20px; font-weight: 700;">
                  The 7-Day Promise
                </h2>
                <p style="margin: 0; color: #334155; font-size: 16px; line-height: 1.6;">
                  You now have full, unlimited access to ForgeNursing for the next 7 days. No credit card required, no strings attached.
                </p>
              </div>

              <!-- The 2026 Edge -->
              <div style="margin-bottom: 32px; padding: 24px; background-color: #f1f5f9; border-radius: 12px; border-left: 4px solid #4f46e5;">
                <h2 style="margin: 0 0 12px 0; color: #1e293b; font-size: 18px; font-weight: 700;">
                  The 2026 Edge
                </h2>
                <p style="margin: 0; color: #334155; font-size: 15px; line-height: 1.6;">
                  Our platform is fully updated for the April 2026 NCLEX Test Plan, focusing on the clinical judgment scenarios you'll see on exam day.
                </p>
              </div>

              <!-- The Quick Win CTA -->
              <div style="margin-bottom: 32px;">
                <h2 style="margin: 0 0 20px 0; color: #1e293b; font-size: 20px; font-weight: 700;">
                  The 'Quick Win' CTA
                </h2>
                <table role="presentation" style="width: 100%;">
                  <tr>
                    <td align="center">
                      <a href="https://forgenursing.com/tutor?action=start-quiz" 
                         style="display: inline-block; background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%); color: #ffffff; text-decoration: none; padding: 18px 40px; border-radius: 12px; font-weight: 600; font-size: 18px; box-shadow: 0 4px 12px rgba(79, 70, 229, 0.4);">
                        Take Your First 10-Question Quiz
                      </a>
                    </td>
                  </tr>
                </table>
              </div>

              <!-- Trial Expiration Notice -->
              <div style="margin-top: 40px; padding-top: 24px; border-top: 1px solid #e2e8f0;">
                <p style="margin: 0; color: #64748b; font-size: 14px; text-align: center; line-height: 1.6;">
                  Your trial expires on <strong style="color: #1e293b;">${trialEndDate}</strong>.<br>
                  We'll save all your progress, so you can pick up right where you left off when you're ready to subscribe.
                </p>
              </div>

            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #f8fafc; padding: 30px; text-align: center; border-top: 1px solid #e2e8f0;">
              <p style="margin: 0 0 8px 0; color: #64748b; font-size: 14px;">
                ForgeNursing - Your AI-powered NCLEX prep partner
              </p>
              <p style="margin: 0; color: #94a3b8; font-size: 12px;">
                You're receiving this because you signed up for ForgeNursing
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `
}
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Welcome to ForgeNursing</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f8fafc; line-height: 1.6;">
  <table role="presentation" style="width: 100%; border-collapse: collapse;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table role="presentation" style="max-width: 600px; width: 100%; background-color: #ffffff; border-radius: 16px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); overflow: hidden;">
          
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%); padding: 40px 30px; text-align: center;">
              <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 700;">
                Welcome to ForgeNursing! 🎉
              </h1>
              <p style="margin: 12px 0 0 0; color: #e0e7ff; font-size: 16px;">
                Your 7-day free trial is now active
              </p>
            </td>
          </tr>

          <!-- Main content -->
          <tr>
            <td style="padding: 40px 30px;">
              <p style="margin: 0 0 20px 0; color: #334155; font-size: 16px;">
                Hi there! 👋
              </p>
              
              <p style="margin: 0 0 20px 0; color: #334155; font-size: 16px;">
                You're all set to start building the clinical reasoning skills that will help you ace the NCLEX and become a confident nurse.
              </p>

              <!-- Trial info -->
              <table role="presentation" style="width: 100%; background-color: #f1f5f9; border-radius: 12px; padding: 20px; margin: 30px 0;">
                <tr>
                  <td>
                    <p style="margin: 0 0 8px 0; color: #64748b; font-size: 14px; font-weight: 600; text-transform: uppercase;">
                      Your Trial Details
                    </p>
                    <p style="margin: 0; color: #1e293b; font-size: 18px; font-weight: 600;">
                      Full access until ${trialEndDate}
                    </p>
                    <p style="margin: 8px 0 0 0; color: #64748b; font-size: 14px;">
                      No credit card required • Cancel anytime
                    </p>
                  </td>
                </tr>
              </table>

              <!-- Quick win -->
              <div style="margin: 30px 0;">
                <h2 style="margin: 0 0 16px 0; color: #1e293b; font-size: 20px; font-weight: 700;">
                  🚀 Get Your First Quick Win (2 minutes)
                </h2>
                <p style="margin: 0 0 20px 0; color: #334155; font-size: 16px;">
                  The best way to see ForgeNursing in action is to try a quick practice quiz:
                </p>

                <!-- Steps -->
                <div style="margin: 20px 0;">
                  <div style="margin-bottom: 12px;">
                    <span style="display: inline-block; width: 24px; height: 24px; background-color: #4f46e5; color: #ffffff; border-radius: 50%; text-align: center; line-height: 24px; font-weight: 700; font-size: 14px; margin-right: 12px;">1</span>
                    <span style="color: #334155; font-size: 15px;">Click the button below to start your first quiz</span>
                  </div>
                  <div style="margin-bottom: 12px;">
                    <span style="display: inline-block; width: 24px; height: 24px; background-color: #4f46e5; color: #ffffff; border-radius: 50%; text-align: center; line-height: 24px; font-weight: 700; font-size: 14px; margin-right: 12px;">2</span>
                    <span style="color: #334155; font-size: 15px;">Answer 10 NCLEX-style questions</span>
                  </div>
                  <div>
                    <span style="display: inline-block; width: 24px; height: 24px; background-color: #4f46e5; color: #ffffff; border-radius: 50%; text-align: center; line-height: 24px; font-weight: 700; font-size: 14px; margin-right: 12px;">3</span>
                    <span style="color: #334155; font-size: 15px;">See detailed explanations for each answer</span>
                  </div>
                </div>
              </div>

              <!-- CTA -->
              <table role="presentation" style="width: 100%; margin: 30px 0;">
                <tr>
                  <td align="center">
                    <a href="https://forgenursing.com/tutor?action=start-quiz" 
                       style="display: inline-block; background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%); color: #ffffff; text-decoration: none; padding: 16px 32px; border-radius: 10px; font-weight: 600; font-size: 16px;">
                      Start Your First Quiz →
                    </a>
                  </td>
                </tr>
              </table>

              <!-- Features -->
              <div style="margin: 40px 0 0 0; padding: 30px 0 0 0; border-top: 1px solid #e2e8f0;">
                <h3 style="margin: 0 0 20px 0; color: #1e293b; font-size: 18px; font-weight: 700;">
                  What's included in your trial:
                </h3>
                <div style="margin-bottom: 8px;">
                  <span style="color: #22c55e; font-size: 18px; margin-right: 8px;">✓</span>
                  <span style="color: #334155; font-size: 15px;">Unlimited NCLEX-style practice questions</span>
                </div>
                <div style="margin-bottom: 8px;">
                  <span style="color: #22c55e; font-size: 18px; margin-right: 8px;">✓</span>
                  <span style="color: #334155; font-size: 15px;">AI tutor with step-by-step reasoning</span>
                </div>
                <div style="margin-bottom: 8px;">
                  <span style="color: #22c55e; font-size: 18px; margin-right: 8px;">✓</span>
                  <span style="color: #334155; font-size: 15px;">Upload your notes and textbooks</span>
                </div>
                <div>
                  <span style="color: #22c55e; font-size: 18px; margin-right: 8px;">✓</span>
                  <span style="color: #334155; font-size: 15px;">Track your progress and weak areas</span>
                </div>
              </div>

              <!-- Support -->
              <div style="margin: 30px 0 0 0; padding: 20px; background-color: #fef3c7; border-radius: 10px; border-left: 4px solid #f59e0b;">
                <p style="margin: 0; color: #92400e; font-size: 14px;">
                  <strong>Need help?</strong> Reply to this email anytime. We're here to help you succeed!
                </p>
              </div>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #f8fafc; padding: 30px; text-align: center; border-top: 1px solid #e2e8f0;">
              <p style="margin: 0 0 8px 0; color: #64748b; font-size: 14px;">
                ForgeNursing - Your AI-powered NCLEX prep partner
              </p>
              <p style="margin: 0; color: #94a3b8; font-size: 12px;">
                You're receiving this because you signed up for ForgeNursing
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `
}
