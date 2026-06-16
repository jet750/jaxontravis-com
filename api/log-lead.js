// Lead-capture endpoint. Serves TWO payload shapes on the same route so the
// existing AI Interview gate keeps working untouched:
//
//   1. Legacy AI Interview gate  → { name, company, email, jobUrl, timestamp }
//        No `source` field. Sends a Resend email notification (unchanged behavior).
//
//   2. Lead logging (NotifyModal waitlist + gates) → { source, email?, name?, metadata? }
//        Appends a row to the matching Google Sheets tab via the Sheets API v4.
//
// Required env vars (set in Vercel Project Settings → Environment Variables,
// server-side only — NO VITE_ prefix):
//   RESEND_API_KEY               — legacy gate email path
//   GOOGLE_SERVICE_ACCOUNT_JSON  — full service-account JSON for Sheets API auth
//   GOOGLE_SHEET_ID              — target spreadsheet ID
//
// Google auth is done by signing a JWT with the Node built-in crypto module —
// no googleapis / google-auth-library dependency, keeping the function lean.

import { createSign } from 'crypto';
import { Resend } from 'resend';

// ── source → Sheets tab name ──────────────────────────────────────────────────
const TAB_MAP = {
  bazaar_waitlist:       'Bazaar Blends Waitlist',
  perennial_playtester:  'Perennial Waitlist',
  perennial_kickstarter: 'Perennial Waitlist',
  name_gate:             'Name Gate Log',
  work_samples_gate:     'Work Samples Gate Log',
};

// ── JWT bearer token for a Google service account ─────────────────────────────
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

// ── Sheets append path ────────────────────────────────────────────────────────
// Returns a plain { code, payload, log? } object — the handler turns it into the
// HTTP response. Never throws; every failure mode maps to a status code.
async function appendLeadRow(body) {
  const SHEET_ID = process.env.GOOGLE_SHEET_ID;
  const rawAccount = process.env.GOOGLE_SERVICE_ACCOUNT_JSON;

  if (!rawAccount || !SHEET_ID) {
    return {
      code: 500,
      payload: { error: 'Lead logging is not configured' },
      log: 'Missing GOOGLE_SERVICE_ACCOUNT_JSON or GOOGLE_SHEET_ID',
    };
  }

  const tab = TAB_MAP[body.source];
  if (!tab) {
    return { code: 400, payload: { error: `Invalid source: ${String(body.source)}` } };
  }

  let serviceAccount;
  try {
    serviceAccount = JSON.parse(rawAccount);
  } catch {
    return {
      code: 500,
      payload: { error: 'Lead logging is not configured' },
      log: 'GOOGLE_SERVICE_ACCOUNT_JSON failed to JSON.parse',
    };
  }

  let accessToken;
  try {
    accessToken = await getAccessToken(serviceAccount);
  } catch (err) {
    return {
      code: 502,
      payload: { error: 'Upstream auth failed' },
      log: `getAccessToken threw: ${err?.message ?? err}`,
    };
  }
  if (!accessToken) {
    return {
      code: 502,
      payload: { error: 'Upstream auth failed' },
      log: 'Token endpoint returned no access_token',
    };
  }

  const timestamp = new Date().toISOString();
  const row = [
    timestamp,
    body.email || '',
    body.name || '',
    body.source,
    JSON.stringify(body.metadata || {}),
  ];

  const url =
    `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}` +
    `/values/${encodeURIComponent(tab)}!A:E:append` +
    `?valueInputOption=USER_ENTERED&insertDataOption=INSERT_ROWS`;

  let sheetRes;
  try {
    sheetRes = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ values: [row] }),
    });
  } catch (err) {
    return {
      code: 502,
      payload: { error: 'Sheets request failed' },
      log: `Sheets fetch threw: ${err?.message ?? err}`,
    };
  }

  if (!sheetRes.ok) {
    const detail = await sheetRes.text().catch(() => '');
    return {
      code: 502,
      payload: { error: 'Sheets API error' },
      log: `Sheets API responded ${sheetRes.status}: ${detail}`,
    };
  }

  return { code: 200, payload: { ok: true } };
}

// ── Legacy AI Interview gate email path (unchanged behavior) ──────────────────
async function handleInterviewGateEmail(req, res, body) {
  const { name, company, email, jobUrl, timestamp } = body;

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

  return res.status(200).json({ ok: true });
}

// ── Router ────────────────────────────────────────────────────────────────────
export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const body = req.body ?? {};

  // No `source` → legacy AI Interview gate notification.
  if (!body.source) {
    return handleInterviewGateEmail(req, res, body);
  }

  // `source` present → Google Sheets lead logging. Wrapped so a Sheets write
  // failure can never surface as an unhandled error.
  try {
    const result = await appendLeadRow(body);
    if (result.log) console.error('[log-lead]', result.log);
    return res.status(result.code).json(result.payload);
  } catch (err) {
    console.error('[log-lead] Unexpected error:', err?.message ?? err);
    return res.status(500).json({ error: 'Internal error' });
  }
}
