// netlify/functions/claude-chat.js - BASIC CLAUDE CHAT (FALLBACK)
exports.handler = async (event, context) => {
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

    const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
    
    if (!ANTHROPIC_API_KEY) {
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ 
          error: 'ANTHROPIC_API_KEY environment variable not set'
        })
      };
    }

    console.log(`💬 BASIC CLAUDE REQUEST: ${message.substring(0, 50)}...`);

    // Basic system prompt for trading
    const systemPrompt = `You are Rolo, a professional AI trading assistant specializing in options trading.

CURRENT CONTEXT:
- Date: ${new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
- Time: ${new Date().toLocaleTimeString('en-US')}

CAPABILITIES:
- Options trading strategies and analysis
- Risk management recommendations
- Technical analysis insights
- Market condition assessment

RESPONSE GUIDELINES:
- Provide specific options strategies with strikes when possible
- Include risk management and position sizing
- Give actionable trading recommendations
- Keep responses professional but accessible
- Focus on education and risk awareness

Always remind users that trading involves risk and to do their own research.`;

    // Claude API call
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 1000,
        system: systemPrompt,
        messages: [{
          role: 'user',
          content: message
        }]
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Claude API error:', response.status, errorText);
      
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ 
          error: `Claude API error: ${response.status}`,
          details: 'Check API key and credits'
        })
      };
    }

    const data = await response.json();
    console.log('✅ Basic Claude response generated');
    
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ 
        response: data.content[0].text,
        type: 'basic',
        timestamp: new Date().toISOString()
      })
    };

  } catch (error) {
    console.error('Basic Claude function error:', error);
    
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        error: `Basic Claude AI failed: ${error.message}`,
        suggestion: 'Check your API configuration and network connection'
      })
    };
  }
};
