// Required env vars (set in Vercel Project Settings → Environment Variables):
//   RESEND_API_KEY — server-side only, no VITE_ prefix (same pattern as ANTHROPIC_API_KEY)

import { Resend } from 'resend';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const { name, company, email, jobUrl, timestamp } = req.body ?? {};

  // Always log for debugging regardless of email outcome
  console.log('[log-lead]', JSON.stringify({ name, company, email, jobUrl, timestamp }));

  try {
    const resend = new Resend(process.env.RESEND_API_KEY);

    const formattedTime = timestamp
      ? new Date(timestamp).toLocaleString('en-US', { timeZone: 'America/Los_Angeles', timeZoneName: 'short' })
      : 'Unknown';

    await resend.emails.send({
      from: 'Jaxon Travis AI Interview <notifications@mail.jaxontravis.com>',
      to: 'jaxontravis7@gmail.com',
      replyTo: 'jaxontravis7@gmail.com',
      subject: `New AI Interview Session — ${company || 'Unknown Company'}`,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; color: #222;">
          <h2 style="margin-bottom: 4px;">New AI Interview Session</h2>
          <hr style="border: none; border-top: 1px solid #ddd; margin: 16px 0;" />
          <table style="border-collapse: collapse; width: 100%;">
            <tr>
              <td style="padding: 8px 0; color: #666; width: 120px;">Name</td>
              <td style="padding: 8px 0; font-weight: 600;">${name || '—'}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #666;">Company</td>
              <td style="padding: 8px 0; font-weight: 600;">${company || '—'}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #666;">Email</td>
              <td style="padding: 8px 0;">
                <a href="mailto:${email}" style="color: #D4A83F;">${email || '—'}</a>
              </td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #666;">Job URL</td>
              <td style="padding: 8px 0;">
                ${jobUrl
                  ? `<a href="${jobUrl}" style="color: #D4A83F; word-break: break-all;">${jobUrl}</a>`
                  : '—'}
              </td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #666;">Time</td>
              <td style="padding: 8px 0;">${formattedTime}</td>
            </tr>
          </table>
          <hr style="border: none; border-top: 1px solid #ddd; margin: 16px 0;" />
          <p style="color: #999; font-size: 12px; margin: 0;">Sent by jaxontravis.com AI Interview gate</p>
        </div>
      `,
    });
  } catch (err) {
    // Fire-and-forget — email failure never blocks the gate submission
    console.error('[log-lead] Resend error:', err?.message ?? err);
  }

  res.status(200).json({ ok: true });
}
