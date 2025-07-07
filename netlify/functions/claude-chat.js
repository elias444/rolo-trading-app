// netlify/functions/claude-chat.js - REPLACE YOUR EXISTING FILE WITH THIS
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

    // Get API key from environment variables (SECURE)
    const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
    
    if (!ANTHROPIC_API_KEY) {
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ 
          error: 'Claude API key not configured. Please add ANTHROPIC_API_KEY to environment variables.' 
        })
      };
    }

    // Call REAL Anthropic Claude API - NO FALLBACKS TO MOCK DATA
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-3-sonnet-20240229', // You can use claude-3-5-sonnet-20241022 for latest
        max_tokens: 1500,
        system: `You are Rolo, a professional options trading assistant. You provide:
- Specific, actionable options trading strategies
- Exact strike prices and expiration dates  
- Clear entry and exit points with reasoning
- Risk management strategies
- Current market context analysis
- NO generic advice - only specific, actionable recommendations

Be direct, specific, and avoid disclaimers. Focus on practical trading strategies.`,
        messages: [{
          role: 'user',
          content: message
        }]
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(`Claude API error: ${response.status} - ${errorData.error?.message || response.statusText}`);
    }

    const data = await response.json();
    
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ 
        response: data.content[0].text,
        isLive: true,
        source: 'claude_api',
        model: 'claude-3-sonnet'
      })
    };

  } catch (error) {
    console.error('Claude API Error:', error);
    
    // NO MOCK DATA - Return real error
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        error: `Unable to process request: ${error.message}. Please check API configuration.`,
        isLive: false
      })
    };
  }
};
