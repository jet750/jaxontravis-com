import Anthropic from '@anthropic-ai/sdk';
import { Resend } from 'resend';

function extractText(content) {
  if (typeof content === 'string') return content;
  if (Array.isArray(content)) {
    return content
      .filter(c => c.type === 'text')
      .map(c => c.text)
      .join('');
  }
  return '';
}

function escapeHtml(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function buildTranscriptHtml(messages) {
  return messages.map(m => {
    const isRecruiter = m.role === 'user';
    const label = isRecruiter ? 'Recruiter' : "Jaxon's AI";
    const rawText = extractText(m.content);
    const safeText = escapeHtml(rawText).replace(/\n/g, '<br>');

    const bg = isRecruiter ? '#f7f4ef' : '#1e1b18';
    const fg = isRecruiter ? '#2a2520' : '#f0ebe2';
    const labelColor = '#D4A83F';

    return `
      <div style="background:${bg};color:${fg};border-radius:8px;padding:14px 18px;margin-bottom:12px;">
        <div style="font-size:11px;font-weight:700;letter-spacing:0.12em;text-transform:uppercase;color:${labelColor};font-family:sans-serif;margin-bottom:6px;">${label}</div>
        <div style="font-size:15px;line-height:1.65;">${safeText}</div>
      </div>`;
  }).join('\n');
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const { messages, recipientEmail, companyName, jobDescription } = req.body ?? {};

  if (!Array.isArray(messages) || messages.length === 0) {
    return res.status(400).json({ error: 'messages must be a non-empty array' });
  }
  if (!recipientEmail) {
    return res.status(400).json({ error: 'recipientEmail is required' });
  }

  // Step 2: Haiku summary (best-effort — failure falls back gracefully)
  let summary = null;
  try {
    // Bounded so a slow summary can't eat the whole function budget —
    // on timeout we fall through to the catch and send without a summary
    const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY, timeout: 15_000 });

    const transcriptText = messages
      .map(m => `${m.role === 'user' ? 'Recruiter' : "Jaxon's AI"}: ${extractText(m.content)}`)
      .join('\n\n');

    const contextLines = [];
    if (companyName) contextLines.push(`Company: ${companyName}`);
    if (jobDescription) contextLines.push(`Job description excerpt: ${jobDescription.slice(0, 800)}`);
    const contextBlock = contextLines.length ? `${contextLines.join('\n')}\n\n` : '';

    const haiku = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 300,
      messages: [
        {
          role: 'user',
          content:
            `${contextBlock}Below is a transcript of a conversation between a recruiter and an AI representing Jaxon Travis.\n\n` +
            `${transcriptText}\n\n` +
            `Write a 3–5 sentence summary highlighting the key alignment points discussed between the role/company and Jaxon's background. ` +
            `Write from a neutral third-person perspective suitable for inclusion in a follow-up email ` +
            `(e.g. "The conversation covered Jaxon's experience building CRM infrastructure from scratch, which aligns with the role's emphasis on..."). ` +
            `Keep it factual, not promotional.`,
        },
      ],
    });

    summary = haiku.content?.[0]?.text?.trim() ?? null;
  } catch (err) {
    console.error('[send-transcript] Haiku summary failed, sending without it:', err?.message ?? err);
  }

  // Step 3 & 4: Build email HTML
  const transcriptHtml = buildTranscriptHtml(messages);

  const summarySection = summary
    ? `<div style="background:#f7f4ef;border-left:4px solid #D4A83F;border-radius:4px;padding:16px 20px;margin-bottom:32px;">
        <div style="font-size:11px;font-weight:700;letter-spacing:0.12em;text-transform:uppercase;color:#D4A83F;font-family:sans-serif;margin-bottom:10px;">Conversation Summary</div>
        <p style="margin:0;font-size:15px;line-height:1.7;color:#333;">${escapeHtml(summary).replace(/\n/g, '<br>')}</p>
      </div>`
    : '';

  const emailHtml = `
<div style="font-family:Georgia,'Times New Roman',serif;max-width:640px;margin:0 auto;background:#fff;color:#222;padding:40px 32px;">

  <h1 style="font-size:24px;font-weight:400;margin:0 0 4px;color:#141210;">Conversation with Jaxon Travis's AI</h1>
  ${companyName
    ? `<p style="margin:0 0 24px;color:#888;font-size:14px;font-family:sans-serif;">${escapeHtml(companyName)}</p>`
    : '<div style="margin-bottom:24px;"></div>'}

  <hr style="border:none;border-top:1px solid #e0dbd4;margin-bottom:32px;" />

  ${summarySection}

  <div style="background:#141210;border-radius:10px;padding:24px 28px;margin-bottom:36px;">
    <p style="margin:0 0 12px;color:#D4A83F;font-size:12px;font-weight:700;letter-spacing:0.15em;text-transform:uppercase;font-family:sans-serif;">Continue the conversation</p>
    <p style="margin:0;color:#f0ebe2;font-size:15px;line-height:1.7;font-family:sans-serif;">
      Interested in continuing the conversation? Reply to this email or reach out directly to Jaxon at
      <a href="mailto:jaxontravis7@gmail.com" style="color:#D4A83F;text-decoration:none;">jaxontravis7@gmail.com</a>
      to find a time to talk.
    </p>
  </div>

  <div style="margin-bottom:8px;">
    <div style="font-size:11px;font-weight:700;letter-spacing:0.15em;text-transform:uppercase;color:#999;font-family:sans-serif;margin-bottom:20px;">Full Transcript</div>
    ${transcriptHtml}
  </div>

  <hr style="border:none;border-top:1px solid #e0dbd4;margin:32px 0 16px;" />
  <p style="color:#aaa;font-size:12px;font-family:sans-serif;margin:0;">
    Sent by the AI Interview feature at
    <a href="https://jaxontravis.com" style="color:#D4A83F;text-decoration:none;">jaxontravis.com</a>
  </p>

</div>`;

  // Step 5: Send via Resend to both recipients
  const subject = companyName
    ? `Your conversation with Jaxon Travis's AI — ${companyName}`
    : "Your conversation with Jaxon Travis's AI — Summary";

  try {
    const resend = new Resend(process.env.RESEND_API_KEY);

    const result = await resend.emails.send({
      from: 'AI Interview <notifications@mail.jaxontravis.com>',
      to: [recipientEmail, 'jaxontravis7@gmail.com'],
      subject,
      html: emailHtml,
    });

    // Resend v3+ returns { data, error } rather than throwing on API errors.
    if (result?.error) {
      console.error('[send-transcript] Resend API error:', JSON.stringify(result.error));
      return res.status(500).json({
        error: 'Failed to send transcript email',
        detail: result.error,
      });
    }
  } catch (err) {
    console.error(
      '[send-transcript] Resend threw:',
      JSON.stringify({ name: err?.name, message: err?.message, statusCode: err?.statusCode, cause: err?.cause }),
    );
    return res.status(500).json({
      error: 'Failed to send transcript email',
      detail: { name: err?.name, message: err?.message, statusCode: err?.statusCode },
    });
  }

  return res.status(200).json({ ok: true });
}
