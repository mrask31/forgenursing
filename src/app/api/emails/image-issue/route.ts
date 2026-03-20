import { NextRequest, NextResponse } from 'next/server';
import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(req: NextRequest) {
  try {
    // Authenticate user
    const cookieStore = cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) { return cookieStore.get(name)?.value },
          set(name: string, value: string, options: CookieOptions) { cookieStore.set(name, value, options) },
          remove(name: string, options: CookieOptions) { cookieStore.delete({ name, ...options }) },
        },
      }
    );

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { sessionId } = body;

    // Get user profile for name
    const { data: profile } = await supabase
      .from('profiles')
      .select('preferred_name, program_track')
      .eq('id', user.id)
      .single();

    const userName = profile?.preferred_name || 'Unknown';
    const userEmail = user.email || 'No email';
    const timestamp = new Date().toISOString();

    const { error: emailError } = await resend.emails.send({
      from: 'support@forgenursing.com',
      to: 'support@forgenursing.com',
      subject: 'Image Upload Issue',
      html: `
        <h2>Image Upload Issue Report</h2>
        <table style="border-collapse:collapse;width:100%">
          <tr><td style="padding:8px;font-weight:bold">Student</td><td style="padding:8px">${userName}</td></tr>
          <tr><td style="padding:8px;font-weight:bold">Email</td><td style="padding:8px">${userEmail}</td></tr>
          <tr><td style="padding:8px;font-weight:bold">Session ID</td><td style="padding:8px">${sessionId || 'N/A'}</td></tr>
          <tr><td style="padding:8px;font-weight:bold">Program</td><td style="padding:8px">${profile?.program_track || 'N/A'}</td></tr>
          <tr><td style="padding:8px;font-weight:bold">Timestamp</td><td style="padding:8px">${timestamp}</td></tr>
          <tr><td style="padding:8px;font-weight:bold">User ID</td><td style="padding:8px">${user.id}</td></tr>
        </table>
        <p style="margin-top:16px;color:#666">This report was auto-generated when a student clicked the support link after an image failed to attach.</p>
      `,
    });

    if (emailError) {
      console.error('[ImageIssue] Email send error:', emailError);
      return NextResponse.json({ error: 'Failed to send report' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('[ImageIssue] Error:', error?.message);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
