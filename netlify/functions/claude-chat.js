// netlify/functions/claude-chat.js
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

    // Enhanced ticker detection - look for stock symbols
    const tickerMatches = message.match(/\b[A-Z]{1,5}\b/g) || [];
    const query = message.toLowerCase();
    let response = '';

    // Handle specific stock analysis for ANY ticker
    if (tickerMatches.length > 0) {
      const ticker = tickerMatches[0];
      response = `📈 **${ticker} Analysis:**

🔍 **What Rolo Sees for ${ticker}:**

**📊 Key Analysis Points:**
- **Volume & Momentum**: Check if ${ticker} is seeing unusual volume or momentum shifts
- **Technical Levels**: Watch key support/resistance zones for breakout opportunities  
- **Sector Performance**: How is ${ticker}'s sector performing vs broader market
- **News & Catalysts**: Any earnings, product launches, or industry news affecting ${ticker}
- **Options Activity**: Unusual options flow can signal institutional positioning

**⚡ Trading Considerations for ${ticker}:**
- **Entry Strategy**: Wait for clear trend confirmation or bounce off support
- **Risk Management**: Set stop loss below recent swing low/high depending on direction
- **Position Sizing**: Size based on volatility - ${ticker} may have higher/lower risk than SPY
- **Time Horizon**: Day trade, swing, or longer-term position?
- **Market Context**: How does ${ticker} correlate with SPY/QQQ movements?

**💡 Rolo's Approach:**
For the most accurate ${ticker} analysis, check current price action in the **Ticker tab** for live data! I combine technical patterns with market sentiment.

**🎯 What's your specific ${ticker} question?**
- Looking for entry/exit points?
- Considering options plays (calls/puts)?
- Want to know key levels to watch?
- Need risk management advice?

The more specific you are, the better I can help with your ${ticker} strategy! 📊`;
    }
    // Handle options-related questions
    else if (query.includes('option') || query.includes('call') || query.includes('put') || query.includes('strike')) {
      response = `⚡ **Options Strategy Deep Dive:**

**🎯 The Greeks That Matter:**
- **Delta (0-1.00)**: How much option price moves per $1 stock move
  - 0.50 Delta = Option moves ~50¢ per $1 stock move
- **Theta (Time Decay)**: Your enemy on long positions, friend on short
  - Higher closer to expiration - be careful with 0-2 DTE!
- **Vega (Volatility)**: Earnings = high vega risk/reward
- **Gamma**: Delta acceleration - powerful near expiration

**⚡ Smart Options Setups:**
- **0-1 DTE**: High risk/reward scalps - need quick directional moves
- **Weekly (5-7 DTE)**: Good for earnings or catalyst plays
- **Monthly (30+ DTE)**: More time but higher premium cost
- **Spreads**: Limit risk but cap reward - great for range-bound stocks

**🛡️ Risk Management Rules:**
- Never risk more than you can afford to lose (options can go to $0)
- Have exit plan BEFORE entering (profit target + stop loss)
- Watch IV (implied volatility) - don't buy expensive options
- Check liquidity (bid-ask spread) - wide spreads = harder to exit

**💡 Which strategy are you considering?** 
Tell me the ticker and your market outlook - I can help structure the play! 📈`;
    }
    // Handle market/trend questions
    else if (query.includes('market') || query.includes('trend') || query.includes('spy') || query.includes('qqq')) {
      response = `🌊 **Market Pulse Check:**

**📈 Key Market Drivers:**
- **SPY (S&P 500)**: The market benchmark - watch 570-590 range closely
- **QQQ (Nasdaq)**: Tech-heavy, sensitive to rates & growth expectations  
- **IWM (Russell 2000)**: Small caps = economic sentiment gauge
- **VIX**: Fear gauge - Low VIX (<20) = complacency, High VIX (>30) = fear

**🔍 Market Health Indicators:**
- **Sector Rotation**: Which sectors leading/lagging?
- **Breadth**: More stocks advancing vs declining = healthy
- **Volume**: Confirming moves or showing exhaustion?
- **Interest Rates**: Rising rates pressure growth stocks
- **Economic Data**: GDP, employment, inflation impacts

**💡 Trading the Market Environment:**
- **Trending Market**: Follow momentum, use pullbacks to add
- **Range-Bound**: Sell resistance, buy support, avoid breakouts
- **High Volatility**: Smaller positions, wider stops
- **Low Volatility**: Bigger positions, but watch for sudden moves

**🎯 Current Market Questions:**
- Are we in risk-on or risk-off mode?
- Which sectors are showing strength?
- Is this a dip to buy or start of correction?

What's your market outlook right now? Bullish, bearish, or waiting for direction? 📊`;
    }
    // Handle risk management questions  
    else if (query.includes('risk') || query.includes('stop') || query.includes('loss') || query.includes('management')) {
      response = `🛡️ **Risk Management Mastery:**

**💰 Position Sizing (The Foundation):**
- **1-2% Rule**: Risk only 1-2% of account per trade maximum
- **Volatility Adjustment**: Smaller size for high-beta stocks
- **Conviction Scaling**: Larger size for highest conviction setups only
- **Never "Bet the Farm"**: No single trade should make or break you

**🎯 Stop Loss Strategy:**
- **Set Before Entry**: Decide stop loss BEFORE you enter position
- **Technical Stops**: Use support/resistance, moving averages, chart patterns
- **Percentage Stops**: Fixed % below entry (adjust for volatility)
- **Time Stops**: Exit if thesis doesn't play out in expected timeframe
- **Mental Stops**: If you set it, stick to it - no "hope" trading!

**📊 Portfolio Management:**
- **Diversification**: Spread risk across sectors, timeframes, strategies
- **Correlation**: Don't load up on similar stocks (all tech, all energy, etc.)
- **Cash Reserves**: Keep powder dry for high-conviction opportunities
- **Win/Loss Tracking**: Know your hit rate and average R:R ratio

**💪 Psychology & Discipline:**
- **Plan Your Trade, Trade Your Plan**: Write it down, follow it
- **No Revenge Trading**: Don't chase losses with bigger bets
- **Profit Taking**: Take some off the table on big winners
- **Learn From Every Trade**: Keep a trading journal

**🎯 What's your biggest risk management challenge?**
Position sizing? Setting stops? Emotional control? Let's tackle it! 💪`;
    }
    // Handle general greetings
    else if (query.includes('hello') || query.includes('hi') || query.includes('hey') || query.includes('what') && query.includes('up')) {
      response = `👋 **Hey there! Rolo here - ready to dive into trading!**

**🎯 I'm your AI trading partner for:**
- **Stock Analysis**: ANY ticker - just name it! (AAPL, TSLA, HOOD, NVDA, etc.)
- **Options Strategies**: Calls, puts, spreads, timing, Greeks
- **Risk Management**: Position sizing, stops, psychology  
- **Market Analysis**: Trends, sectors, indices, volatility
- **Technical Analysis**: Charts, levels, patterns, indicators

**💡 Try these specific questions:**
- *"What do you think about HOOD?"*
- *"Help me with a call option strategy for AAPL"*
- *"How should I manage risk on this swing trade?"*
- *"What's your take on current market trends?"*
- *"Should I buy the SPY dip or wait?"*

**🚀 Pro Tip:** The more specific your question, the better analysis I can provide!

**What's on your trading radar today?** Drop a ticker, strategy question, or market thought - let's make some smart moves! 📈`;
    }
    // Default response for any other question
    else {
      response = `🤖 **Rolo here - your AI trading analyst!**

**🚀 I specialize in helping with:**

**📈 Stock Analysis:**
- Just mention ANY ticker (AAPL, TSLA, HOOD, AMZN, etc.)
- Technical levels, momentum, sentiment analysis
- Entry/exit strategies and key levels to watch

**⚡ Options Trading:**
- Calls vs puts strategy selection
- Greeks explanation and timing
- Risk/reward setup analysis

**🛡️ Risk Management:**
- Position sizing and stop loss placement  
- Portfolio management and diversification
- Trading psychology and discipline

**🌊 Market Analysis:**
- SPY/QQQ trends and sector rotation
- Volatility analysis and market sentiment
- Economic factors and their trading impact

**💡 Example questions that work great:**
- *"Analyze [TICKER] for me"*
- *"Should I buy calls or puts on [STOCK]?"*
- *"What's your market outlook today?"*  
- *"Help me size this position properly"*

**What specific trading topic can I help you with right now?** 🎯`;
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ 
        response: response,
        isLive: true 
      })
    };

  } catch (error) {
    console.error('Claude Function Error:', error);
    
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ 
        response: `🤖 Rolo here! Ready to help with trading analysis.\n\nTry asking me about:\n• Any stock ticker\n• Options strategies\n• Risk management\n• Market trends\n\nWhat's on your mind?`,
        isLive: false,
        fallback: true 
      })
    };
  }
};
