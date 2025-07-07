// netlify/functions/enhanced-claude-chat.js - SIMPLIFIED WORKING VERSION
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
    const { message, requestIntelligence = true } = JSON.parse(event.body);
    
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

    console.log(`🧠 ENHANCED CLAUDE REQUEST: ${message.substring(0, 50)}...`);
    
    // 🚀 EXTRACT TICKERS from message
    const tickers = extractTickers(message);
    let enhancedContext = '';
    
    // 🔥 ADD REAL-TIME CONTEXT if tickers detected
    if (tickers.length > 0 && requestIntelligence) {
      console.log(`📊 Adding context for: ${tickers.join(', ')}`);
      enhancedContext = await getQuickMarketContext(tickers[0]);
    }

    // 🎯 ENHANCED SYSTEM PROMPT
    const currentDate = new Date();
    const enhancedSystemPrompt = `You are Rolo, the ultimate AI trading assistant with enhanced market intelligence.

CURRENT CONTEXT:
- Date: ${currentDate.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
- Time: ${currentDate.toLocaleTimeString('en-US')}
- Market Status: ${getMarketStatus(currentDate)}

ENHANCED CAPABILITIES:
You provide professional options trading analysis with:
✅ Real-time market awareness
✅ Specific options strategies with exact strikes
✅ Professional risk management
✅ Current market context integration
✅ Social sentiment consideration

RESPONSE GUIDELINES:
- Give specific options strategies with exact strikes and entry/exit points
- Include comprehensive risk management and position sizing
- Reference current market conditions when provided
- Provide actionable, professional trading recommendations
- Focus on risk-defined strategies and education

TRADING FOCUS:
- Options strategies (calls, puts, spreads, condors, straddles)
- Risk-defined trades with clear profit targets and stop losses
- Current market volatility environment consideration
- Professional risk management principles
- Educational value with practical application`;

    // 🔧 CONSTRUCT ENHANCED MESSAGE
    const enhancedMessage = enhancedContext ? 
      `${message}\n\n--- CURRENT MARKET CONTEXT ---\n${enhancedContext}\n\nBASE YOUR ANALYSIS ON THIS REAL-TIME DATA.` : 
      message;

    // 🤖 CLAUDE API CALL
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

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
          max_tokens: 1200,
          system: enhancedSystemPrompt,
          messages: [{
            role: 'user',
            content: enhancedMessage
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
    'AMD', 'COIN', 'GME', 'AMC', 'PLTR', 'SOFI', 'F', 'BAC', 'JPM', 'XOM', 'CVX'
  ];
  
  const validTickers = matches.filter(ticker => 
    (knownTickers.includes(ticker) || (!commonWords.includes(ticker) && ticker.length >= 2 && ticker.length <= 5))
  );
  
  return [...new Set(validTickers)].slice(0, 2);
}

// 📊 GET QUICK MARKET CONTEXT
async function getQuickMarketContext(symbol) {
  try {
    const API_KEY = process.env.ALPHA_VANTAGE_API_KEY;
    
    if (!API_KEY) {
      return `Enhanced analysis for ${symbol} (market data unavailable - API key not configured)`;
    }

    // Quick stock data fetch with timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3000);
    
    const url = `https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${symbol}&entitlement=realtime&apikey=${API_KEY}`;
    
    const response = await fetch(url, { signal: controller.signal });
    clearTimeout(timeoutId);
    
    const data = await response.json();
    const quote = data['Global Quote'];
    
    if (quote) {
      const price = parseFloat(quote['05. price']);
      const change = parseFloat(quote['09. change']);
      const changePercent = parseFloat(quote['10. change percent'].replace('%', ''));
      const volume = parseFloat(quote['06. volume']);
      
      return `REAL-TIME ${symbol} DATA:
• Price: $${price.toFixed(2)} | Change: ${change >= 0 ? '+' : ''}${change.toFixed(2)} (${changePercent.toFixed(2)}%)
• Volume: ${(volume / 1000000).toFixed(1)}M shares
• Trading Range: $${quote['04. low']} - $${quote['03. high']}
• Market Trend: ${changePercent > 1 ? 'Strong Bullish' : changePercent > 0 ? 'Bullish' : changePercent < -1 ? 'Strong Bearish' : changePercent < 0 ? 'Bearish' : 'Neutral'}

PROVIDE SPECIFIC OPTIONS STRATEGIES BASED ON THIS CURRENT PRICE ACTION.`;
    }
    
    return `${symbol} analysis (real-time data temporarily unavailable)`;
    
  } catch (error) {
    console.log(`Quick context fetch failed for ${symbol}:`, error.message);
    return `${symbol} enhanced analysis (using market knowledge)`;
  }
}

// 📊 GET MARKET STATUS
function getMarketStatus(currentDate) {
  const hour = currentDate.getHours();
  const day = currentDate.getDay();
  
  if (day === 0 || day === 6) return 'Market Closed (Weekend)';
  
  if (hour < 4) return 'Market Closed';
  if (hour >= 4 && hour < 9.5) return 'Pre-Market';
  if (hour >= 9.5 && hour < 16) return 'Market Open';
  if (hour >= 16 && hour < 20) return 'After Hours';
  return 'Market Closed';
}
