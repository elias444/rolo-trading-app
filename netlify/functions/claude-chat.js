// netlify/functions/claude-chat.js
exports.handler = async (event, context) => {
  // Handle CORS
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS'
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
    const { message } = JSON.parse(event.body);
    
    if (!message) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Message required' })
      };
    }

    const CLAUDE_API_KEY = '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';
    
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': CLAUDE_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-3-sonnet-20240229',
        max_tokens: 1024,
        messages: [
          {
            role: 'user',
            content: `You are Rolo, an AI trading assistant. You help with stock analysis, options trading, and market insights. Be helpful, concise, and focused on trading. User message: ${message}`
          }
        ]
      })
    });

    if (!response.ok) {
      throw new Error(`Claude API error: ${response.status}`);
    }

    const data = await response.json();
    const aiResponse = data.content[0].text;

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ 
        response: aiResponse,
        isLive: true 
      })
    };

  } catch (error) {
    console.error('Claude API Error:', error);
    
    // Fallback response
    const fallbackResponse = `🤖 Rolo here! I'm having a brief connection issue, but I'm still here to help with your trading questions. 

Based on your message, here are some general trading reminders:
- Always manage your risk
- Plan your trades before entering
- Keep emotions in check
- Focus on high-probability setups

Try asking me again in a moment! 💪`;

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ 
        response: fallbackResponse,
        isLive: false,
        fallback: true 
      })
    };
  }
};