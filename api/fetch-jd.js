import Anthropic from '@anthropic-ai/sdk';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const { url } = req.body ?? {};
  if (!url || typeof url !== 'string') {
    return res.status(400).json({ error: 'url required' });
  }

  // Basic URL validation — reject non-http(s) schemes before fetching
  let parsed;
  try {
    parsed = new URL(url);
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      return res.json({ error: 'blocked' });
    }
  } catch {
    return res.json({ error: 'blocked' });
  }

  try {
    const pageRes = await fetch(parsed.href, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)',
        Accept: 'text/html,application/xhtml+xml',
      },
      signal: AbortSignal.timeout(8000),
      redirect: 'follow',
    });

    if (!pageRes.ok) return res.json({ error: 'blocked' });

    const contentType = pageRes.headers.get('content-type') ?? '';
    if (!contentType.includes('text/html')) return res.json({ error: 'blocked' });

    const html = await pageRes.text();
    // Trim to 60 000 chars — plenty for any JD, avoids huge context windows
    const trimmed = html.slice(0, 60_000);

    // Extraction timeout stays inside the function's 30s maxDuration;
    // a timeout throws and falls through to the catch → { error: 'blocked' }
    const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY, timeout: 20_000 });

    const extraction = await client.messages.create({
      model:      'claude-haiku-4-5-20251001',
      max_tokens: 2048,
      messages: [
        {
          role: 'user',
          content: `Extract the job description from this HTML. Return ONLY the job title, company name (if present), and the complete job description text — no HTML tags, no nav, no footer, no ads. If this page is not a job posting, respond with exactly: NOT_A_JOB_POST\n\n${trimmed}`,
        },
      ],
    });

    const text = extraction.content[0]?.text?.trim();
    if (!text || text === 'NOT_A_JOB_POST') return res.json({ error: 'blocked' });

    res.json({ text });
  } catch {
    res.json({ error: 'blocked' });
  }
}
