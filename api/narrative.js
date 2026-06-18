import Anthropic from '@anthropic-ai/sdk';

// Procedural "field journal" event generator for The Great Pollinator.
//
// The client (game/narrative/NarrativeEngine.js) posts { eventNumber, runContext }
// when the player enters the hive; this proxy calls Claude server-side (so the
// API key is never exposed to the browser, per CLAUDE.md) and returns a single
// validated JSON event object. On any failure it returns a non-2xx status and
// the client silently skips the event — gameplay always continues.

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const { eventNumber = 1, runContext = {} } = req.body ?? {};

  const contextLine =
    runContext.pollenBanked != null
      ? `Current run context: ${runContext.pollenBanked} pollen banked this run, HP at ${Math.round(
          (runContext.hp / runContext.maxHp) * 100,
        )}%, active craft: ${runContext.craft || 'bee'}.`
      : '';

  const systemPrompt = `You are the narrator of a Victorian botanical field journal game called The Great Pollinator.
The player is a naturalist's bee collecting pollen specimens across garden biomes.
Generate a brief field journal entry describing an unexpected event the bee encounters on re-deployment.
The event should feel authentic to Victorian natural history writing — precise, observational, slightly formal.
${contextLine}

Respond ONLY with a valid JSON object in this exact shape, no preamble, no markdown fences:
{
  "title": "short event title (max 5 words)",
  "text": "2-3 sentences describing the event in Victorian naturalist voice",
  "choices": [
    {
      "label": "short action label (max 4 words)",
      "description": "one sentence outcome description",
      "consequence": {
        "type": "pollen_modifier | damage_modifier | heal | speed_modifier | pollen_bonus",
        "value": <number>,
        "duration": <seconds or 0 for instant>,
        "description": "brief mechanical effect shown to player"
      }
    },
    {
      "label": "short action label (max 4 words)",
      "description": "one sentence outcome description",
      "consequence": {
        "type": "pollen_modifier | damage_modifier | heal | speed_modifier | pollen_bonus",
        "value": <number>,
        "duration": <seconds or 0 for instant>,
        "description": "brief mechanical effect shown to player"
      }
    }
  ]
}

Consequence types and value meanings:
- pollen_modifier: multiplier on pollen yield for duration (e.g. 0.7 = 30% less, 1.3 = 30% more)
- damage_modifier: multiplier on incoming damage for duration (e.g. 1.5 = 50% more damage taken)
- heal: instant HP restore as percentage of max HP (e.g. 0.25 = 25% heal)
- speed_modifier: multiplier on movement speed for duration (e.g. 0.6 = 40% slower)
- pollen_bonus: instant flat pollen added to carried count (e.g. 5 = +5 pollen)

One choice should be generally favorable, one risky or neutral. Do not make both choices obviously good.
Vary the scenario each call — it is event number ${eventNumber} of this session.`;

  if (!process.env.ANTHROPIC_API_KEY) {
    return res.status(500).json({ error: 'missing ANTHROPIC_API_KEY' });
  }

  // 12s timeout keeps us well inside the function maxDuration.
  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY, timeout: 12_000 });

  try {
    const message = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 1000,
      system: systemPrompt,
      messages: [{ role: 'user', content: 'Generate the next field journal event.' }],
    });

    const raw = message.content?.[0]?.text ?? '';
    const clean = raw.replace(/```json|```/g, '').trim();
    const event = JSON.parse(clean);

    // Shape guard: a malformed event must never reach the UI.
    if (!event || !Array.isArray(event.choices) || event.choices.length < 2) {
      return res.status(502).json({ error: 'malformed event' });
    }

    return res.status(200).json(event);
  } catch (err) {
    return res.status(502).json({ error: err.message });
  }
}
