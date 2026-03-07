// app/api/send-welcome-email/route.js
import { NextResponse } from 'next/server';
import { sendEmail } from '@/lib/email';
import { EMAIL_TEMPLATES } from '@/lib/emailTemplates';

export async function POST(request) {
  try {
    const { email, name } = await request.json();

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    const template = EMAIL_TEMPLATES.welcome(name);

    await sendEmail({
      to: email,
      subject: template.subject,
      htmlContent: template.htmlContent,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error sending welcome email:', error);
    return NextResponse.json({ error: 'Failed to send email' }, { status: 500 });
  }
}