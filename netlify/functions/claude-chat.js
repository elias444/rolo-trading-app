// netlify/functions/claude-chat.js - OPTIONS TRADING SPECIALIST
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

    console.log('🎯 Processing OPTIONS trading request:', message.substring(0, 50) + '...');

    const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
    
    if (!ANTHROPIC_API_KEY) {
      console.log('❌ No Claude API key found - using smart fallback');
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ 
          response: generateSmartOptionsResponse(message),
          isLive: false,
          source: 'Rolo Options Specialist'
        })
      };
    }

    // 🎯 OPTIONS-FOCUSED SYSTEM PROMPT
    const optionsSystemPrompt = `You are Rolo, a professional options trading AI specialist. You focus EXCLUSIVELY on options trading strategies, risk management, and actionable advice.

CORE EXPERTISE:
- Options strategies (calls, puts, spreads, straddles, iron condors, etc.)
- Greeks analysis and application (delta, gamma, theta, vega)
- Risk management and position sizing
- IV analysis and volatility trading
- Market timing for options entries/exits

RESPONSE RULES:
- ALWAYS focus on options when analyzing any ticker
- Include specific strike prices and expiration dates
- Mention Greeks when relevant
- Include risk management advice
- Keep responses under 300 words for mobile
- Use bullet points and clear structure
- Include specific entry/exit criteria

CURRENT MARKET CONTEXT:
- VIX Level: Consider current volatility environment
- Options premium levels (high IV = sell, low IV = buy)
- Time decay considerations
- Earnings calendar impact

Always provide actionable, specific options strategies with clear risk parameters.`;

    // 🚀 FAST API CALL - 6-second timeout for mobile
    const controller = new AbortController();
    const timeoutId = setTimeout(() => {
      console.log('⏰ Claude API timeout after 6 seconds');
      controller.abort();
    }, 6000); // 6 seconds for fast mobile response

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
          max_tokens: 1000, // Shorter for mobile
          system: optionsSystemPrompt,
          messages: [{
            role: 'user',
            content: message
          }]
        })
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        console.error('Claude API error:', response.status);
        return {
          statusCode: 200,
          headers,
          body: JSON.stringify({ 
            response: generateSmartOptionsResponse(message),
            isLive: false,
            source: 'Rolo Smart Fallback'
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
          source: 'Claude AI Options Specialist'
        })
      };

    } catch (fetchError) {
      clearTimeout(timeoutId);
      
      if (fetchError.name === 'AbortError') {
        console.log('⏰ Claude API timed out - using smart fallback');
        return {
          statusCode: 200,
          headers,
          body: JSON.stringify({ 
            response: generateSmartOptionsResponse(message),
            isLive: false,
            timeout: true,
            source: 'Rolo Fast Response'
          })
        };
      }
      
      throw fetchError;
    }

  } catch (error) {
    console.error('Claude function error:', error);
    
    // Emergency fallback with options focus
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ 
        response: generateSmartOptionsResponse(event.body ? JSON.parse(event.body).message : 'help'),
        isLive: false,
        error: true,
        source: 'Rolo Emergency System'
      })
    };
  }
};

// 🧠 SMART OPTIONS RESPONSE GENERATOR
function generateSmartOptionsResponse(message) {
  const query = message.toLowerCase();
  const tickerMatches = message.match(/\b[A-Z]{1,5}\b/g) || [];
  
  // Extract ticker if present
  const ticker = tickerMatches.find(t => t.length >= 2 && t.length <= 5) || null;
  
  // Check query type
  const isOptionsQuery = query.includes('option') || query.includes('call') || query.includes('put') || 
                        query.includes('spread') || query.includes('strategy') || query.includes('greek');
  
  const isVolatilityQuery = query.includes('vix') || query.includes('volatility') || query.includes('iv');
  const isEducationalQuery = query.includes('explain') || query.includes('what is') || query.includes('how to');

  // 📊 TICKER-SPECIFIC OPTIONS ANALYSIS
  if (ticker) {
    const price = getSimulatedPrice(ticker);
    const atmStrike = Math.round(price / 5) * 5;
    const otmCall = atmStrike + 5;
    const otmPut = atmStrike - 5;
    const vix = (Math.random() * 15 + 12).toFixed(1);
    const ivRank = Math.floor(Math.random() * 100);
    
    const expiry = getRandomExpiry();
    const strategy = ivRank > 50 ? 'Premium Selling' : 'Premium Buying';
    
    return `📊 **${ticker} OPTIONS ANALYSIS**

**Current Setup:**
• Price: $${price.toFixed(2)}
• ATM Strike: $${atmStrike}
• IV Rank: ${ivRank}% ${ivRank > 50 ? '(HIGH - Sell premium)' : '(LOW - Buy premium)'}
• VIX: ${vix}

**🎯 RECOMMENDED STRATEGY: ${strategy}**

${ivRank > 50 ? `
**Premium Selling Play:**
• **Iron Condor**: ${otmPut}/${atmStrike}/${otmCall} strikes
• **Max Profit**: $${Math.floor(Math.random() * 200 + 100)}
• **Max Risk**: $${Math.floor(Math.random() * 300 + 200)}
• **Target**: 25-50% profit in 2-3 weeks

**Entry Criteria:**
• IV > 30th percentile ✅
• 30-45 DTE optimal
• Manage at 25% profit or 21 DTE` : `
**Premium Buying Play:**
• **${atmStrike} Calls** (if bullish) - ${expiry}
• **Target Entry**: $${(Math.random() * 2 + 1).toFixed(2)} - $${(Math.random() * 2 + 2).toFixed(2)}
• **Profit Target**: 50-100% gain
• **Stop Loss**: 50% of premium

**Alternative**: ${atmStrike}/${otmCall} Call Spread
• **Max Risk**: $${Math.floor(Math.random() * 150 + 100)}
• **Max Reward**: $${Math.floor(Math.random() * 200 + 150)}`}

**⚠️ Risk Management:**
• Position size: 1-2% of portfolio
• Watch theta decay (especially last week)
• Set profit targets BEFORE entry

**Greeks to Monitor:**
• Delta: ~0.50 for ATM options
• Theta: Accelerates final 30 days
• Vega: High for ATM, long-dated

Want specific ${ticker} strategies? Ask about "iron condors" or "call spreads"!`;
  }

  // 📚 EDUCATIONAL RESPONSES
  if (isEducationalQuery) {
    if (query.includes('delta')) {
      return `📚 **DELTA EXPLAINED - Price Sensitivity**

**What is Delta?**
• Measures option price change per $1 stock move
• Calls: 0 to 1.0 | Puts: -1.0 to 0
• ATM options ≈ 0.50 delta

**Practical Examples:**
• 0.30 delta call → +$0.30 per $1 stock rise
• -0.40 delta put → +$0.40 per $1 stock fall
• 100 shares = 1.00 delta

**Trading Applications:**
• **Position Sizing**: 0.50 delta = 50 shares exposure
• **Hedging**: Short 200 shares = buy 2.00 delta in calls
• **Strike Selection**: Higher delta = more expensive, higher probability

**Delta Behavior:**
• ITM calls → Higher delta (0.70-1.00)
• OTM calls → Lower delta (0.10-0.30)
• Time decay reduces delta for OTM options

**Pro Tips:**
• Buy high delta for directional plays
• Sell low delta for income strategies
• Delta changes (that's gamma!)

Want to learn about other Greeks? Ask about "theta" or "gamma"!`;
    }
    
    if (query.includes('theta')) {
      return `⏰ **THETA EXPLAINED - Time Decay**

**What is Theta?**
• Daily time value loss (always negative for long options)
• Accelerates exponentially near expiration
• "Time is the enemy of option buyers"

**Theta Behavior:**
• **30+ DTE**: Slow, steady decay (-$2-5/day)
• **21 DTE**: Moderate acceleration (-$5-10/day)
• **7 DTE**: Rapid decay (-$10-20/day)
• **1 DTE**: Extreme decay (-$20-50/day)

**Practical Impact:**
• $2.00 option with -$10 theta = $1.90 tomorrow
• Weekends = 3 days theta on Friday
• Holidays = Extra decay days

**Strategy Applications:**
• **Sell Options**: Collect theta (time is your friend)
• **Buy Options**: Fight theta (need strong directional move)
• **Spreads**: Reduce net theta exposure

**⚡ Pro Trading Rules:**
• **Buy**: <45 DTE, expect quick moves
• **Sell**: 30-45 DTE, manage at 21 DTE or 25% profit
• **Never hold through last week** (theta explosion)

**Theta Gang Strategies:**
• Covered calls, cash-secured puts
• Iron condors, credit spreads
• Target 1-2% monthly returns

Ask about "gamma" or specific strategies like "iron condors"!`;
    }
  }

  // 🌊 VOLATILITY-FOCUSED RESPONSES
  if (isVolatilityQuery) {
    const vix = (Math.random() * 20 + 10).toFixed(1);
    return `🌊 **VOLATILITY TRADING GUIDE**

**Current VIX: ${vix}**
${vix > 25 ? '**HIGH VOLATILITY ENVIRONMENT**' : vix > 15 ? '**MODERATE VOLATILITY**' : '**LOW VOLATILITY ENVIRONMENT**'}

**What This Means:**
${vix > 25 ? `
• Options premiums are EXPENSIVE
• **Strategy**: SELL premium (collect inflated prices)
• **Best Plays**: Iron condors, credit spreads, covered calls
• **Avoid**: Buying straddles/strangles (expensive)` : vix > 15 ? `
• Options premiums are FAIR
• **Strategy**: Mixed approach based on directional bias
• **Best Plays**: Directional spreads, short-term straddles
• **Monitor**: VIX for expansion/contraction` : `
• Options premiums are CHEAP
• **Strategy**: BUY premium (options are discounted)
• **Best Plays**: Long calls/puts, debit spreads, LEAPS
• **Opportunity**: Straddles before volatility expansion`}

**IV Rank Rules:**
• **>70%**: Definitely sell premium
• **30-70%**: Neutral - use directional bias
• **<30%**: Consider buying premium

**Volatility Trading Strategies:**
• **Long Vol**: Straddles, strangles (buy before events)
• **Short Vol**: Iron condors, butterflies (sell after spikes)
• **Volatility Spreads**: Calendar spreads, ratio spreads

**📊 Best Underlyings for Vol Trading:**
• **High Vol**: TSLA, NVDA, Individual stocks
• **Moderate Vol**: SPY, QQQ, ETFs
• **Stable Vol**: Utilities, consumer staples

Want specific vol strategies? Ask about "straddles" or "iron condors"!`;
  }

  // 🎯 STRATEGY-SPECIFIC RESPONSES
  if (query.includes('iron condor')) {
    return `🦅 **IRON CONDOR STRATEGY GUIDE**

**Setup (Neutral Strategy):**
• Sell ATM call + put (collect premium)
• Buy OTM call + put (define risk)
• **Example**: Stock at $100
  - Sell 95 Put + 105 Call
  - Buy 90 Put + 110 Call

**When to Trade:**
• **High IV environment** (>50th percentile)
• **30-45 DTE** for optimal theta decay
• **Quiet earnings season** (low volatility expected)
• **Range-bound markets**

**Profit Mechanics:**
• **Max Profit**: Net credit received
• **Max Loss**: Wing width - credit
• **Breakevens**: Short strikes ± net credit
• **Best Outcome**: Stock stays between short strikes

**Management Rules:**
• **Take Profit**: 25-50% of max profit
• **Cut Losses**: 2x credit received
• **Time Management**: Close at 21 DTE
• **Rolling**: Can roll out and adjust strikes

**📊 Ideal Conditions:**
• IV Rank >50% ✅
• Stable, range-bound underlying ✅  
• 30-45 days to expiration ✅
• No major news/earnings ✅

**Risk Factors:**
• **Big Moves**: Can hit max loss quickly
• **Pin Risk**: Avoid expiring at short strikes
• **Liquidity**: Trade liquid underlyings (SPY, QQQ)

**Best Underlyings:**
• SPY, QQQ (high liquidity)
• AAPL, MSFT (stable large caps)
• Avoid: Meme stocks, biotech

Want setup details for a specific ticker? Ask "SPY iron condor"!`;
  }

  // 💡 DEFAULT OPTIONS GUIDANCE
  return `🤖 **Rolo - Options Trading Specialist**

Ready to help with your options trades! I focus on:

**🎯 Core Expertise:**
• **Strategy Selection** - Best plays for any market condition
• **Risk Management** - Position sizing, stop losses, profit targets  
• **Greeks Analysis** - Delta, theta, gamma, vega applications
• **IV Analysis** - When to buy vs sell premium
• **Market Timing** - Entry/exit optimization

**💡 Quick Start Commands:**
• **"[TICKER] options"** - Complete analysis (AAPL, SPY, etc.)
• **"Iron condor setup"** - Neutral income strategy
• **"Explain delta"** - Greeks education
• **"High VIX strategies"** - Volatility plays
• **"Credit spreads"** - Directional income plays

**📊 Current Market Context:**
• **Strategy Focus**: ${Math.random() > 0.5 ? 'Premium selling favored (high IV)' : 'Premium buying opportunities (low IV)'}
• **Risk Level**: Moderate volatility environment
• **Best Timeframe**: 30-45 DTE for optimal risk/reward

**🔥 Popular Strategies Right Now:**
• Iron condors (neutral income)
• Call/put spreads (directional bias)
• Covered calls (income on shares)
• Cash-secured puts (entry strategies)

**Ready to analyze any ticker or explain any strategy!**

Try: "AAPL options analysis" or "explain iron condors" 📈`;
}

// Helper functions
function getSimulatedPrice(ticker) {
  const priceMap = {
    'AAPL': 175, 'GOOGL': 140, 'MSFT': 350, 'AMZN': 145, 'TSLA': 250,
    'NVDA': 450, 'META': 350, 'NFLX': 450, 'SPY': 450, 'QQQ': 375,
    'HOOD': 15, 'AMC': 5, 'GME': 20, 'PLTR': 25, 'SOFI': 8
  };
  return priceMap[ticker] || (Math.random() * 200 + 20);
}

function getRandomExpiry() {
  const days = [7, 14, 21, 30, 45][Math.floor(Math.random() * 5)];
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toLocaleDateString();
}
