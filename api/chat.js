import Anthropic from '@anthropic-ai/sdk';
import { buildSystemPrompt } from '../src/data/background.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const { messages, companyName, companyContext, jobDescription, jdAnalysis } = req.body ?? {};

  if (!Array.isArray(messages) || messages.length === 0) {
    return res.status(400).json({ error: 'messages must be a non-empty array' });
  }

  // First-person persona + restrained opening + conversational response style.
  // Prepended ahead of the background prompt so these rules take precedence over
  // its default (third-person, role-analysis-on-open) opening instructions —
  // buildSystemPrompt lives in src/data/background.js and is left untouched.
  const personaInstructions = `You are Jaxon Travis. Respond in the first person as Jaxon — say 'I', 'my', 'me', not 'Jaxon' or 'he'. You are representing yourself in a professional interview context. Do not narrate about yourself in third person at any point.

Your opening message must be no more than 2 sentences. If a job description has been parsed, acknowledge it briefly. Then ask how you can help. Do not output a role analysis, strengths summary, or any extended content unless the recruiter specifically requests it. Wait for them to lead.

Keep all responses conversational and concise — typically 2–4 short paragraphs or equivalent. After answering any question, end with a single short follow-up question (e.g. 'Want me to go deeper on that?' or 'Do you have another question?') to keep the conversation moving. Never dump a large block of content unprompted.

The three rules above take precedence over any conflicting guidance below — including any later opening-message instructions that call for a multi-point role analysis, and any third-person framing of Jaxon.

`;

  const systemPrompt = personaInstructions + buildSystemPrompt(companyName, companyContext, jobDescription, jdAnalysis);

  // Guard: if system prompt is empty something is wrong with the import
  if (!systemPrompt || systemPrompt.length < 100) {
    return res.status(500).json({ error: 'system prompt failed to build' });
  }

  // 25s timeout keeps us inside the function's 30s maxDuration so the
  // client gets a clean SSE error event instead of a dropped connection
  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY, timeout: 25_000 });

  // SSE headers must be set before any write call.
  // X-Accel-Buffering disables nginx/proxy buffering so chunks reach the client immediately.
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache, no-transform');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');
  res.flushHeaders();

  try {
    const stream = await client.messages.stream({
      model: 'claude-sonnet-4-6',
      max_tokens: 1024,
      system: [
        {
          type: 'text',
          text: systemPrompt,
          cache_control: { type: 'ephemeral' },
        },
      ],
      messages,
    });

    for await (const chunk of stream) {
      // Guard on delta type: only text_delta carries readable text.
      // input_json_delta (tool use) would otherwise cause chunk.delta.text to be undefined.
      if (
        chunk.type === 'content_block_delta' &&
        chunk.delta.type === 'text_delta'
      ) {
        res.write(`data: ${JSON.stringify({ text: chunk.delta.text })}\n\n`);
      }
    }

    res.write('data: [DONE]\n\n');
  } catch (err) {
    // Headers are already sent; surface the error as an SSE event so the
    // client can display a graceful failure message rather than hanging.
    res.write(`data: ${JSON.stringify({ error: err.message })}\n\n`);
  }

  res.end();
}
