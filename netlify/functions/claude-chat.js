// netlify/functions/claude-chat.js
// CLEAN VERSION - NO MOCK DATA ANYWHERE
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
      body: JSON.stringify({ 
        error: 'Method not allowed. Please use POST request.' 
      })
    };
  }

  try {
    const { message } = JSON.parse(event.body);
    
    if (!message) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ 
          error: 'Message parameter required in request body' 
        })
      };
    }

    // Get Claude API key from environment variables
    const CLAUDE_API_KEY = process.env.ANTHROPIC_API_KEY;
    
    if (!CLAUDE_API_KEY) {
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ 
          error: 'Claude API key not configured in Netlify environment variables',
          suggestion: 'Add ANTHROPIC_API_KEY to your Netlify site settings'
        })
      };
    }

    console.log('Processing Claude request for message:', message.substring(0, 50) + '...');

    // Create trading-focused prompt
    const tradingPrompt = `You are Rolo, an expert AI trading assistant specializing in options trading and technical analysis. You provide professional, data-driven trading advice.

Key capabilities:
- Analyze ANY publicly traded stock ticker
- Provide specific options strategies with strike prices and expiration dates
- Explain technical analysis and market conditions
- Offer risk management advice
- Educational content about trading concepts

Always be:
- Professional and knowledgeable
- Specific with recommendations (exact strikes, dates, prices when possible)
- Clear about risks involved
- Educational in your explanations

User message: ${message}

Provide expert trading analysis and recommendations.`;

    // Call Claude API
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': CLAUDE_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-3-sonnet-20240229',
        max_tokens: 1500,
        messages: [
          {
            role: 'user',
            content: tradingPrompt
          }
        ]
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Claude API error: HTTP ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    
    if (!data.content || !data.content[0] || !data.content[0].text) {
      throw new Error('Invalid response format from Claude API');
    }

    const aiResponse = data.content[0].text;

    console.log('✅ Claude response generated successfully');

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ 
        response: aiResponse,
        isLive: true,
        source: 'Claude AI'
      })
    };

  } catch (error) {
    console.error('Claude API Error:', error);
    
    // Return error - NO MOCK responses
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        error: `AI chat unavailable: ${error.message}`,
        isLive: false,
        suggestion: 'Please check your Claude API key and try again'
      })
    };
  }
};
