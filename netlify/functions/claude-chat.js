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

    console.log('🚀 Processing Claude request:', message.substring(0, 50) + '...');

    const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
    
    if (!ANTHROPIC_API_KEY) {
      console.log('❌ No Claude API key found');
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ 
          error: 'Claude API key not configured. Please add ANTHROPIC_API_KEY to environment variables.',
          fallback: true
        })
      };
    }

    // 🚀 OPTIMIZED FOR SPEED - Shorter prompts, faster responses
    const systemPrompt = `You are Rolo, a concise options trading AI. Keep responses under 150 words. 

Current time: ${new Date().toLocaleString()}

RULES:
- Be specific and actionable
- Include exact strikes and expirations when possible  
- Always mention risk management
- Use bullet points for clarity
- Be direct, no fluff

Focus on: Options strategies, risk management, specific trade ideas.`;

    // 🏃‍♂️ FAST API CALL - 7-second timeout to stay under Netlify's 10-second limit
    const controller = new AbortController();
    const timeoutId = setTimeout(() => {
      console.log('⏰ Claude API timeout after 7 seconds');
      controller.abort();
    }, 7000); // 7 seconds - safe margin

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
          model: 'claude-3-5-sonnet-20241022', // Latest fast model
          max_tokens: 800, // Shorter responses = faster processing
          system: systemPrompt,
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
            details: 'Check API key and credits',
            fallback: true
          })
        };
      }

      const data = await response.json();
      console.log('✅ Claude API success!');
      
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ 
          response: data.content[0].text,
          isLive: true,
          source: 'Claude AI'
        })
      };

    } catch (fetchError) {
      clearTimeout(timeoutId);
      
      if (fetchError.name === 'AbortError') {
        console.log('⏰ Claude API timed out');
        
        // Smart fallback for timeouts
        const query = message.toLowerCase();
        let fallbackResponse = '';

        if (query.includes('hood')) {
          fallbackResponse = `🏹 **HOOD Quick Analysis:**\n\nRobinhood around current levels:\n• Consider $25 calls for momentum\n• $22 puts for downside protection\n• Watch earnings and user growth\n• Risk: High volatility\n\n*Response generated due to timeout*`;
        } else if (query.includes('aapl')) {
          fallbackResponse = `🍎 **AAPL Quick Analysis:**\n\nApple at current price:\n• Solid for covered calls\n• Consider monthly spreads\n• Watch iPhone sales data\n• Lower risk, steady growth\n\n*Response generated due to timeout*`;
        } else if (query.includes('spy')) {
          fallbackResponse = `📈 **SPY Quick Analysis:**\n\nS&P 500 ETF strategies:\n• 0DTE for quick plays\n• Monthly spreads for income\n• Watch Fed policy\n• Good liquidity\n\n*Response generated due to timeout*`;
        } else {
          fallbackResponse = `🤖 **Rolo AI** (Timeout Fallback)\n\nI'm having response delays. Try asking about specific stocks like:\n• AAPL analysis\n• HOOD options\n• SPY strategies\n\nKeep questions short for faster responses.`;
        }

        return {
          statusCode: 200,
          headers,
          body: JSON.stringify({ 
            response: fallbackResponse,
            isLive: false,
            timeout: true,
            source: 'Rolo Smart Fallback'
          })
        };
      }
      
      throw fetchError;
    }

  } catch (error) {
    console.error('Claude function error:', error);
    
    // Emergency fallback
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ 
        response: `🤖 **Rolo AI** - Connection Issue\n\nI'm experiencing technical difficulties. Please try:\n• Shorter questions\n• Specific stock symbols (AAPL, HOOD, SPY)\n• Refresh and try again\n\nSystem will auto-recover.`,
        isLive: false,
        error: true,
        source: 'Emergency Fallback'
      })
    };
  }
};
