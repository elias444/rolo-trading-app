// netlify/functions/claude-chat.js - REAL CLAUDE API INTEGRATION
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

    // Check if we have Anthropic API key in environment variables
    const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
    
    if (ANTHROPIC_API_KEY) {
      // Call REAL Anthropic Claude API
      return await callRealClaudeAPI(message, ANTHROPIC_API_KEY, headers);
    } else {
      // No API key - return real market data instead of fake AI responses
      return await getRealMarketResponse(message, headers);
    }

  } catch (error) {
    console.error('Claude API Error:', error);
    
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ 
        response: "I'm having trouble processing your request. Could you try asking about a specific ticker or strategy? For example: 'AAPL current price and analysis' or 'SPY options strategies'",
        isLive: false,
        error: true
      })
    };
  }
};

// Call REAL Anthropic Claude API
async function callRealClaudeAPI(message, apiKey, headers) {
  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-3-sonnet-20240229',
        max_tokens: 1000,
        messages: [{
          role: 'user',
          content: `You are Rolo, a professional options trading assistant. The user asked: "${message}"

Please provide specific, actionable options trading advice. Include:
- Specific strike prices and expiration dates
- Entry and exit points
- Risk management strategies
- Current market context

Avoid generic templates. Give real, practical trading advice.`
        }]
      })
    });

    if (!response.ok) {
      throw new Error(`Claude API error: ${response.status}`);
    }

    const data = await response.json();
    
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ 
        response: data.content[0].text,
        isLive: true,
        source: 'real_claude_api'
      })
    };

  } catch (error) {
    console.error('Real Claude API error:', error);
    // Fallback to real market data
    return await getRealMarketResponse(message, headers);
  }
}

// Get real market data response (NO MOCK DATA)
async function getRealMarketResponse(message, headers) {
  try {
    const query = message.toLowerCase();
    const tickerMatches = message.match(/\b[A-Z]{1,5}\b/g) || [];
    
    if (tickerMatches.length > 0) {
      const ticker = tickerMatches[0];
      
      // Get REAL stock data
      const stockData = await getRealStockData(ticker);
      
      if (stockData && !stockData.error) {
        const response = `**${ticker} Real Market Data:**

**Current Price**: $${stockData.price}
**Change**: ${stockData.change >= 0 ? '+' : ''}${stockData.change} (${stockData.changePercent}%)
**Volume**: ${stockData.volume}M shares
**Day Range**: $${stockData.low} - $${stockData.high}
**Previous Close**: $${stockData.prevClose}

**Options Trading Considerations:**
• Price movement of ${stockData.changePercent}% suggests ${Math.abs(parseFloat(stockData.changePercent)) > 2 ? 'elevated volatility' : 'normal volatility'}
• Volume of ${stockData.volume}M is ${parseFloat(stockData.volume) > 20 ? 'above average' : 'normal'}
• Current price near ${parseFloat(stockData.price) > (parseFloat(stockData.low) + parseFloat(stockData.high))/2 ? 'day high' : 'day low'}

**For specific options strategies on ${ticker}, consider:**
• Strike prices around current levels: $${Math.round(parseFloat(stockData.price) * 0.95)} - $${Math.round(parseFloat(stockData.price) * 1.05)}
• Check earnings calendar before entering positions
• Monitor volume for options liquidity

This is live market data for ${ticker}. For detailed options strategies, I'd recommend consulting with a financial advisor or using professional trading platforms with real-time options chains.`;

        return {
          statusCode: 200,
          headers,
          body: JSON.stringify({ 
            response: response,
            isLive: true,
            source: 'real_market_data'
          })
        };
      }
    }
    
    // General market response without mock data
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ 
        response: `I provide real market data and analysis, not simulated responses. 

To get live market analysis:
• Ask about specific tickers: "AAPL current data" or "TSLA analysis"
• Request market information: "SPY current price" or "QQQ volume"
• Check live feeds in the Alerts tab for real social sentiment

For detailed options strategies, I recommend:
• Using professional trading platforms with real-time options chains
• Consulting with licensed financial advisors
• Checking current IV levels and Greeks before trading

What specific ticker would you like real market data for?`,
        isLive: true,
        source: 'real_data_only'
      })
    };

  } catch (error) {
    console.error('Real market response error:', error);
    
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ 
        response: "I'm experiencing technical difficulties. Please try asking about a specific ticker for real market data, or check the live feeds in the Alerts tab.",
        isLive: false,
        error: true
      })
    };
  }
}

// Get REAL stock data (no mock data)
async function getRealStockData(symbol) {
  try {
    const API_KEY = 'MAQEUTLGYYXC1HF1';
    const response = await fetch(`https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${symbol}&apikey=${API_KEY}`);
    const data = await response.json();
    
    if (data['Error Message'] || data['Note']) {
      return { error: 'API limit or invalid symbol' };
    }

    const quote = data['Global Quote'];
    if (!quote || !quote['01. symbol']) {
      return { error: 'No data available' };
    }

    return {
      symbol: quote['01. symbol'],
      price: parseFloat(quote['05. price']).toFixed(2),
      change: parseFloat(quote['09. change']).toFixed(2),
      changePercent: parseFloat(quote['10. change percent'].replace('%', '')).toFixed(2),
      volume: (parseFloat(quote['06. volume']) / 1000000).toFixed(1),
      high: parseFloat(quote['03. high']).toFixed(2),
      low: parseFloat(quote['04. low']).toFixed(2),
      open: parseFloat(quote['02. open']).toFixed(2),
      prevClose: parseFloat(quote['08. previous close']).toFixed(2),
      isLive: true
    };

  } catch (error) {
    console.error('Stock data error:', error);
    return { error: 'Unable to fetch real stock data' };
  }
}
