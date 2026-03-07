// lib/email.js
// Deploy to: src/lib/email.js
//
// Unified Brevo transactional email sender.
// Handles both string and array `to`, and accepts `html` or `htmlContent`.

const BREVO_API_URL = 'https://api.brevo.com/v3/smtp/email';

/**
 * sendEmail({ to, subject, html, htmlContent, from })
 *
 * @param {string|{email:string,name?:string}|Array} to
 *   A single email string, a single {email, name} object, or an array of them.
 * @param {string} subject
 * @param {string} [html]         HTML body (alias for htmlContent)
 * @param {string} [htmlContent]  HTML body (Brevo native field name)
 * @param {string} [from]         Sender address (defaults to hello@launchpard.com)
 */
export async function sendEmail({
  to,
  subject,
  html,
  htmlContent,
  from = 'hello@launchpard.com',
}) {
  // Normalise `to` → always an array of {email, name?}
  const recipients = normaliseRecipients(to);

  if (!recipients.length) {
    throw new Error('sendEmail: no valid recipients supplied');
  }

  const body = htmlContent ?? html;
  if (!body) {
    throw new Error('sendEmail: no html/htmlContent supplied');
  }

  try {
    const res = await fetch(BREVO_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'api-key': process.env.BREVO_API_KEY,
      },
      body: JSON.stringify({
        sender:      { email: from, name: 'LaunchPard' },
        to:          recipients,
        subject,
        htmlContent: body,
      }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message ?? `Brevo error ${res.status}`);
    }
    console.log(`✅ Email sent → ${recipients.map(r => r.email).join(', ')}`);
  } catch (error) {
    console.error('❌ Brevo email error:', error);
    throw error;
  }
}

// ── helpers ──────────────────────────────────────────────────────────────────

function normaliseRecipients(to) {
  if (!to) return [];

  // Already an array
  if (Array.isArray(to)) {
    return to.map(r => {
      if (typeof r === 'string') return { email: r };
      if (r?.email)              return { email: r.email, name: r.name };
      return null;
    }).filter(Boolean);
  }

  // Single object {email, name?}
  if (typeof to === 'object' && to.email) {
    return [{ email: to.email, name: to.name }];
  }

  // Plain string
  if (typeof to === 'string') {
    return [{ email: to }];
  }

  return [];
}