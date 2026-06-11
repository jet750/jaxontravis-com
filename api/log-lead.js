export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  try {
    console.log('[log-lead]', JSON.stringify(req.body));
  } catch {
    // best-effort — never block the gate submit
  }

  res.status(200).json({ ok: true });
}
