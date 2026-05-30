// api/chat.js — Vercel Serverless Function (Gemini Version)
// ✅ Fixed model name to gemini-2.0-flash

export default async function handler(req, res) {

  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(204).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const { message, history } = req.body || {};
  if (!message) return res.status(400).json({ error: "Missing message" });

  const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
  if (!GEMINI_API_KEY) {
    return res.status(401).json({
      error: "Missing GEMINI_API_KEY — add it in Vercel → Settings → Environment Variables"
    });
  }

  try {
    const geminiHistory = (Array.isArray(history) ? history : []).map(msg => ({
      role: msg.role === "assistant" ? "model" : "user",
      parts: [{ text: msg.content }]
    }));

    // ✅ FIXED: Updated to gemini-2.0-flash (latest free model)
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          system_instruction: {
            parts: [{
              text: `You are CodeStack AI Coder — an expert programming assistant. Your job is to:
1. Write clean, well-commented code in any language requested
2. Debug errors and explain exactly what is wrong and how to fix it
3. Explain programming concepts clearly with examples
4. Optimize code for performance and readability
5. Convert code between languages when asked
Always wrap code in markdown fenced blocks with the language name. Be concise but thorough.`
            }]
          },
          contents: [
            ...geminiHistory,
            { role: "user", parts: [{ text: message }] }
          ],
          generationConfig: {
            maxOutputTokens: 1024,
            temperature: 0.7,
          }
        }),
      }
    );

    if (response.status === 403) {
      return res.status(403).json({ error: "Invalid Gemini API key — check GEMINI_API_KEY in Vercel environment variables" });
    }
    if (!response.ok) {
      const e = await response.json().catch(() => ({}));
      return res.status(response.status).json({ error: e.error?.message || "Gemini API error" });
    }

    const data = await response.json();
    const reply = data.candidates?.[0]?.content?.parts?.[0]?.text || "No response received";
    return res.status(200).json({ reply });

  } catch (err) {
    return res.status(500).json({ error: "Server error: " + err.message });
  }
}

