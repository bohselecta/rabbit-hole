// Vercel Serverless Function
// Place this file at: /api/chat.js

export default async function handler(req, res) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { prompt, systemPrompt, maxTokens = 2000 } = req.body;

  // Validate input
  if (!prompt || !systemPrompt) {
    return res.status(400).json({ error: 'Missing required fields: prompt and systemPrompt' });
  }

  // Get API key from environment (server-side only)
  const apiKey = process.env.DEEPSEEK_API_KEY;
  
  if (!apiKey) {
    console.error('DEEPSEEK_API_KEY environment variable not set');
    return res.status(500).json({ error: 'Server configuration error' });
  }

  try {
    const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: prompt }
        ],
        max_tokens: maxTokens,
        temperature: 0.7,
        stream: false
      })
    });

    // Check if response is ok
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('DeepSeek API Error:', errorData);
      return res.status(response.status).json({ 
        error: errorData.error?.message || 'DeepSeek API request failed' 
      });
    }

    const data = await response.json();
    
    // Return the completion
    return res.status(200).json({
      content: data.choices[0].message.content,
      usage: data.usage // Optional: include token usage stats
    });

  } catch (error) {
    console.error('Serverless function error:', error);
    return res.status(500).json({ 
      error: 'Failed to process request',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}

// Optional: Add rate limiting
// You can use libraries like 'express-rate-limit' or implement custom logic
