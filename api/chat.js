// api/chat.js — Vercel Serverless Function (Groq Version)
// ✅ FREE — Groq API (no quota issues, extremely fast)
// ✅ API key hidden in Vercel environment variables
// ✅ CORS headers included

export default async function handler(req, res) {

  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(204).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const { message, history } = req.body || {};
  if (!message) return res.status(400).json({ error: "Missing message" });

  const GROQ_API_KEY = process.env.GROQ_API_KEY;
  if (!GROQ_API_KEY) {
    return res.status(401).json({
      error: "Missing GROQ_API_KEY — add it in Vercel → Settings → Environment Variables"
    });
  }

  try {
    const messages = [
      {
        role: "system",
        content: `You are CodeStack AI Coder — an expert programming assistant. Your job is to:
1. Write clean, well-commented code in any language requested
2. Debug errors and explain exactly what is wrong and how to fix it
3. Explain programming concepts clearly with examples
4. Optimize code for performance and readability
5. Convert code between languages when asked
Always wrap code in markdown fenced blocks with the language name. Be concise but thorough.`
      },
      ...(Array.isArray(history) ? history : []),
      { role: "user", content: message }
    ];

    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${GROQ_API_KEY}`
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        messages: messages,
        max_tokens: 1024,
        temperature: 0.7,
      }),
    });

    if (response.status === 401) {
      return res.status(401).json({ error: "Invalid Groq API key — check GROQ_API_KEY in Vercel environment variables" });
    }
    if (response.status === 429) {
      return res.status(429).json({ error: "Rate limit hit — please wait a moment and try again" });
    }
    if (!response.ok) {
      const e = await response.json().catch(() => ({}));
      return res.status(response.status).json({ error: e.error?.message || "Groq API error" });
    }

    const data = await response.json();
    const reply = data.choices?.[0]?.message?.content || "No response received";
    return res.status(200).json({ reply });

  } catch (err) {
    return res.status(500).json({ error: "Server error: " + err.message });
  }
}
