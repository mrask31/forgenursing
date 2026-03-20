import { NextResponse } from 'next/server'
import { Resend } from 'resend'
import { createClient } from '@supabase/supabase-js'

const resend = new Resend(process.env.RESEND_API_KEY)

// Verify request is from Supabase using service role key
function verifySupabaseRequest(authHeader: string | null): boolean {
  if (!authHeader) return false
  const token = authHeader.replace('Bearer ', '')
  return token === process.env.SUPABASE_SERVICE_ROLE_KEY
}

export async function POST(request: Request) {
  try {
    // Verify the request is from Supabase
    const authHeader = request.headers.get('authorization')
    if (!verifySupabaseRequest(authHeader)) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { userId, email } = body

    if (!userId || !email) {
      return NextResponse.json(
        { error: 'Missing required fields: userId, email' },
        { status: 400 }
      )
    }

    // Check if RESEND_API_KEY is configured
    if (!process.env.RESEND_API_KEY) {
      console.error('[Welcome Email] RESEND_API_KEY not configured')
      return NextResponse.json(
        { error: 'Email service not configured' },
        { status: 500 }
      )
    }

    // Get trial end date from database
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const { data: profile } = await supabase
      .from('profiles')
      .select('trial_ends_at')
      .eq('id', userId)
      .single()

    const trialEndsAt = profile?.trial_ends_at 
      ? new Date(profile.trial_ends_at)
      : null

    const trialEndDate = trialEndsAt 
      ? trialEndsAt.toLocaleDateString('en-US', { 
          month: 'long', 
          day: 'numeric', 
          year: 'numeric' 
        })
      : 'in 7 days'

    // Send welcome email
    const { data, error } = await resend.emails.send({
      from: 'ForgeNursing <welcome@forgenursing.com>',
      to: email,
      subject: 'You\'re in! Your 7-day ForgeNursing trial starts now 🩺',
      html: `
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
          
          <!-- Header with gradient -->
          <tr>
            <td style="background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%); padding: 40px 30px; text-align: center;">
              <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 700; letter-spacing: -0.5px;">
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

              <!-- Trial info box -->
              <table role="presentation" style="width: 100%; background-color: #f1f5f9; border-radius: 12px; padding: 20px; margin: 30px 0;">
                <tr>
                  <td>
                    <p style="margin: 0 0 8px 0; color: #64748b; font-size: 14px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">
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

              <!-- Quick win section -->
              <div style="margin: 30px 0;">
                <h2 style="margin: 0 0 16px 0; color: #1e293b; font-size: 20px; font-weight: 700;">
                  🚀 Get Your First Quick Win (2 minutes)
                </h2>
                <p style="margin: 0 0 20px 0; color: #334155; font-size: 16px;">
                  The best way to see ForgeNursing in action is to try a quick practice quiz:
                </p>

                <!-- Steps -->
                <table role="presentation" style="width: 100%;">
                  <tr>
                    <td style="padding: 12px 0;">
                      <table role="presentation" style="width: 100%;">
                        <tr>
                          <td style="width: 32px; vertical-align: top;">
                            <div style="width: 24px; height: 24px; background-color: #4f46e5; color: #ffffff; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 14px; text-align: center; line-height: 24px;">
                              1
                            </div>
                          </td>
                          <td style="padding-left: 12px; color: #334155; font-size: 15px;">
                            Click the button below to start your first quiz
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding: 12px 0;">
                      <table role="presentation" style="width: 100%;">
                        <tr>
                          <td style="width: 32px; vertical-align: top;">
                            <div style="width: 24px; height: 24px; background-color: #4f46e5; color: #ffffff; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 14px; text-align: center; line-height: 24px;">
                              2
                            </div>
                          </td>
                          <td style="padding-left: 12px; color: #334155; font-size: 15px;">
                            Answer 10 NCLEX-style questions
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding: 12px 0;">
                      <table role="presentation" style="width: 100%;">
                        <tr>
                          <td style="width: 32px; vertical-align: top;">
                            <div style="width: 24px; height: 24px; background-color: #4f46e5; color: #ffffff; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 14px; text-align: center; line-height: 24px;">
                              3
                            </div>
                          </td>
                          <td style="padding-left: 12px; color: #334155; font-size: 15px;">
                            See detailed explanations for each answer
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>
                </table>
              </div>

              <!-- CTA Button -->
              <table role="presentation" style="width: 100%; margin: 30px 0;">
                <tr>
                  <td align="center">
                    <a href="https://forgenursing.com/tutor?action=start-quiz" 
                       style="display: inline-block; background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%); color: #ffffff; text-decoration: none; padding: 16px 32px; border-radius: 10px; font-weight: 600; font-size: 16px; box-shadow: 0 4px 6px rgba(79, 70, 229, 0.3);">
                      Start Your First Quiz →
                    </a>
                  </td>
                </tr>
              </table>

              <!-- What's included -->
              <div style="margin: 40px 0 0 0; padding: 30px 0 0 0; border-top: 1px solid #e2e8f0;">
                <h3 style="margin: 0 0 20px 0; color: #1e293b; font-size: 18px; font-weight: 700;">
                  What's included in your trial:
                </h3>
                <table role="presentation" style="width: 100%;">
                  <tr>
                    <td style="padding: 8px 0;">
                      <span style="color: #22c55e; font-size: 18px; margin-right: 8px;">✓</span>
                      <span style="color: #334155; font-size: 15px;">Unlimited NCLEX-style practice questions</span>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0;">
                      <span style="color: #22c55e; font-size: 18px; margin-right: 8px;">✓</span>
                      <span style="color: #334155; font-size: 15px;">AI tutor with step-by-step reasoning</span>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0;">
                      <span style="color: #22c55e; font-size: 18px; margin-right: 8px;">✓</span>
                      <span style="color: #334155; font-size: 15px;">Upload your notes and textbooks</span>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0;">
                      <span style="color: #22c55e; font-size: 18px; margin-right: 8px;">✓</span>
                      <span style="color: #334155; font-size: 15px;">Track your progress and weak areas</span>
                    </td>
                  </tr>
                </table>
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
      `,
    })

    if (error) {
      console.error('[Welcome Email] Failed to send:', error)
      return NextResponse.json(
        { error: 'Failed to send email', details: error },
        { status: 500 }
      )
    }


    return NextResponse.json({
      success: true,
      emailId: data?.id,
      message: 'Welcome email sent successfully',
    })
  } catch (error: any) {
    console.error('[Welcome Email] Unexpected error:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    )
  }
}
