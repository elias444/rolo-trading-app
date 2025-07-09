// netlify/functions/claude-chat.js - NO MOCK DATA VERSION
exports.handler = async (event, context) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS'
  };

  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: ''
    };
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
        body: JSON.stringify({ error: 'Message is required' })
      };
    }

    // Use your Claude API key if you have one set up
    const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
    
    if (ANTHROPIC_API_KEY) {
      // Try to use real Claude API
      try {
        const response = await fetch('https://api.anthropic.com/v1/messages', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': ANTHROPIC_API_KEY,
            'anthropic-version': '2023-06-01'
          },
          body: JSON.stringify({
            model: 'claude-3-sonnet-20240229',
            max_tokens: 1000,
            messages: [{
              role: 'user',
              content: `You are Rolo, a professional trading assistant. Respond to this trading question with specific, actionable advice: ${message}`
            }]
          })
        });

        if (response.ok) {
          const data = await response.json();
          return {
            statusCode: 200,
            headers,
            body: JSON.stringify({ 
              response: data.content[0].text,
              isLive: true,
              source: 'Claude API'
            })
          };
        }
      } catch (apiError) {
        console.error('Claude API error:', apiError);
        // Fall through to professional responses below
      }
    }

    // Professional trading responses (NO MOCK DATA)
    const query = message.toLowerCase();
    let response = '';

    if (query.includes('aapl') || query.includes('apple')) {
      response = `📊 AAPL Analysis:\n\nApple is a large-cap tech stock with strong fundamentals. Key factors to watch:\n• iPhone sales trends\n• Services revenue growth\n• China market performance\n• Dividend sustainability\n\nCurrent technical levels and options strategies depend on real-time data. What's your timeframe for this trade?`;
    } else if (query.includes('tsla') || query.includes('tesla')) {
      response = `⚡ TSLA Analysis:\n\nTesla is known for high volatility. Key factors:\n• EV delivery numbers\n• Autonomous driving updates\n• Competition from legacy automakers\n• Regulatory environment\n\nHigh risk, high reward play. Always use stop losses with TSLA! What's your risk tolerance?`;
    } else if (query.includes('spy') || query.includes('s&p')) {
      response = `📈 SPY Analysis:\n\nS&P 500 ETF - the market benchmark. Watch for:\n• Fed policy changes\n• Economic data releases\n• Market breadth indicators\n• VIX levels for volatility\n\nGreat for options strategies. Are you looking at calls, puts, or spreads?`;
    } else if (query.includes('hood') || query.includes('robinhood')) {
      response = `🎯 HOOD Analysis:\n\nRobinhood is a fintech stock with high beta. Key drivers:\n• Monthly active users\n• Revenue per user\n• Crypto trading volume\n• Interest rate environment\n\nVolatile stock - good for day trading but risky for long holds. What's your strategy?`;
    } else if (query.includes('option') || query.includes('call') || query.includes('put')) {
      response = `📊 Options Strategy:\n\nOptions can be powerful but require careful planning:\n• Understand Greeks (Delta, Theta, Vega)\n• Have clear entry and exit rules\n• Never risk more than you can lose\n• Consider implied volatility levels\n\nWhat underlying are you looking at and what's your market outlook?`;
    } else if (query.includes('play') || query.includes('tomorrow') || query.includes('trade')) {
      response = `🎯 Trading Strategy:\n\nFor actionable plays, I need current market data. Key considerations:\n• Market trend and VIX levels\n• Economic calendar events\n• Earnings announcements\n• Technical support/resistance\n\nShare a specific ticker or market outlook and I can provide more targeted analysis!`;
    } else {
      response = `🤖 Hey! I'm Rolo, your trading assistant.\n\nI can help with:\n• Stock analysis and research\n• Options strategies and risk management\n• Market trends and technical analysis\n• Specific trade ideas and setups\n\nTry asking about a specific stock (AAPL, TSLA, SPY) or trading strategy! What's on your mind?`;
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ 
        response: response,
        isLive: false,
        source: 'Rolo Trading Assistant'
      })
    };

  } catch (error) {
    console.error('Chat function error:', error);
    
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        error: 'Sorry, I encountered an error. Please try again.',
        details: error.message
      })
    };
  }
};
