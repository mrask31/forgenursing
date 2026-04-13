/**
 * Email templates for the onboarding and beta re-engagement sequences.
 * Each function returns { subject, html } with inline CSS, table-based layout
 * for email client compatibility, gradient headers, and CTA buttons.
 *
 * Brand colors: teal (#0D8F9C), navy (#0B2545)
 */

const LOGIN_URL = 'https://app.forgenursing.com'
const PRICING_URL = 'https://app.forgenursing.com/pricing'

function emailShell(headerHtml: string, bodyHtml: string, footerNote: string): string {
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>ForgeNursing</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f8fafc; line-height: 1.6;">
  <table role="presentation" style="width: 100%; border-collapse: collapse;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table role="presentation" style="max-width: 600px; width: 100%; background-color: #ffffff; border-radius: 16px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); overflow: hidden;">
          <!-- Header -->
          <tr>
            ${headerHtml}
          </tr>
          <!-- Body -->
          <tr>
            <td style="padding: 40px 30px;">
              ${bodyHtml}
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="background-color: #f8fafc; padding: 30px; text-align: center; border-top: 1px solid #e2e8f0;">
              <p style="margin: 0 0 8px 0; color: #64748b; font-size: 14px;">
                ForgeNursing — Your AI-powered NCLEX prep partner
              </p>
              <p style="margin: 0; color: #94a3b8; font-size: 12px;">
                ${footerNote}
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`
}

function ctaButton(text: string, href: string): string {
  return `<table role="presentation" style="width: 100%; margin: 32px 0;">
                <tr>
                  <td align="center">
                    <a href="${href}"
                       style="display: inline-block; background: linear-gradient(135deg, #0D8F9C 0%, #0B2545 100%); color: #ffffff; text-decoration: none; padding: 16px 32px; border-radius: 10px; font-weight: 600; font-size: 16px; box-shadow: 0 4px 6px rgba(13, 143, 156, 0.3);">
                      ${text}
                    </a>
                  </td>
                </tr>
              </table>`
}

// ---------------------------------------------------------------------------
// Template 1: Onboarding Day 0 — Welcome
// ---------------------------------------------------------------------------

export function getOnboardingDay0Email(): { subject: string; html: string } {
  const subject = "Welcome to ForgeNursing — here's how to get started."

  const headerHtml = `<td style="background: linear-gradient(135deg, #0D8F9C 0%, #0B2545 100%); padding: 40px 30px; text-align: center;">
              <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 700; letter-spacing: -0.5px;">
                Welcome to ForgeNursing! 🎉
              </h1>
              <p style="margin: 12px 0 0 0; color: #cce8eb; font-size: 16px;">
                Your NCLEX prep journey starts now
              </p>
            </td>`

  const bodyHtml = `<p style="margin: 0 0 20px 0; color: #334155; font-size: 16px;">
                Hi there! 👋
              </p>
              <p style="margin: 0 0 20px 0; color: #334155; font-size: 16px;">
                We're so glad you're here. ForgeNursing uses a Socratic tutoring approach — instead of just giving you answers, our AI tutor asks guiding questions that help you think through clinical scenarios the way a real nurse would. It's the same method top nursing educators use, and it builds the deep reasoning skills the NCLEX actually tests.
              </p>
              <p style="margin: 0 0 20px 0; color: #334155; font-size: 16px;">
                You have a full 7-day free trial to explore everything. The best way to start is to jump in and try your first session.
              </p>
              ${ctaButton('Start Your First Session →', LOGIN_URL)}
              <div style="margin: 30px 0 0 0; padding: 20px; background-color: #e6f7f8; border-radius: 10px; border-left: 4px solid #0D8F9C;">
                <p style="margin: 0; color: #0B2545; font-size: 14px;">
                  <strong>Need help?</strong> Just reply to this email — we read every message.
                </p>
              </div>`

  return { subject, html: emailShell(headerHtml, bodyHtml, "You're receiving this because you signed up for ForgeNursing.") }
}

// ---------------------------------------------------------------------------
// Template 2: Onboarding Day 3 — Trial Reminder
// ---------------------------------------------------------------------------

export function getOnboardingDay3Email(): { subject: string; html: string } {
  const subject = 'Still thinking about it?'

  const headerHtml = `<td style="background: linear-gradient(135deg, #0D8F9C 0%, #0B2545 100%); padding: 40px 30px; text-align: center;">
              <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 700; letter-spacing: -0.5px;">
                Your trial is still running ⏳
              </h1>
            </td>`

  const bodyHtml = `<p style="margin: 0 0 20px 0; color: #334155; font-size: 16px;">
                Hey — just a quick heads-up that your 7-day ForgeNursing trial is still active. You haven't logged in yet, and we'd hate for you to miss out.
              </p>
              <p style="margin: 0 0 20px 0; color: #334155; font-size: 16px;">
                It only takes a couple of minutes to try your first practice session and see how the Socratic tutoring approach works.
              </p>
              ${ctaButton('Log In & Try It Out →', LOGIN_URL)}`

  return { subject, html: emailShell(headerHtml, bodyHtml, "You're receiving this because you started a ForgeNursing trial.") }
}

// ---------------------------------------------------------------------------
// Template 3: Onboarding Day 6 — Trial Expiration Warning
// ---------------------------------------------------------------------------

export function getOnboardingDay6Email(): { subject: string; html: string } {
  const subject = 'Your trial ends tomorrow.'

  const headerHtml = `<td style="background: linear-gradient(135deg, #0B2545 0%, #0D8F9C 100%); padding: 40px 30px; text-align: center;">
              <div style="font-size: 48px; margin-bottom: 12px;">⏳</div>
              <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 700; letter-spacing: -0.5px;">
                Your Trial Ends Tomorrow
              </h1>
            </td>`

  const bodyHtml = `<p style="margin: 0 0 20px 0; color: #334155; font-size: 16px;">
                After tomorrow, you'll lose access to unlimited NCLEX practice questions, AI-powered Socratic tutoring, and your progress tracking.
              </p>
              <p style="margin: 0 0 20px 0; color: #334155; font-size: 16px;">
                If ForgeNursing is helping you prepare, now is the time to lock in a plan so you don't lose momentum.
              </p>
              ${ctaButton('View Pricing & Subscribe →', PRICING_URL)}
              <table role="presentation" style="width: 100%; margin: 0 0 20px 0;">
                <tr>
                  <td align="center">
                    <a href="${LOGIN_URL}" style="color: #0D8F9C; font-size: 14px; text-decoration: underline;">
                      Or log in to keep using your trial while it lasts
                    </a>
                  </td>
                </tr>
              </table>`

  return { subject, html: emailShell(headerHtml, bodyHtml, "You're receiving this because your ForgeNursing trial is ending soon.") }
}

// ---------------------------------------------------------------------------
// Template 4: Beta Day 7 — Re-engagement
// ---------------------------------------------------------------------------

export function getBetaDay7ReengagementEmail(): { subject: string; html: string } {
  const subject = 'Are you getting value from ForgeNursing?'

  const headerHtml = `<td style="background: linear-gradient(135deg, #0D8F9C 0%, #0B2545 100%); padding: 40px 30px; text-align: center;">
              <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 700; letter-spacing: -0.5px;">
                Quick check-in 💬
              </h1>
            </td>`

  const bodyHtml = `<p style="margin: 0 0 20px 0; color: #334155; font-size: 16px;">
                Hey — it's been about a week since you joined the ForgeNursing beta, and I noticed you haven't had a chance to dive in yet.
              </p>
              <p style="margin: 0 0 20px 0; color: #334155; font-size: 16px;">
                No pressure at all — I just wanted to ask: is something getting in the way? Whether it's a confusing setup, not enough time, or the tool just isn't what you expected, I'd genuinely love to hear about it.
              </p>
              <p style="margin: 0 0 20px 0; color: #334155; font-size: 16px;">
                Just hit reply and let me know. Every piece of feedback helps us build something better for nursing students like you.
              </p>
              <p style="margin: 0 0 4px 0; color: #334155; font-size: 16px;">
                Thanks for being part of this,
              </p>
              <p style="margin: 0 0 20px 0; color: #0B2545; font-size: 16px; font-weight: 600;">
                — The ForgeNursing Team
              </p>
              <div style="margin: 20px 0 0 0; padding: 20px; background-color: #e6f7f8; border-radius: 10px; border-left: 4px solid #0D8F9C;">
                <p style="margin: 0; color: #0B2545; font-size: 14px;">
                  <strong>P.S.</strong> If you want to give it another shot, just <a href="${LOGIN_URL}" style="color: #0D8F9C; text-decoration: underline;">log in here</a> — everything is ready for you.
                </p>
              </div>`

  return { subject, html: emailShell(headerHtml, bodyHtml, "You're receiving this because you're part of the ForgeNursing beta.") }
}

// ---------------------------------------------------------------------------
// Lookup function
// ---------------------------------------------------------------------------

export function getEmailTemplate(emailType: string): { subject: string; html: string } {
  switch (emailType) {
    case 'onboarding_day_0':
      return getOnboardingDay0Email()
    case 'onboarding_day_3':
      return getOnboardingDay3Email()
    case 'onboarding_day_6':
      return getOnboardingDay6Email()
    case 'beta_day_7_reengagement':
      return getBetaDay7ReengagementEmail()
    default:
      throw new Error(`Unknown email type: ${emailType}`)
  }
}
