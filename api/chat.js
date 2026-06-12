import Anthropic from '@anthropic-ai/sdk';
import { buildSystemPrompt } from '../src/data/background.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const { messages, companyName, companyContext, jobDescription } = req.body;

  if (!Array.isArray(messages) || messages.length === 0) {
    return res.status(400).json({ error: 'messages must be a non-empty array' });
  }

  const systemPrompt = buildSystemPrompt(companyName, companyContext, jobDescription);

  // Guard: if system prompt is empty something is wrong with the import
  if (!systemPrompt || systemPrompt.length < 100) {
    return res.status(500).json({ error: 'system prompt failed to build' });
  }

  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

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
