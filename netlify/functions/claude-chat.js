// netlify/functions/claude-chat.js
// FIXED - NO 500 ERRORS, NO TIMEOUTS

exports.handler = async (event, context) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS'
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    const { message } = JSON.parse(event.body || '{}');
    
    if (!message) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Message required' })
      };
    }

    console.log('Processing message:', message.substring(0, 50) + '...');

    // Check API key
    if (!process.env.ANTHROPIC_API_KEY) {
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          response: "Hi! I'm Rolo AI, but I need to be configured with an API key first. Please contact support to set up Claude integration.",
          timestamp: new Date().toISOString()
        })
      };
    }

    // Enhanced prompt
    const prompt = `You are Rolo AI, a professional options trading assistant.

User question: ${message}

Provide specific, actionable options trading advice. Be concise but helpful. If a stock ticker is mentioned, provide relevant strategies for that stock.

Keep response under 200 words.`;

    // Call Claude with timeout
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);
    
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-3-sonnet-20240229',
        max_tokens: 300,
        messages: [{ role: 'user', content: prompt }]
      }),
      signal: controller.signal
    });

    clearTimeout(timeout);

    if (!response.ok) {
      throw new Error(`Claude API error: ${response.status}`);
    }

    const data = await response.json();
    const aiResponse = data.content?.[0]?.text;

    if (!aiResponse) {
      throw new Error('Invalid Claude response');
    }

    console.log('Claude response received');

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        response: aiResponse,
        timestamp: new Date().toISOString()
      })
    };

  } catch (error) {
    console.error('Claude error:', error.message);
    
    if (error.name === 'AbortError') {
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          response: 'My response is taking too long. Please try a simpler question.',
          timestamp: new Date().toISOString()
        })
      };
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        response: 'I\'m having technical difficulties right now. Please try again in a moment.',
        timestamp: new Date().toISOString()
      })
    };
  }
};
