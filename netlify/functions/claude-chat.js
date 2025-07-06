// netlify/functions/claude-chat.js - Enhanced for Options Trading
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

    // Enhanced options trading detection
    const query = message.toLowerCase();
    const tickerMatches = message.match(/\b[A-Z]{1,5}\b/g) || [];
    const isOptionsQuery = query.includes('call') || query.includes('put') || query.includes('option') || 
                          query.includes('strike') || query.includes('expiry') || query.includes('dte') ||
                          query.includes('premium') || query.includes('delta') || query.includes('theta') ||
                          query.includes('gamma') || query.includes('vega') || query.includes('iv') ||
                          query.includes('spread') || query.includes('straddle') || query.includes('strangle');
    
    let response = '';

    // Enhanced ticker analysis with options focus
    if (tickerMatches.length > 0) {
      const ticker = tickerMatches[0];
      
      if (isOptionsQuery) {
        response = `⚡ **${ticker} OPTIONS ANALYSIS:**

🎯 **Options Opportunities for ${ticker}:**

**📊 Current Setup Analysis:**
- **Implied Volatility (IV)**: Check if ${ticker} options are cheap or expensive
- **Earnings Date**: Any upcoming catalyst that could spike IV?
- **Technical Levels**: Key support/resistance for strike selection
- **Volume**: Is there institutional options flow in ${ticker}?
- **Trend**: Bullish/bearish bias for directional plays

**🚀 Strategy Considerations for ${ticker}:**

**For Bullish Outlook:**
- **Call Options**: ITM for high delta, OTM for leverage
- **Bull Call Spreads**: Limit risk while maintaining upside
- **Covered Calls**: If you own shares, sell calls for income

**For Bearish Outlook:**
- **Put Options**: Protective puts or speculative puts
- **Bear Put Spreads**: Defined risk bearish play
- **Cash-Secured Puts**: Get paid to wait for lower entry

**For Neutral/Range-Bound:**
- **Iron Condors**: Profit from low volatility
- **Straddles/Strangles**: Bet on big moves (buy before earnings)
- **Butterflies**: Profit from price staying near strike

**⚡ Risk Management for ${ticker} Options:**
- **Position Size**: Never risk more than 2-5% on single options play
- **Time Decay**: Avoid buying options with <7 DTE unless scalping
- **IV Crush**: Be careful buying options before earnings
- **Delta Hedging**: Consider underlying stock movements

**💡 Next Steps:**
1. Check ${ticker}'s options chain for volume and open interest
2. Look at the Greeks for your preferred strikes
3. Consider market conditions and overall trend
4. Set profit targets (50-100% gains) and stop losses (50% loss)

**What specific ${ticker} options strategy are you considering?** Calls, puts, or something more complex? And what's your market outlook? 📈`;
      } else {
        // Regular stock analysis but with options perspective
        response = `📈 **${ticker} Analysis (Options Trader Perspective):**

🔍 **${ticker} Stock Analysis for Options Trading:**

**📊 Key Metrics for Options Plays:**
- **Current Price Action**: Is ${ticker} trending, consolidating, or breaking out?
- **Volume Profile**: High volume = better options liquidity
- **Volatility**: Recent price swings affect options pricing
- **Support/Resistance**: Critical for strike price selection
- **Earnings Date**: Major catalyst that affects all options strategies

**⚡ Options Trading Considerations:**
- **IV Environment**: Are ${ticker} options expensive or cheap right now?
- **Liquidity Check**: Tight bid-ask spreads = easier entry/exit
- **Open Interest**: High OI = more liquid options markets
- **Pin Risk**: Be aware of weekly expiration effects

**🎯 Strategy Ideas for ${ticker}:**
- **Trending Up**: Consider call options or bull spreads
- **Trending Down**: Put options or bear spreads
- **Range-Bound**: Iron condors or butterflies
- **High IV**: Sell premium (covered calls, cash-secured puts)
- **Low IV**: Buy options before potential catalysts

**📅 Time Frame Considerations:**
- **0-3 DTE**: High risk/reward scalping plays
- **1-2 weeks**: Swing trading with weekly options
- **30-45 DTE**: Higher probability theta plays

**💡 For the most accurate ${ticker} options analysis, check:**
1. Current IV percentile vs historical
2. Upcoming earnings or news catalysts  
3. Technical support/resistance levels
4. Options flow and unusual activity

**What's your ${ticker} options strategy? Looking for directional plays, income generation, or volatility trades?** 🎯`;
      }
    }
    // Enhanced options strategy responses
    else if (isOptionsQuery) {
      const strategies = [];
      if (query.includes('covered call')) strategies.push('covered calls');
      if (query.includes('cash secured put') || query.includes('csp')) strategies.push('cash-secured puts');
      if (query.includes('iron condor')) strategies.push('iron condors');
      if (query.includes('straddle')) strategies.push('straddles');
      if (query.includes('spread')) strategies.push('spreads');
      if (query.includes('0dte')) strategies.push('0DTE trades');
      
      if (strategies.length > 0) {
        response = `⚡ **${strategies[0].toUpperCase()} STRATEGY GUIDE:**

🎯 **Deep Dive into ${strategies[0]}:**

**📋 Strategy Overview:**
${getStrategyDetails(strategies[0])}

**⚡ When to Use This Strategy:**
${getStrategyTiming(strategies[0])}

**🛡️ Risk Management:**
${getStrategyRiskManagement(strategies[0])}

**💡 Pro Tips:**
${getStrategyProTips(strategies[0])}

**🎯 Want me to analyze specific tickers for ${strategies[0]} opportunities?** Just mention a stock symbol and I'll break down the setup! 📊`;
      } else {
        response = `⚡ **OPTIONS TRADING MASTERY:**

🚀 **The Greeks That Rule Your P&L:**

**🔸 Delta (Direction):**
- Call Delta: 0.30 = 30¢ move per $1 stock move
- Put Delta: -0.30 = 30¢ gain per $1 stock drop
- **Sweet Spot**: 0.40-0.70 for directional plays

**🔸 Theta (Time Decay):**
- Your biggest enemy when buying options
- Accelerates in final 30 days to expiration
- **Strategy**: Sell theta with covered calls, CSPs

**🔸 Vega (Volatility):**
- High before earnings, crashes after
- **Buy Low IV**: Before known catalysts
- **Sell High IV**: When everyone's scared

**🔸 Gamma (Acceleration):**
- ATM options have highest gamma
- Creates explosive moves near expiration
- **Risk**: Can work for or against you fast

**⚡ High-Probability Setups:**
- **Weekly Iron Condors**: 16-20 delta wings
- **Covered Calls**: 30-45 DTE, 15-30 delta
- **Cash-Secured Puts**: Below support levels
- **Earnings Straddles**: Buy low IV, sell high IV

**🛡️ Risk Rules That Save Accounts:**
- Max 2-5% risk per trade
- Take profits at 50% for credit spreads
- Cut losses at 50% for debit spreads
- Never hold through earnings unless planned

**🎯 What's your current options challenge?** Strategy selection, risk management, or specific trade analysis? Drop a ticker and let's build a play! 📈`;
      }
    }
    // Market analysis with options perspective
    else if (query.includes('market') || query.includes('spy') || query.includes('qqq') || query.includes('vix')) {
      response = `🌊 **OPTIONS MARKET ANALYSIS:**

**📈 Current Options Environment:**

**🎯 Key Indices for Options Traders:**
- **SPY**: L
