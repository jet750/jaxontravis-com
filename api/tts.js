// OpenAI TTS proxy for the AI Interview voice mode.
//
// Requires OPENAI_API_KEY in Vercel Environment Variables
// (Project Settings → Environment Variables).
// Server-side only — never use VITE_ prefix.
//
// The client (src/hooks/useVoiceMode.js) falls back to browser SpeechSynthesis
// on any non-200 response here, so a missing key or upstream error degrades
// voice mode gracefully instead of hard-failing.

import { Readable } from 'node:stream';

const OPENAI_TTS_URL = 'https://api.openai.com/v1/audio/speech';
const MAX_CHARS = 4096; // OpenAI TTS hard limit

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const { text } = req.body ?? {};

  // Missing/empty text is a client error.
  if (typeof text !== 'string' || !text.trim()) {
    return res.status(400).json({ error: 'text is required' });
  }

  // No key configured — surface 500 so the client falls back to SpeechSynthesis.
  if (!process.env.OPENAI_API_KEY) {
    return res.status(500).json({ error: 'TTS unavailable' });
  }

  // Over the limit: truncate rather than error (OpenAI rejects >4096 chars).
  const input = text.length > MAX_CHARS ? text.slice(0, MAX_CHARS) : text;

  try {
    const openaiRes = await fetch(OPENAI_TTS_URL, {
      method: 'POST',
      headers: {
        Authorization:  `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'tts-1',           // standard quality — cheapest, lowest latency.
                                  // Swap to 'tts-1-hd' on this line for higher quality.
        voice: 'nova',            // warm, natural, professional — good for interviews
        input,
        response_format: 'mp3',
      }),
    });

    if (!openaiRes.ok || !openaiRes.body) {
      const detail = await openaiRes.text().catch(() => '');
      console.error('[tts] OpenAI error:', openaiRes.status, detail.slice(0, 300));
      return res.status(502).json({ error: 'TTS service error' });
    }

    // Stream the MP3 straight back to the client.
    res.setHeader('Content-Type', 'audio/mpeg');
    res.setHeader('Cache-Control', 'no-cache');

    const audioStream = Readable.fromWeb(openaiRes.body);
    audioStream.on('error', (err) => {
      console.error('[tts] stream error:', err?.message ?? err);
      res.destroy(err);
    });
    audioStream.pipe(res);
  } catch (err) {
    console.error('[tts] handler error:', err?.message ?? err);
    // On a fetch/throw the response hasn't started, so a JSON error is safe.
    if (!res.headersSent) {
      return res.status(502).json({ error: 'TTS service error' });
    }
    res.end();
  }
}
