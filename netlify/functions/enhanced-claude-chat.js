// netlify/functions/enhanced-claude-chat.js - CLAUDE AI WITH COMPREHENSIVE INTELLIGENCE
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
          error: 'Claude API key not configured'
        })
      };
    }

    console.log(`🧠 ENHANCED CLAUDE REQUEST: ${message.substring(0, 50)}...`);
    
    // 🚀 EXTRACT TICKERS from message
    const tickers = extractTickers(message);
    let comprehensiveIntelligence = '';
    
    // 🔥 GATHER COMPREHENSIVE INTELLIGENCE if tickers detected
    if (tickers.length > 0 && requestIntelligence) {
      console.log(`📊 Gathering intelligence for: ${tickers.join(', ')}`);
      
      try {
        // Get comprehensive market intelligence for primary ticker
        const primaryTicker = tickers[0];
        const intelligenceResponse = await fetch(`${getBaseUrl(event)}/.netlify/functions/market-intelligence?symbol=${primaryTicker}`);
        
        if (intelligenceResponse.ok) {
          const intelligence = await intelligenceResponse.json();
          comprehensiveIntelligence = intelligence.claudeContext || '';
          console.log(`✅ Intelligence gathered for ${primaryTicker}`);
        }
      } catch (error) {
        console.error('Intelligence gathering failed:', error);
        // Continue without intelligence if it fails
      }
    }

    // 🎯 ENHANCED SYSTEM PROMPT with current context
    const currentDate = new Date();
    const enhancedSystemPrompt = `You are Rolo, the ultimate AI trading assistant with access to comprehensive market intelligence.

CURRENT CONTEXT:
- Date: ${currentDate.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
- Time: ${currentDate.toLocaleTimeString('en-US')}
- Market Status: ${getMarketStatus(currentDate)}

CAPABILITIES:
You have access to REAL-TIME multi-source market intelligence including:
✅ Real-time stock prices (Alpha Vantage premium)
✅ Technical indicators (RSI, MACD, SMA, EMA)
✅ Social sentiment (Discord, StockTwits, Reddit)
✅ Market breadth (VIX, sector performance)
✅ Options flow data
✅ News sentiment analysis

RESPONSE GUIDELINES:
- Always use CURRENT prices and data provided in messages
- Give specific options strategies with exact strikes and entry/exit points
- Consider technical, fundamental, AND sentiment analysis
- Include risk management and position sizing
- Reference current market conditions and social sentiment
- Provide actionable trading recommendations

TRADING FOCUS:
- Options strategies (calls, puts, spreads, condors)
- Risk-defined trades with clear profit targets
- Current market volatility environment
- Social sentiment integration with technical analysis
- Professional risk management principles`;

    // 🔧 CONSTRUCT ENHANCED MESSAGE with intelligence
    const enhancedMessage = comprehensiveIntelligence ? 
      `${message}\n\n--- REAL-TIME MARKET INTELLIGENCE ---\n${comprehensiveIntelligence}\n\nBASE YOUR ANALYSIS ON THE COMPREHENSIVE DATA ABOVE.` : 
      message;

    // 🤖 CLAUDE API CALL with enhanced context
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 12000); // 12-second timeout

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
      
      // 📊 POST ANALYSIS TO DISCORD (optional)
      if (tickers.length > 0 && process.env.DISCORD_CHANNEL_ID) {
        try {
          const analysisData = {
            symbol: tickers[0],
            response: data.content[0].text.substring(0, 500) + '...', // Truncated for Discord
            timestamp: new Date().toISOString()
          };
          
          // Post to Discord (fire and forget)
          fetch(`${getBaseUrl(event)}/.netlify/functions/discord-integration?symbol=${tickers[0]}&action=post_analysis`, {
            method: 'POST',
            body: JSON.stringify(analysisData)
          }).catch(err => console.log('Discord post failed:', err));
        } catch (discordError) {
          console.log('Discord integration skipped:', discordError);
        }
      }
      
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ 
          response: data.content[0].text,
          hasIntelligence: !!comprehensiveIntelligence,
          tickersAnalyzed: tickers,
          timestamp: new Date().toISOString(),
          sources: comprehensiveIntelligence ? [
            'Real-time stock data',
            'Technical indicators', 
            'Social sentiment',
            'Market breadth',
            'Options flow'
          ] : ['Claude knowledge base']
        })
      };

    } catch (fetchError) {
      clearTimeout(timeoutId);
      
      if (fetchError.name === 'AbortError') {
        console.log('Claude API call timed out');
        return {
          statusCode: 408,
          headers,
          body: JSON.stringify({ 
            error: 'Analysis taking too long. Try asking about one ticker at a time.',
            timeout: true,
            suggestion: 'Use shorter questions like "SPY calls" instead of complex multi-ticker requests'
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
  // Enhanced ticker detection
  const tickerPattern = /\b([A-Z]{1,5})\b/g;
  const matches = message.toUpperCase().match(tickerPattern) || [];
  
  // Filter out common words that aren't tickers
  const commonWords = [
    'THE', 'AND', 'FOR', 'ARE', 'BUT', 'NOT', 'YOU', 'ALL', 'CAN', 'HER', 'WAS', 'ONE', 
    'OUR', 'OUT', 'DAY', 'GET', 'HAS', 'HIM', 'HIS', 'HOW', 'ITS', 'MAY', 'NEW', 'NOW', 
    'OLD', 'SEE', 'TWO', 'WHO', 'BOY', 'DID', 'GOT', 'LET', 'MAN', 'PUT', 'RUN', 'SET', 
    'TRY', 'USE', 'WIN', 'YES', 'API', 'VIX', 'RSI', 'MACD', 'SMA', 'EMA', 'AI', 'USD'
  ];
  
  // Known stock tickers to include even if they might be common words
  const knownTickers = [
    'SPY', 'QQQ', 'AAPL', 'TSLA', 'NVDA', 'MSFT', 'GOOGL', 'AMZN', 'META', 'HOOD',
    'AMD', 'COIN', 'GME', 'AMC', 'PLTR', 'SOFI', 'F', 'BAC', 'JPM', 'XOM', 'CVX'
  ];
  
  const validTickers = matches.filter(ticker => 
    (knownTickers.includes(ticker) || (!commonWords.includes(ticker) && ticker.length >= 2 && ticker.length <= 5))
  );
  
  // Remove duplicates and limit to 2 tickers to avoid timeouts
  return [...new Set(validTickers)].slice(0, 2);
}

// 📊 GET MARKET STATUS
function getMarketStatus(currentDate) {
  const hour = currentDate.getHours();
  const day = currentDate.getDay();
  
  // Weekend
  if (day === 0 || day === 6) return 'Market Closed (Weekend)';
  
  // Weekday hours (ET)
  if (hour < 4) return 'Market Closed';
  if (hour >= 4 && hour < 9.5) return 'Pre-Market';
  if (hour >= 9.5 && hour < 16) return 'Market Open';
  if (hour >= 16 && hour < 20) return 'After Hours';
  return 'Market Closed';
}

// 🌐 GET BASE URL for internal function calls
function getBaseUrl(event) {
  const headers = event.headers;
  const host = headers.host || headers.Host;
  const protocol = headers['x-forwarded-proto'] || 'https';
  return `${protocol}://${host}`;
}