// netlify/functions/claude-chat.js - OPTIMIZED FOR 10-SECOND NETLIFY LIMIT
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
          error: 'Claude API key not configured. Please add ANTHROPIC_API_KEY to environment variables.'
        })
      };
    }

    console.log(`Processing Claude request: ${message.substring(0, 50)}...`);
    
    // 🔧 OPTIMIZED: Simpler, faster system prompt
    const optimizedSystemPrompt = `You are Rolo, a professional options trading AI. Today is ${new Date().toLocaleDateString('en-US')}.

CRITICAL: 
- Use CURRENT stock prices provided in messages, NOT training data
- Give specific options strategies with exact strikes
- Keep responses under 800 words for speed
- Focus on actionable trading advice`;

    // 🔧 OPTIMIZED: 8-second timeout to stay under Netlify's 10-second limit
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000);

    try {
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': ANTHROPIC_API_KEY,
          'anthropic-version': '2023-06-01'
        },
        signal: controller.signal,
        body: JSON.stringify({
          model: 'claude-3-5-sonnet-20241022',
          max_tokens: 800, // 🔧 OPTIMIZED: Reduced from 1500 for faster responses
          system: optimizedSystemPrompt,
          messages: [{
            role: 'user',
            content: message
          }]
        })
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Claude API error:', response.status, errorText);
        
        return {
          statusCode: 500,
          headers,
          body: JSON.stringify({ 
            error: `Claude API error: ${response.status}`,
            suggestion: 'Try a shorter question'
          })
        };
      }

      const data = await response.json();
      console.log('Claude API success! Response length:', data.content[0].text.length);
      
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ 
          response: data.content[0].text,
          isLive: true,
          optimized: true,
          timestamp: new Date().toISOString()
        })
      };

    } catch (fetchError) {
      clearTimeout(timeoutId);
      
      if (fetchError.name === 'AbortError') {
        console.log('Claude API call timed out after 8 seconds');
        return {
          statusCode: 408,
          headers,
          body: JSON.stringify({ 
            error: 'Response too slow. Netlify has a 10-second limit. Try: "AAPL calls" instead of longer questions.',
            timeout: true,
            suggestion: 'Use very short questions like "SPY puts" or "TSLA strategy"'
          })
        };
      }
      
      throw fetchError;
    }

  } catch (error) {
    console.error('Function error:', error);
    
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        error: `Unable to connect to Claude AI: ${error.message}`,
        suggestion: 'Try a very short question like "AAPL calls"'
      })
    };
  }
};
