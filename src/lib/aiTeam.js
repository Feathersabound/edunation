// src/lib/aiTeam.js
const GROK_API_KEY = import.meta.env.VITE_GROK_API_KEY;
const CLAUDE_API_KEY = import.meta.env.VITE_CLAUDE_API_KEY;
const PERPLEXITY_API_KEY = import.meta.env.VITE_PERPLEXITY_API_KEY;

export async function askAllThree(prompt) {
  const [grok, claude, perplexity] = await Promise.all([
    fetch('https://api.x.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${GROK_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'grok-beta',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.7
      })
    }).then(r => r.json()).catch(() => ({ error: 'Grok offline' })),

    fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': CLAUDE_API_KEY,
        'anthropic-version': '2023-06-01',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 1024,
        messages: [{ role: 'user', content: prompt }]
      })
    }).then(r => r.json()).catch(() => ({ error: 'Claude offline' })),

    fetch('https://api.perplexity.ai/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${PERPLEXITY_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'llama-3.1-sonar-large-128k-online',
        messages: [{ role: 'user', content: prompt }]
      })
    }).then(r => r.json()).catch(() => ({ error: 'Perplexity offline' }))
  ]);

  return {
    grok: grok.choices?.[0]?.message?.content || grok.error || '…',
    claude: claude.content?.[0]?.text || claude.error || '…',
    perplexity: perplexity.choices?.[0]?.message?.content || perplexity.error || '…'
  };
}