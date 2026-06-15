import Anthropic from '@anthropic-ai/sdk';

// ============================================================
// analyze-jd.js — JD-adaptive personalization pre-analysis
// Background utility: runs Haiku (fast/cheap) to extract
// structured data from a job description before the interview
// starts, so buildSystemPrompt can tailor the prompt to the role.
// Analysis failure must NEVER break the interview — every error
// path returns a safe fallback object with a 200 status.
// ============================================================

// Safe fallback returned whenever the model output can't be parsed
// into the expected shape (or the API call fails). Mirrors the exact
// keys/types the prompt builder consumes so background.js never hits
// `.map` on undefined or a non-array value.
function fallbackAnalysis() {
  return {
    roleTitle: '',
    department: '',
    seniority: '',
    topRequirements: [],
    techStack: [],
    signalKeywords: [],
    aiMentioned: false,
    managementRequired: false,
    yearsRequired: 0,
    hardGapFlags: [],
    strengthAlignments: [],
  };
}

// Coerce whatever the model returned into the fallback shape: string
// fields stay strings, array fields stay arrays of strings, booleans
// stay booleans, yearsRequired stays a finite number. Anything
// malformed falls back to the safe default for that key — this is the
// guarantee that downstream `.map(...)` / `.join(...)` calls can't throw.
function normalize(parsed) {
  const base = fallbackAnalysis();
  if (!parsed || typeof parsed !== 'object') return base;

  const str    = v => (typeof v === 'string' ? v : '');
  const strArr = v => (Array.isArray(v) ? v.filter(x => typeof x === 'string') : []);
  const bool   = v => v === true;
  const num    = v => (Number.isFinite(v) ? v : 0);

  return {
    roleTitle:          str(parsed.roleTitle),
    department:         str(parsed.department),
    seniority:          str(parsed.seniority),
    topRequirements:    strArr(parsed.topRequirements),
    techStack:          strArr(parsed.techStack),
    signalKeywords:     strArr(parsed.signalKeywords),
    aiMentioned:        bool(parsed.aiMentioned),
    managementRequired: bool(parsed.managementRequired),
    yearsRequired:      num(parsed.yearsRequired),
    hardGapFlags:       strArr(parsed.hardGapFlags),
    strengthAlignments: strArr(parsed.strengthAlignments),
  };
}

// Pull a JSON object out of the model text even if it arrives wrapped in
// markdown fences or with stray preamble (despite the system prompt asking
// for raw JSON). Returns the parsed object, or null if nothing parses.
function extractJson(text) {
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch { /* fall through to fence/brace extraction */ }

  // Strip ```json ... ``` fences, then retry on the first {...} block.
  const fenced = text.replace(/```(?:json)?/gi, '').trim();
  const start  = fenced.indexOf('{');
  const end    = fenced.lastIndexOf('}');
  if (start === -1 || end === -1 || end <= start) return null;
  try {
    return JSON.parse(fenced.slice(start, end + 1));
  } catch {
    return null;
  }
}

const SYSTEM_PROMPT =
  'You are analyzing a job description to extract structured data for use in an ' +
  'AI interview system. Return ONLY valid JSON with no preamble, no markdown, no ' +
  'backticks. Respond with exactly the JSON structure specified.';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const started = Date.now();
  const { jobDescription, companyName } = req.body ?? {};

  // No JD to analyze — return the safe fallback (200) rather than erroring,
  // so the downstream interview flow is never blocked.
  if (!jobDescription || typeof jobDescription !== 'string' || !jobDescription.trim()) {
    return res.status(200).json({ ...fallbackAnalysis(), processingMs: Date.now() - started });
  }

  const userPrompt = `Analyze this job description and return a JSON object with exactly these keys:

{
  roleTitle: string,           // exact role title from JD
  department: string,          // inferred department
  seniority: string,           // IC / Manager / Director / VP / C-Suite
  topRequirements: string[],   // top 3-5 must-have requirements verbatim from JD
  techStack: string[],         // all tools/platforms named in JD
  signalKeywords: string[],    // words suggesting 0-to-1, builder, founder-adjacent
                               // e.g. 'no playbook', 'first hire', 'build from scratch'
  aiMentioned: boolean,        // does JD mention AI, ML, or automation tools
  managementRequired: boolean, // does JD require managing direct reports
  yearsRequired: number,       // minimum years of experience stated (0 if not stated)
  hardGapFlags: string[],      // any of: 'sql', 'coding', 'salesforce_admin',
                               // 'gainsight', 'hubspot_admin', 'marketo',
                               // 'enterprise_scale' — only flag if explicitly required
  strengthAlignments: string[] // 2-4 of Jaxon's strongest alignments to THIS JD
                               // based on his background (CRM builds, AI fluency,
                               // 0-to-1 execution, CSM track record, etc.)
}

Job Description:
${jobDescription}

Company: ${companyName || 'Not provided'}`;

  try {
    // 12s client timeout stays inside the 15s maxDuration (see vercel.json)
    // so a slow model call falls through to the catch → safe fallback
    // rather than the function being killed mid-flight.
    const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY, timeout: 12_000 });

    // Haiku specifically — this is a fast/cheap background utility call,
    // not the main Sonnet-powered interview.
    const completion = await client.messages.create({
      model:      'claude-haiku-4-5-20251001',
      max_tokens: 1024,
      system:     SYSTEM_PROMPT,
      messages:   [{ role: 'user', content: userPrompt }],
    });

    const raw      = completion.content[0]?.text ?? '';
    const parsed   = extractJson(raw);
    const analysis = parsed ? normalize(parsed) : fallbackAnalysis();

    return res.status(200).json({ ...analysis, processingMs: Date.now() - started });
  } catch (err) {
    // API error / timeout — never 500. Return the safe fallback so the
    // interview proceeds with standard (non-personalized) prompting.
    console.error('[analyze-jd]', err?.message ?? err);
    return res.status(200).json({ ...fallbackAnalysis(), processingMs: Date.now() - started });
  }
}
