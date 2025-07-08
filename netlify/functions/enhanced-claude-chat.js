// netlify/functions/enhanced-claude-chat.js - RESTORED ORIGINAL WITH LIVE PRICING
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

    console.log('🧠 Processing ENHANCED Claude request:', message.substring(0, 100) + '...');

    const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
    
    if (!ANTHROPIC_API_KEY) {
      console.log('❌ No Claude API key found');
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ 
          error: 'ANTHROPIC_API_KEY environment variable not set'
        })
      };
    }

    // 🔍 EXTRACT TICKERS from user message
    const tickers = extractTickers(message);
    console.log('Detected tickers:', tickers);

    // 📊 GET REAL-TIME MARKET CONTEXT
    let enhancedContext = '';
    let stockData = {};
    
    if (tickers.length > 0) {
      console.log('Fetching real-time data for tickers:', tickers);
      
      // Get real stock data for each ticker
      for (const ticker of tickers.slice(0, 2)) { // Limit to 2 tickers to avoid timeout
        try {
          const contextData = await getQuickMarketContext(ticker);
          if (contextData) {
            enhancedContext += contextData + '\n';
            stockData[ticker] = contextData;
          }
        } catch (error) {
          console.log(`Failed to get data for ${ticker}:`, error.message);
        }
      }
    }

    // 🤖 ENHANCED SYSTEM PROMPT
    const enhancedSystemPrompt = `You are Rolo, a professional options trading AI assistant with access to real-time market data and comprehensive analysis capabilities.

CURRENT MARKET CONTEXT:
${enhancedContext || 'General market analysis mode'}

CORE CAPABILITIES:
- Real-time stock price analysis using Alpha Vantage premium data
- Options trading strategies with specific strikes and expirations
- Technical analysis with RSI, MACD, moving averages
- Risk management and position sizing recommendations
- VIX-aware volatility strategies
- Market sentiment integration

RESPONSE GUIDELINES:
- Use the real-time data provided in your analysis
- Provide specific options strategies with exact strikes
- Include risk management advice
- Reference current market conditions when relevant
- Be direct and actionable for options traders
- Focus on the tickers mentioned: ${tickers.join(', ') || 'general analysis'}

TRADING CONTEXT:
- Current date: ${new Date().toLocaleDateString()}
- Market session: ${getMarketSession()}
- Focus on options trading opportunities

Provide comprehensive, data-driven options trading analysis.`;

    // 🚀 ENHANCED CLAUDE API CALL with real-time context
    const controller = new AbortController();
    const timeoutId = setTimeout(() => {
      console.log('Enhanced Claude API timeout after 9 seconds');
      controller.abort();
    }, 9000); // 9 seconds to stay under Netlify's 10-second limit

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
          max_tokens: 2000,
          system: enhancedSystemPrompt,
          messages: [{
            role: 'user',
            content: enhancedContext ? 
              `${message}\n\n--- CURRENT MARKET CONTEXT ---\n${enhancedContext}\n\nBASE YOUR ANALYSIS ON THIS REAL-TIME DATA.` : 
              message
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
            suggestion: 'Try a shorter question or check API credits'
          })
        };
      }

      const data = await response.json();
      console.log('✅ Enhanced Claude response generated');
      
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ 
          response: data.content[0].text,
          hasIntelligence: !!enhancedContext,
          tickersAnalyzed: tickers,
          timestamp: new Date().toISOString(),
          sources: enhancedContext ? [
            'Real-time stock data',
            'Market context',
            'Enhanced analysis'
          ] : ['Claude knowledge base']
        })
      };

    } catch (fetchError) {
      clearTimeout(timeoutId);
      
      if (fetchError.name === 'AbortError') {
        console.log('Enhanced Claude call timed out');
        return {
          statusCode: 408,
          headers,
          body: JSON.stringify({ 
            error: 'Analysis taking too long. Try asking about one ticker at a time.',
            timeout: true,
            suggestion: 'Use shorter questions like "SPY calls" instead of complex requests'
          })
        };
      }
      
      throw fetchError;
    }

  } catch (error) {
    console.error('Enhanced Claude function error:', error);
    
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        error: `Enhanced Claude AI failed: ${error.message}`,
        fallback: 'Try the basic chat function or check your API configuration'
      })
    };
  }
};

// 🔍 EXTRACT TICKERS from user message
function extractTickers(message) {
  const tickerPattern = /\b([A-Z]{1,5})\b/g;
  const matches = message.toUpperCase().match(tickerPattern) || [];
  
  const commonWords = [
    'THE', 'AND', 'FOR', 'ARE', 'BUT', 'NOT', 'YOU', 'ALL', 'CAN', 'HER', 'WAS', 'ONE', 
    'OUR', 'OUT', 'DAY', 'GET', 'HAS', 'HIM', 'HIS', 'HOW', 'ITS', 'MAY', 'NEW', 'NOW', 
    'OLD', 'SEE', 'TWO', 'WHO', 'BOY', 'DID', 'GOT', 'LET', 'MAN', 'PUT', 'RUN', 'SET', 
    'TRY', 'USE', 'WIN', 'YES', 'API', 'VIX', 'RSI', 'MACD', 'SMA', 'EMA', 'AI', 'USD'
  ];
  
  const knownTickers = [
    'SPY', 'QQQ', 'AAPL', 'TSLA', 'NVDA', 'MSFT', 'GOOGL', 'AMZN', 'META', 'HOOD',
    'AMD', 'COIN', 'GME', 'AMC', 'PLTR', 'SOFI', 'F', 'BAC', 'JPM', 'XOM', 'CVX',
    'BRK.A', 'BRK.B', 'NFLX', 'ADBE', 'CRM', 'UBER', 'LYFT', 'SHOP', 'SQ', 'PYPL'
  ];
  
  const validTickers = matches.filter(ticker => 
    (knownTickers.includes(ticker) || (!commonWords.includes(ticker) && ticker.length >= 2 && ticker.length <= 5))
  );
  
  return [...new Set(validTickers)].slice(0, 2);
}

// 📊 GET QUICK MARKET CONTEXT with real Alpha Vantage data
async function getQuickMarketContext(symbol) {
  try {
    const API_KEY = process.env.ALPHA_VANTAGE_API_KEY;
    
    if (!API_KEY) {
      console.log('No Alpha Vantage API key found');
      return null;
    }

    console.log(`Fetching live data for ${symbol}`);

    // Quick stock data fetch with timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3000);
    
    const url = `https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${symbol}&entitlement=realtime&apikey=${API_KEY}`;
    
    const response = await fetch(url, { signal: controller.signal });
    clearTimeout(timeoutId);
    
    const data = await response.json();
    
    if (data['Error Message']) {
      console.log(`Alpha Vantage error for ${symbol}:`, data['Error Message']);
      return null;
    }
    
    if (data['Note']) {
      console.log(`Alpha Vantage rate limit for ${symbol}:`, data['Note']);
      return null;
    }
    
    const quote = data['Global Quote'];
    
    if (quote && quote['05. price']) {
      const price = parseFloat(quote['05. price']);
      const change = parseFloat(quote['09. change']);
      const changePercent = parseFloat(quote['10. change percent'].replace('%', ''));
      const volume = parseInt(quote['06. volume']) / 1000000; // Convert to millions
      
      console.log(`✅ Got live data for ${symbol}: $${price} (${changePercent}%)`);
      
      return `${symbol} LIVE DATA: Price $${price.toFixed(2)}, Change ${change >= 0 ? '+' : ''}${change.toFixed(2)} (${changePercent.toFixed(2)}%), Volume ${volume.toFixed(1)}M`;
    }
    
    return null;
    
  } catch (error) {
    console.log(`Failed to get market context for ${symbol}:`, error.message);
    return null;
  }
}

// 🕐 GET MARKET SESSION
function getMarketSession() {
  const now = new Date();
  const hour = now.getHours();
  const day = now.getDay();
  
  // Weekend
  if (day === 0 || day === 6) {
    return 'Weekend (Markets Closed)';
  }
  
  // Market hours (9:30 AM - 4:00 PM ET)
  if (hour >= 9 && hour < 16) {
    return 'Regular Trading Hours';
  } else if (hour >= 4 && hour < 20) {
    return 'After Hours Trading';
  } else {
    return 'Pre-Market/Overnight';
  }
}
