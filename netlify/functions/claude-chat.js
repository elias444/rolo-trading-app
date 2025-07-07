// netlify/functions/claude-chat.js - PRODUCTION VERSION
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

    // Get API key from environment variables
    const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
    
    if (!ANTHROPIC_API_KEY) {
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ 
          error: 'Claude API key not configured. Please add ANTHROPIC_API_KEY to environment variables.',
          troubleshooting: 'Set up your Anthropic API key in Netlify environment variables'
        })
      };
    }

    console.log(`Processing Claude request for message: ${message.substring(0, 50)}...`);

    // Call REAL Claude API
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 3000,
        system: `You are Rolo, a professional options trading AI assistant with access to real-time market data. Provide specific, actionable options trading strategies with:

- Exact strike prices and expiration dates based on current market conditions
- Specific entry prices, exit targets, and stop losses
- Professional risk management with position sizing recommendations
- Current market context and reasoning using real-time data
- No generic advice - only specific, executable strategies with real market analysis

Focus on high-probability setups with clear risk/reward ratios. Use current market data provided to give precise, timely recommendations.`,
        messages: [{
          role: 'user',
          content: message
        }]
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('Claude API error:', response.status, errorData);
      
      throw new Error(`Claude API error: ${response.status} - ${errorData.error?.message || response.statusText}`);
    }

    const data = await response.json();
    
    console.log('Claude API response received successfully');
    
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ 
        response: data.content[0].text,
        isLive: true,
        source: 'real_claude_api',
        model: 'claude-3-5-sonnet',
        timestamp: new Date().toISOString()
      })
    };

  } catch (error) {
    console.error('Claude API Error:', error);
    
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        error: `Unable to connect to Claude AI: ${error.message}`,
        isLive: false,
        troubleshooting: 'Check Claude API key configuration, account credits, and network connectivity',
        timestamp: new Date().toISOString()
      })
    };
  }
};
