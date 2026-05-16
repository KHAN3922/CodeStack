// api/chat.js — Vercel Serverless Function
// ✅ API key hidden in Vercel environment variables (never in browser)
// ✅ CORS headers set here so browser never blocks the request
// ✅ Clear error messages for every failure case

export default async function handler(req, res) {

  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(204).end();
  if (req.method !== "POST")   return res.status(405).json({ error: "Method not allowed" });

  const { message, history } = req.body || {};
  if (!message) return res.status(400).json({ error: "Missing message" });

  try {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": process.env.ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 1024,
        system: "You are CodeStack AI Coder — an expert programming assistant. Write clean well-commented code, debug errors, explain concepts, and optimize code. Always wrap code in markdown fenced blocks with the language name.",
        messages: [
          ...(Array.isArray(history) ? history : []),
          { role: "user", content: message }
        ],
      }),
    });

    if (response.status === 401)
      return res.status(401).json({ error: "Invalid API key. Set ANTHROPIC_API_KEY in Vercel environment variables." });

    if (!response.ok) {
      const e = await response.json().catch(() => ({}));
      return res.status(response.status).json({ error: e.error?.message || "Anthropic API error" });
    }

    const data = await response.json();
    return res.status(200).json({ reply: data.content?.[0]?.text || "" });

  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
