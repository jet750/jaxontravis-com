import { createSign } from 'crypto';
import Anthropic from '@anthropic-ai/sdk';
import { Resend } from 'resend';
import rubric from './rubric.js';

// Cold-start verification only — not yet wired into the scoring call.
// Confirms rubric.js resolves and logs its top-level keys to Vercel function logs.

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

// ── JWT bearer token for a Google service account ─────────────────────────────
// Reused verbatim from api/log-lead.js — signs a JWT with the Node built-in
// crypto module, so this stays on the same auth pattern with no extra dependency.
async function getAccessToken(serviceAccount) {
  const now = Math.floor(Date.now() / 1000);
  const header = Buffer.from(JSON.stringify({
    alg: 'RS256', typ: 'JWT',
  })).toString('base64url');

  const claim = Buffer.from(JSON.stringify({
    iss: serviceAccount.client_email,
    scope: 'https://www.googleapis.com/auth/spreadsheets',
    aud: 'https://oauth2.googleapis.com/token',
    exp: now + 3600,
    iat: now,
  })).toString('base64url');

  const sign = createSign('RSA-SHA256');
  sign.update(`${header}.${claim}`);
  const sig = sign.sign(serviceAccount.private_key, 'base64url');
  const jwt = `${header}.${claim}.${sig}`;

  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion: jwt,
    }),
  });
  const data = await res.json();
  return data.access_token;
}

// ── Google Sheets transcript log ──────────────────────────────────────────────
// Appends one row (columns A–I) per transcript to the TRANSCRIPT_SHEET_ID
// spreadsheet — a SEPARATE sheet from log-lead.js's GOOGLE_SHEET_ID. Throws on
// any failure; the caller wraps this in its own try/catch so a Sheets problem
// can never alter the email response.
async function logTranscriptToSheet(row) {
  const SHEET_ID   = process.env.TRANSCRIPT_SHEET_ID;
  const rawAccount = process.env.GOOGLE_SERVICE_ACCOUNT_JSON;

  if (!rawAccount || !SHEET_ID) {
    throw new Error('Missing GOOGLE_SERVICE_ACCOUNT_JSON or TRANSCRIPT_SHEET_ID');
  }

  const serviceAccount = JSON.parse(rawAccount);
  const accessToken    = await getAccessToken(serviceAccount);
  if (!accessToken) throw new Error('Token endpoint returned no access_token');

  // A range with no sheet/tab name appends to the spreadsheet's first sheet, so
  // this works regardless of what that tab is named.
  const url =
    `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}` +
    `/values/${encodeURIComponent('A:I')}:append` +
    `?valueInputOption=USER_ENTERED&insertDataOption=INSERT_ROWS`;

  const sheetRes = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ values: [row] }),
  });

  if (!sheetRes.ok) {
    const detail = await sheetRes.text().catch(() => '');
    throw new Error(`Sheets API responded ${sheetRes.status}: ${detail}`);
  }
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const {
    messages, recipientEmail, cc, companyName, jobDescription, jdAnalysis,
    name, sessionLength, starterPromptsUsed,
  } = req.body ?? {};

  // Optional CC — accept a single address or an array; ignore anything malformed.
  // Dedupe against the primary recipients (below) so we never list the same
  // address in both `to` and `cc`, which Resend rejects as a duplicate recipient.
  const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const toList = [recipientEmail, 'jaxontravis7@gmail.com'];
  const toLower = new Set(toList.map(addr => String(addr).trim().toLowerCase()));
  const ccList = (Array.isArray(cc) ? cc : [cc])
    .filter(addr => typeof addr === 'string' && EMAIL_RE.test(addr.trim()))
    .map(addr => addr.trim())
    .filter(addr => !toLower.has(addr.toLowerCase()));

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

  // Step 2b: Role-fit scoring (best-effort — only runs when a JD was provided).
  // Mirrors the Step 2 Haiku pattern; failure NEVER blocks the email send.
  let score = null;
  let scoreHtml = '';

  if (jobDescription?.trim()) {
    try {
      const scoreClient = new Anthropic({
        apiKey: process.env.ANTHROPIC_API_KEY,
        timeout: 20_000,
      });

      // Build the scoring prompt from the rubric object
      const dimensionsList = rubric.dimensions
        .map(d => `- ${d.label} (weight: ${d.weight * 100}%): ${d.description}`)
        .join('\n');

      const gapsList = rubric.hardGaps.join(', ');
      const differentiatorsList = rubric.differentiators.join('\n- ');

      const modifiersList = rubric.scoringModifiers
        .map(m => `IF "${m.condition}": apply ${m.modifier > 0 ? '+' : ''}${m.modifier} modifier`)
        .join('\n');

      const transcriptText = messages
        .map(m => `${m.role === 'user' ? 'Recruiter' : "Jaxon's AI"}: ${extractText(m.content)}`)
        .join('\n\n');

      // Include jdAnalysis structured data if available — gives the scorer
      // pre-extracted signal without re-parsing the raw JD text.
      const jdAnalysisBlock = jdAnalysis
        ? `\nPRE-ANALYZED JD DATA:\n${JSON.stringify(jdAnalysis, null, 2)}`
        : '';

      const scoringPrompt = `${rubric.systemPromptInstructions}

You are scoring the following job description against Jaxon Travis's background.

SCORING DIMENSIONS AND WEIGHTS:
${dimensionsList}

KNOWN HARD GAPS (score these dimensions honestly if present in JD):
${gapsList}

GENUINE DIFFERENTIATORS (weight these positively):
- ${differentiatorsList}

SCORING MODIFIERS:
${modifiersList}

APPLICATION THRESHOLD: ${rubric.threshold}/10

JOB DESCRIPTION:
${jobDescription.slice(0, 2000)}
${jdAnalysisBlock}

CONVERSATION TRANSCRIPT (shows what the recruiter cared about):
${transcriptText.slice(0, 1500)}

${rubric.outputFormat.subThresholdFraming}

Return ONLY a valid JSON object with exactly these keys —
no preamble, no markdown, no backticks:
{
  "overallVerdict": "string — one line verdict",
  "weightedScore": number (e.g. 7.2),
  "dimensions": [
    {
      "label": "string",
      "weight": number,
      "score": number,
      "rationale": "string — 1-2 sentences"
    }
  ],
  "closingParagraph": "string — the closing analysis paragraph",
  "scoreColor": "string — one of: green (>=8), gold (>=7), amber (6-6.9), red (<6)"
}`;

      const scoreResponse = await scoreClient.messages.create({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 800,
        messages: [{ role: 'user', content: scoringPrompt }],
      });

      const rawScore = scoreResponse.content?.[0]?.text?.trim() ?? '';

      // Strip any accidental markdown fences before parsing
      const cleanScore = rawScore
        .replace(/^```json\s*/i, '')
        .replace(/^```\s*/i, '')
        .replace(/```\s*$/i, '')
        .trim();

      score = JSON.parse(cleanScore);
    } catch (err) {
      console.error('[send-transcript] Scoring failed, sending without score:',
        err?.message ?? err);
      score = null;
    }
  }

  // Build the score HTML block (only when scoring succeeded).
  // NOTE: comp values from the rubric are intentionally never referenced here —
  // rubric.outputFormat.compNotSurfaced gates them out of public-facing output.
  if (score) {
    const colorMap = {
      green: '#4a9e6b',
      gold:  '#D4A83F',
      amber: '#C4714A',
      red:   '#b94a4a',
    };
    const accentColor = colorMap[score.scoreColor] ?? '#D4A83F';

    const dimensionRows = score.dimensions.map(d => `
      <tr>
        <td style="padding:8px 12px;font-size:13px;
          font-family:sans-serif;color:#444;
          border-bottom:1px solid #eee;">
          ${escapeHtml(d.label)}
          <span style="color:#999;font-size:11px;">
            (${Math.round(d.weight * 100)}%)
          </span>
        </td>
        <td style="padding:8px 12px;font-size:13px;
          font-family:sans-serif;font-weight:600;
          color:${accentColor};text-align:center;
          border-bottom:1px solid #eee;">
          ${d.score}/10
        </td>
        <td style="padding:8px 12px;font-size:12px;
          font-family:sans-serif;color:#666;
          border-bottom:1px solid #eee;
          line-height:1.5;">
          ${escapeHtml(d.rationale)}
        </td>
      </tr>`).join('');

    scoreHtml = `
      <div style="margin-bottom:32px;">

        <!-- Score header -->
        <div style="display:flex;align-items:baseline;
          gap:12px;margin-bottom:4px;">
          <div style="font-size:11px;font-weight:700;
            letter-spacing:0.12em;text-transform:uppercase;
            color:#999;font-family:sans-serif;">
            Role Fit Score
          </div>
        </div>

        <!-- Verdict + score -->
        <div style="background:#141210;border-radius:10px;
          padding:20px 24px;margin-bottom:16px;
          display:flex;align-items:center;
          justify-content:space-between;">
          <div>
            <div style="font-size:13px;color:#aaa;
              font-family:sans-serif;margin-bottom:4px;">
              ${escapeHtml(score.overallVerdict)}
            </div>
            <div style="font-size:11px;color:#666;
              font-family:sans-serif;">
              ${score.weightedScore >= rubric.threshold
                ? '✓ Above application threshold'
                : '↗ Below threshold — see analysis below'}
            </div>
          </div>
          <div style="font-size:42px;font-weight:300;
            color:${accentColor};font-family:Georgia,serif;
            line-height:1;">
            ${score.weightedScore.toFixed(1)}
            <span style="font-size:20px;color:#666;">/10</span>
          </div>
        </div>

        <!-- Dimension table -->
        <table style="width:100%;border-collapse:collapse;
          margin-bottom:16px;background:#fafaf8;
          border-radius:8px;overflow:hidden;">
          <thead>
            <tr style="background:#f0ede8;">
              <th style="padding:10px 12px;font-size:11px;
                font-weight:700;letter-spacing:0.1em;
                text-transform:uppercase;color:#888;
                font-family:sans-serif;text-align:left;">
                Dimension
              </th>
              <th style="padding:10px 12px;font-size:11px;
                font-weight:700;letter-spacing:0.1em;
                text-transform:uppercase;color:#888;
                font-family:sans-serif;text-align:center;
                width:80px;">
                Score
              </th>
              <th style="padding:10px 12px;font-size:11px;
                font-weight:700;letter-spacing:0.1em;
                text-transform:uppercase;color:#888;
                font-family:sans-serif;text-align:left;">
                Rationale
              </th>
            </tr>
          </thead>
          <tbody>
            ${dimensionRows}
          </tbody>
        </table>

        <!-- Closing paragraph -->
        <div style="font-size:14px;line-height:1.75;
          color:#444;font-family:sans-serif;
          padding:0 4px;">
          ${escapeHtml(score.closingParagraph)
            .replace(/\\n/g, '<br>')}
        </div>

      </div>

      <hr style="border:none;border-top:1px solid #e0dbd4;
        margin-bottom:32px;" />`;
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

  ${scoreHtml}

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

  // Step 5: Send via Resend to both recipients.
  // Send parameters are unchanged — only the control flow differs: rather than
  // returning immediately, capture the outcome as `emailSent` so the Sheets log
  // (Step 6) always runs, then return based on the email result alone.
  const subject = companyName
    ? `Your conversation with Jaxon Travis's AI — ${companyName}`
    : "Your conversation with Jaxon Travis's AI — Summary";

  let emailSent = false;
  let emailErrorResponse = null;

  try {
    const resend = new Resend(process.env.RESEND_API_KEY);

    const result = await resend.emails.send({
      from: 'Jaxon Travis AI Interview <notifications@mail.jaxontravis.com>',
      to: toList,
      ...(ccList.length ? { cc: ccList } : {}),
      replyTo: 'jaxontravis7@gmail.com',
      subject,
      html: emailHtml,
    });

    // Resend v3+ returns { data, error } rather than throwing on API errors.
    if (result?.error) {
      console.error('[send-transcript] Resend API error:', JSON.stringify(result.error));
      emailErrorResponse = {
        status: 500,
        body: { error: 'Failed to send transcript email', detail: result.error },
      };
    } else {
      emailSent = true;
    }
  } catch (err) {
    console.error(
      '[send-transcript] Resend threw:',
      JSON.stringify({ name: err?.name, message: err?.message, statusCode: err?.statusCode, cause: err?.cause }),
    );
    emailErrorResponse = {
      status: 500,
      body: {
        error: 'Failed to send transcript email',
        detail: { name: err?.name, message: err?.message, statusCode: err?.statusCode },
      },
    };
  }

  // Step 6: Google Sheets transcript log — fully independent of the email above.
  // Its own try/catch: a Sheets failure is logged but never alters the response,
  // and the email outcome (emailSent) is recorded in column I either way.
  try {
    const fullTranscript = messages
      .map(m => `${m.role === 'user' ? 'Recruiter' : "Jaxon's AI"}: ${extractText(m.content)}`)
      .join('\n');

    const jdTitle = jdAnalysis?.roleTitle?.trim() || 'No JD provided';

    await logTranscriptToSheet([
      new Date().toISOString(),                                                 // A: Timestamp
      name || '',                                                               // B: Name
      recipientEmail || '',                                                     // C: Email
      companyName || '',                                                        // D: Company
      jdTitle,                                                                  // E: JD Title
      fullTranscript,                                                           // F: Full Transcript
      Number.isFinite(sessionLength) ? sessionLength : '',                      // G: Session Length
      Array.isArray(starterPromptsUsed) ? starterPromptsUsed.join(', ') : '',   // H: Starter Prompts Used
      emailSent,                                                                // I: Email Sent
    ]);
  } catch (err) {
    console.error('[send-transcript] Sheets logging failed (non-fatal):', err?.message ?? err);
  }

  // Return based on the email result only — the Sheets log never changes this.
  if (emailErrorResponse) {
    return res.status(emailErrorResponse.status).json(emailErrorResponse.body);
  }
  return res.status(200).json({ ok: true });
}
