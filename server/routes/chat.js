const express = require('express');
const router = express.Router();
const https = require('https');

const SYSTEM_PROMPT = `You are Luxe Library AI Assistant — a warm, knowledgeable, and elegant assistant for Luxe Library, a premium library in Surat, India.

Your personality:
- Friendly, helpful, and concise
- Expert in books, literature, all genres
- Knowledgeable about the library's services

Library info:
- Name: Luxe Library
- Location: Kapodara, Surat, Gujarat, India — 395010
- Phone: +91 96246 07410
- Email: niravahir448@gmail.com
- Hours: Monday to Saturday, 9 AM to 8 PM
- Services: Book lending, book purchase, membership, online ordering, AI recommendations
- Payment: Razorpay (UPI, cards, net banking), Cash on Delivery

You help users with:
1. Book recommendations (by genre, mood, age, author)
2. How to search and filter books on the site
3. How to place orders and checkout
4. Membership benefits
5. Library location and hours
6. Order tracking and bill queries
7. Payment methods and issues
8. Account and profile help

Rules:
- Keep replies concise and warm (under 120 words unless a list is needed)
- Use bullet points only when listing 3 or more items
- Bold important words using **bold**
- If you don't know something, direct them to call +91 96246 07410
- Respond in the same language the user writes in (English, Hindi, or Gujarati)`;

// Make HTTPS request to AI API
function callAPI(apiUrl, apiKey, payload) {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify(payload);
    const urlObj = new URL(apiUrl);
    const options = {
      hostname: urlObj.hostname,
      path: urlObj.pathname,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
        'Content-Length': Buffer.byteLength(body),
      },
    };
    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          if (parsed.error) return reject(new Error(parsed.error.message || 'API error'));
          const text = parsed.choices?.[0]?.message?.content;
          if (text) resolve(text);
          else reject(new Error('Empty response from AI'));
        } catch (e) {
          reject(new Error('Failed to parse AI response'));
        }
      });
    });
    req.on('error', reject);
    req.setTimeout(15000, () => {
      req.destroy();
      reject(new Error('Request timed out'));
    });
    req.write(body);
    req.end();
  });
}

// Make HTTPS request to Anthropic API
function callAnthropicAPI(apiKey, messages) {
  return new Promise((resolve, reject) => {
    const payload = {
      model: 'claude-3-haiku-20240307',
      max_tokens: 600,
      system: SYSTEM_PROMPT,
      messages: messages.slice(-10).map(m => ({ role: m.role, content: m.content })),
      temperature: 0.7
    };
    const body = JSON.stringify(payload);
    const options = {
      hostname: 'api.anthropic.com',
      path: '/v1/messages',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'Content-Length': Buffer.byteLength(body),
      },
    };
    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          if (parsed.type === 'error') return reject(new Error(parsed.error?.message || 'Anthropic API error'));
          const text = parsed.content?.[0]?.text;
          if (text) resolve(text);
          else reject(new Error('Empty response from Anthropic'));
        } catch (e) {
          reject(new Error('Failed to parse Anthropic response'));
        }
      });
    });
    req.on('error', reject);
    req.setTimeout(15000, () => {
      req.destroy();
      reject(new Error('Request timed out'));
    });
    req.write(body);
    req.end();
  });
}

router.post('/', async (req, res) => {
  try {
    const { messages } = req.body;
    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ success: false, message: 'Messages array required' });
    }

    const anthropicKey = process.env.ANTHROPIC_API_KEY;
    const groqKey = process.env.GROQ_API_KEY;
    const grokKey = process.env.GROK_API_KEY;

    // Try Anthropic first if key exists
    if (anthropicKey && !anthropicKey.includes('your-key')) {
      try {
        const reply = await callAnthropicAPI(anthropicKey, messages);
        return res.json({ success: true, reply, model: 'claude-3' });
      } catch (anthropicErr) {
        console.log('Anthropic failed, falling back:', anthropicErr.message);
      }
    }

    // Try Grok (xAI) next
    if (grokKey && !grokKey.includes('your-key')) {
      try {
        const reply = await callAPI('https://api.x.ai/v1/chat/completions', grokKey, {
          model: 'grok-3-mini',
          messages: [
            { role: 'system', content: SYSTEM_PROMPT },
            ...messages.slice(-10).map(m => ({ role: m.role, content: m.content })),
          ],
          max_tokens: 600,
          temperature: 0.7,
        });
        return res.json({ success: true, reply, model: 'grok' });
      } catch (grokErr) {
        console.log('Grok failed, trying Groq:', grokErr.message);
      }
    }

    // Fallback to Groq (LLaMA) — try models in order
    if (groqKey && !groqKey.includes('your-key')) {
      const models = [
        'llama-3.1-8b-instant',
        'llama3-8b-8192',
        'mixtral-8x7b-32768',
      ];

      for (const model of models) {
        try {
          const reply = await callAPI('https://api.groq.com/openai/v1/chat/completions', groqKey, {
            model,
            messages: [
              { role: 'system', content: SYSTEM_PROMPT },
              ...messages.slice(-10).map(m => ({ role: m.role, content: m.content })),
            ],
            max_tokens: 600,
            temperature: 0.7,
          });
          return res.json({ success: true, reply, model });
        } catch (err) {
          console.log(`Model ${model} failed:`, err.message);
          continue;
        }
      }
    }

    // No API key or all models failed
    return res.status(503).json({
      success: false,
      message: 'AI service is currently unavailable. Please check API keys or try again later.',
    });

  } catch (err) {
    console.error('Chat route error:', err.message);
    res.status(500).json({ success: false, message: 'Something went wrong. Please try again.' });
  }
});

// Stats endpoint for admin settings page
router.get('/stats', async (req, res) => {
  const hasAnthropic = !!(process.env.ANTHROPIC_API_KEY && !process.env.ANTHROPIC_API_KEY.includes('your-key'));
  const hasGrok  = !!(process.env.GROK_API_KEY && !process.env.GROK_API_KEY.includes('your-key'));
  const hasGroq  = !!(process.env.GROQ_API_KEY && !process.env.GROQ_API_KEY.includes('your-key'));
  
  let activeModel = 'Not configured';
  if (hasAnthropic) activeModel = 'Anthropic Claude-3';
  else if (hasGrok) activeModel = 'Grok AI (xAI)';
  else if (hasGroq) activeModel = 'Groq LLaMA 3.1';

  res.json({
    success: true,
    stats: {
      activeModel,
      status: (hasAnthropic || hasGrok || hasGroq) ? 'active' : 'inactive',
      features: ['Book recommendations', 'Library info', 'Order help', 'Multilingual (EN/HI/GU)'],
    }
  });
});

module.exports = router;