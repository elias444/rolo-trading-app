// netlify/functions/enhanced-claude-chat.js
// ENHANCED ROLO AI - ZERO MOCK DATA, REAL INTELLIGENCE ONLY

exports.handler = async (event, context) => {
  // CORS headers
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
    const { message, context: userContext, timestamp } = JSON.parse(event.body);
    
    if (!message) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Message is required' })
      };
    }

    // Get real stock data if ticker mentioned
    let stockData = null;
    let marketContext = '';
    
    // Extract ticker symbols from message
    const tickerMatch = message.match(/\b([A-Z]{1,5})\b/g);
    if (tickerMatch) {
      const ticker = tickerMatch[0];
      try {
        // Get REAL stock data from Alpha Vantage
        const stockResponse = await fetch(`${event.headers.origin}/.netlify/functions/stock-data?symbol=${ticker}`);
        if (stockResponse.ok) {
          stockData = await stockResponse.json();
          
          if (stockData && stockData.price) {
            marketContext = `\n\nCURRENT MARKET DATA for ${ticker}:
- Price: $${stockData.price}
- Volume: ${stockData.volume || 'N/A'}
- Change: ${stockData.change || 'N/A'}
- Market Cap: ${stockData.marketCap || 'N/A'}
- 52-Week High: ${stockData.high52Week || 'N/A'}
- 52-Week Low: ${stockData.low52Week || 'N/A'}
- P/E Ratio: ${stockData.peRatio || 'N/A'}`;
          }
        }
      } catch (error) {
        console.log('Stock data fetch failed:', error.message);
      }
    }

    // Enhanced prompt for Claude with real market context
    const enhancedPrompt = `You are Rolo AI, the world's smartest options trading assistant. You have access to LIVE market data and provide professional-grade options analysis.

USER QUESTION: ${message}

${marketContext}

ANALYSIS REQUIREMENTS:
1. If a ticker is mentioned, use the REAL current price data provided above
2. Provide specific options strategies with actual strike prices based on current price
3. Include entry points, profit targets, and risk management
4. Consider current market conditions and volatility
5. Give actionable, professional advice
6. No generic responses - be specific to the ticker and current market conditions

RESPONSE STYLE:
- Professional but accessible
- Include specific strike prices and expiration dates
- Mention risk management for every strategy
- Use real market data in your analysis
- Be concise but comprehensive
- Include profit/loss scenarios with actual numbers

If no ticker is mentioned, provide general options education or strategy guidance appropriate to the question.`;

    // Call Claude API
    const claudeResponse = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-3-sonnet-20240229',
        max_tokens: 1000,
        messages: [{
          role: 'user',
          content: enhancedPrompt
        }]
      })
    });

    if (!claudeResponse.ok) {
      const errorText = await claudeResponse.text();
      console.error('Claude API error:', errorText);
      throw new Error('Claude API request failed');
    }

    const claudeData = await claudeResponse.json();
    
    if (!claudeData.content || !claudeData.content[0]?.text) {
      throw new Error('Invalid response from Claude API');
    }

    const aiResponse = claudeData.content[0].text;

    // Return the intelligent response
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        response: aiResponse,
        timestamp: new Date().toISOString(),
        hasMarketData: !!stockData,
        ticker: tickerMatch ? tickerMatch[0] : null
      })
    };

  } catch (error) {
    console.error('Enhanced Claude Chat Error:', error);
    
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: 'Enhanced AI temporarily unavailable',
        message: 'Please try again in a moment.',
        timestamp: new Date().toISOString()
      })
    };
  }
};
