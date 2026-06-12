// Required env vars (set in Vercel Project Settings → Environment Variables):
//   WORK_SAMPLES_PASSWORD — server-side only, gates /work-samples access
//   RESEND_API_KEY        — same key used by log-lead.js / send-transcript.js

import { Resend } from 'resend';

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const { name, email, password } = req.body ?? {};

  if (!name || !email || !password) {
    return res.status(400).json({ ok: false, error: 'Name, email, and password are required.' });
  }

  const expected = process.env.WORK_SAMPLES_PASSWORD;

  // Env var not configured — fail closed with a clear message, never crash
  if (!expected) {
    console.error('[verify-work-samples] WORK_SAMPLES_PASSWORD is not set');
    return res.status(503).json({
      ok: false,
      error: 'Work samples access is not configured yet. Please contact Jaxon directly.',
    });
  }

  if (password !== expected) {
    return res.status(401).json({ ok: false, error: 'Incorrect password.' });
  }

  // Success — notify Jaxon. Fire-and-forget: email failure never blocks access.
  try {
    const resend = new Resend(process.env.RESEND_API_KEY);

    const formattedTime = new Date().toLocaleString('en-US', {
      timeZone: 'America/Los_Angeles',
      timeZoneName: 'short',
    });

    const safeName  = escapeHtml(name);
    const safeEmail = escapeHtml(email);

    await resend.emails.send({
      from: 'AI Interview <notifications@mail.jaxontravis.com>',
      to: 'jaxontravis7@gmail.com',
      subject: `Work Samples Access — ${name}`,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; color: #222;">
          <h2 style="margin-bottom: 4px;">Work Samples Access Granted</h2>
          <hr style="border: none; border-top: 1px solid #ddd; margin: 16px 0;" />
          <table style="border-collapse: collapse; width: 100%;">
            <tr>
              <td style="padding: 8px 0; color: #666; width: 120px;">Name</td>
              <td style="padding: 8px 0; font-weight: 600;">${safeName}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #666;">Email</td>
              <td style="padding: 8px 0;">
                <a href="mailto:${safeEmail}" style="color: #D4A83F;">${safeEmail}</a>
              </td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #666;">Time</td>
              <td style="padding: 8px 0;">${formattedTime}</td>
            </tr>
          </table>
          <hr style="border: none; border-top: 1px solid #ddd; margin: 16px 0;" />
          <p style="color: #999; font-size: 12px; margin: 0;">Sent by jaxontravis.com Work Samples gate</p>
        </div>
      `,
    });
  } catch (err) {
    console.error('[verify-work-samples] Resend error:', err?.message ?? err);
  }

  return res.status(200).json({ ok: true });
}
