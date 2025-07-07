// netlify/functions/claude-chat.js - FAST VERSION (No Timeouts)
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
    
    // Set a timeout for the fetch request (8 seconds max)
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000);

    try {
      // Faster Claude API call with reduced tokens
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
          max_tokens: 1500, // Reduced from 3000 to speed up
          system: `You are Rolo, a professional options trading AI. Be concise. Provide specific options strategies with exact strikes and targets. Keep responses under 300 words.`,
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
            error: `Claude API error: ${response.status} - ${errorText.substring(0, 200)}`
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
          source: 'claude_api_fast',
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
            error: 'Claude API response too slow. Try a shorter question or try again.',
            timeout: true
          })
        };
      }
      
      throw fetchError; // Re-throw other errors
    }

  } catch (error) {
    console.error('Function error:', error);
    
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        error: `Unable to connect to Claude AI: ${error.message}`,
        isLive: false,
        troubleshooting: 'Check Claude API key and try a shorter question'
      })
    };
  }
};
