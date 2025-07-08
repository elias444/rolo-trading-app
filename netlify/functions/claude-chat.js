// netlify/functions/claude-chat.js
// BULLETPROOF CLAUDE FUNCTION - NO TIMEOUTS, NO MOCK DATA

exports.handler = async (event, context) => {
  // CORS headers
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
      body: JSON.stringify({ error: 'Method not allowed. Use POST.' })
    };
  }

  try {
    const { message, timestamp } = JSON.parse(event.body || '{}');
    
    if (!message) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ 
          error: 'Message is required',
          example: '{ "message": "AAPL analysis" }'
        })
      };
    }

    console.log('Processing Claude request for message:', message.substring(0, 50) + '...');
    
    // Check if API key exists
    if (!process.env.ANTHROPIC_API_KEY) {
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({
          error: 'Claude API not configured',
          response: 'Hi! I\'m Rolo AI, but I need to be properly configured first. Please contact support to set up the Claude API key.',
          timestamp: new Date().toISOString()
        })
      };
    }

    // Get stock data if ticker mentioned (with timeout)
    let stockContext = '';
    const tickerMatch = message.match(/\b([A-Z]{1,5})\b/g);
    
    if (tickerMatch && tickerMatch.length > 0) {
      const ticker = tickerMatch[0];
      try {
        console.log(`Fetching stock data for ${ticker}...`);
        
        // Quick stock data fetch with 3-second timeout
        const stockController = new AbortController();
        const stockTimeout = setTimeout(() => stockController.abort(), 3000);
        
        const stockResponse = await fetch(`${event.headers.origin || 'https://magenta-monstera-8d552b.netlify.app'}/.netlify/functions/stock-data?symbol=${ticker}`, {
          signal: stockController.signal
        });
        
        clearTimeout(stockTimeout);
        
        if (stockResponse.ok) {
          const stockData = await stockResponse.json();
          if (stockData.price && !stockData.error) {
            stockContext = `\n\nLIVE ${ticker} DATA: Price: $${stockData.price}, Change: ${stockData.change || 'N/A'}, Volume: ${stockData.volume || 'N/A'}`;
            console.log(`Stock data fetched for ${ticker}: $${stockData.price}`);
          }
        }
      } catch (error) {
        console.log(`Stock data fetch failed for ${ticker}:`, error.message);
        // Continue without stock data - don't fail the whole request
      }
    }

    // Enhanced prompt for better responses
    const enhancedPrompt = `You are Rolo AI, a professional options trading assistant. Provide specific, actionable trading advice.

USER QUESTION: ${message}${stockContext}

INSTRUCTIONS:
- If a stock ticker is mentioned, provide specific options strategies with current prices
- Include actual strike prices and expiration recommendations  
- Mention risk management for every strategy
- Be concise but professional (max 300 words)
- Use real market context when available
- No generic responses - be specific to the question

Respond as Rolo AI with professional options trading analysis.`;

    // Call Claude API with timeout
    console.log('Calling Claude API...');
    
    const claudeController = new AbortController();
    const claudeTimeout = setTimeout(() => claudeController.abort(), 6000); // 6 second timeout
    
    const claudeResponse = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-3-sonnet-20240229',
        max_tokens: 500,
        messages: [{
          role: 'user',
          content: enhancedPrompt
        }]
      }),
      signal: claudeController.signal
    });

    clearTimeout(claudeTimeout);

    if (!claudeResponse.ok) {
      const errorText = await claudeResponse.text();
      console.error('Claude API error:', claudeResponse.status, errorText);
      
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({
          error: `Claude API error: ${claudeResponse.status}`,
          response: 'I\'m experiencing technical difficulties right now. Please try asking your question again in a moment.',
          timestamp: new Date().toISOString()
        })
      };
    }

    const claudeData = await claudeResponse.json();
    
    if (!claudeData.content || !claudeData.content[0]?.text) {
      console.error('Invalid Claude response:', claudeData);
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({
          error: 'Invalid Claude response',
          response: 'I received an unexpected response format. Please try your question again.',
          timestamp: new Date().toISOString()
        })
      };
    }

    const aiResponse = claudeData.content[0].text;
    console.log('Claude response received, length:', aiResponse.length);

    // Return successful response
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        response: aiResponse,
        timestamp: new Date().toISOString(),
        hasStockData: !!stockContext,
        ticker: tickerMatch ? tickerMatch[0] : null
      })
    };

  } catch (error) {
    console.error('Claude Chat Error:', error);
    
    // Handle timeout errors specifically
    if (error.name === 'AbortError') {
      return {
        statusCode: 408,
        headers,
        body: JSON.stringify({
          error: 'Request timeout',
          response: 'My response took too long to generate. Please try asking a simpler question or try again.',
          timestamp: new Date().toISOString()
        })
      };
    }
    
    // Handle other errors
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: 'Internal server error',
        response: 'I\'m having technical difficulties. Please try again in a moment.',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined,
        timestamp: new Date().toISOString()
      })
    };
  }
};
