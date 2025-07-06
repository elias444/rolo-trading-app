// netlify/functions/claude-chat.js - Complete Options Trading Focused Version
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
• **Implied Volatility (IV)**: Check if ${ticker} options are cheap or expensive
• **Earnings Date**: Any upcoming catalyst that could spike IV?
• **Technical Levels**: Key support/resistance for strike selection
• **Volume**: Is there institutional options flow in ${ticker}?
• **Trend**: Bullish/bearish bias for directional plays

**🚀 Strategy Considerations for ${ticker}:**

**For Bullish Outlook:**
• **Call Options**: ITM for high delta, OTM for leverage
• **Bull Call Spreads**: Limit risk while maintaining upside
• **Covered Calls**: If you own shares, sell calls for income

**For Bearish Outlook:**
• **Put Options**: Protective puts or speculative puts
• **Bear Put Spreads**: Defined risk bearish play
• **Cash-Secured Puts**: Get paid to wait for lower entry

**For Neutral/Range-Bound:**
• **Iron Condors**: Profit from low volatility
• **Straddles/Strangles**: Bet on big moves (buy before earnings)
• **Butterflies**: Profit from price staying near strike

**⚡ Risk Management for ${ticker} Options:**
• **Position Size**: Never risk more than 2-5% on single options play
• **Time Decay**: Avoid buying options with <7 DTE unless scalping
• **IV Crush**: Be careful buying options before earnings
• **Delta Hedging**: Consider underlying stock movements

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
• **Current Price Action**: Is ${ticker} trending, consolidating, or breaking out?
• **Volume Profile**: High volume = better options liquidity
• **Volatility**: Recent price swings affect options pricing
• **Support/Resistance**: Critical for strike price selection
• **Earnings Date**: Major catalyst that affects all options strategies

**⚡ Options Trading Considerations:**
• **IV Environment**: Are ${ticker} options expensive or cheap right now?
• **Liquidity Check**: Tight bid-ask spreads = easier entry/exit
• **Open Interest**: High OI = more liquid options markets
• **Pin Risk**: Be aware of weekly expiration effects

**🎯 Strategy Ideas for ${ticker}:**
• **Trending Up**: Consider call options or bull spreads
• **Trending Down**: Put options or bear spreads
• **Range-Bound**: Iron condors or butterflies
• **High IV**: Sell premium (covered calls, cash-secured puts)
• **Low IV**: Buy options before potential catalysts

**📅 Time Frame Considerations:**
• **0-3 DTE**: High risk/reward scalping plays
• **1-2 weeks**: Swing trading with weekly options
• **30-45 DTE**: Higher probability theta plays

**💡 For the most accurate ${ticker} options analysis, check:**
1. Current IV percentile vs historical
2. Upcoming earnings or news catalysts  
3. Technical support/resistance levels
4. Options flow and unusual activity

**What's your ${ticker} options strategy? Looking for directional plays, income generation, or volatility trades?** 🎯`;
      }
    }
    // Covered Calls Strategy
    else if (query.includes('covered call')) {
      response = `⚡ **COVERED CALLS MASTERY:**

🎯 **Strategy Overview:**
Own 100 shares + sell call option against them. Collect premium while capping upside. Perfect for neutral-to-slightly-bullish outlook on stocks you already own.

**📊 When to Use Covered Calls:**
• You own stock and want to generate income
• Stock is range-bound or slightly bullish
• IV is elevated (good premium collection)
• You're okay with potentially selling shares

**🚀 Optimal Setup:**
• **Time Frame**: 30-45 DTE for best theta decay
• **Strike Selection**: 15-30 delta (usually OTM)
• **IV Environment**: Sell when IV >50th percentile
• **Timing**: Sell on green days, avoid before earnings

**⚡ Risk Management:**
• **Max Loss**: Stock purchase price minus premium collected
• **Assignment Risk**: Be prepared to sell shares at strike
• **Rolling Strategy**: Roll up and out if stock breaks above strike
• **Stop Loss**: Consider if stock drops >10-15%

**💡 Pro Tips:**
• Target 1-2% monthly returns (12-24% annually)
• Sell calls on bounces, not dips
• Consider LEAPS for synthetic covered calls (lower capital)
• Track your "yield on cost" vs dividends

**🎯 Best Stocks for Covered Calls:**
• High IV stocks (TSLA, NVDA, AMD)
• Dividend aristocrats (KO, JNJ, PG)
• Large-cap with good liquidity (AAPL, MSFT, GOOGL)

**What stocks are you considering for covered calls? I can help analyze the setup!** 📈`;
    }
    // Cash-Secured Puts Strategy
    else if (query.includes('cash secured put') || query.includes('csp')) {
      response = `⚡ **CASH-SECURED PUTS STRATEGY:**

🎯 **Strategy Overview:**
Set aside 100% cash + sell put option. Get paid premium to potentially buy stock at discount. Perfect "get paid to wait" strategy for stocks you want to own.

**📊 When to Use CSPs:**
• Want to own stock but at lower price
• Bullish long-term but patient on entry
• High IV environment (good premium)
• Strong support level to sell puts against

**🚀 Optimal Setup:**
• **Strike Selection**: Below strong technical support
• **Time Frame**: 30-45 DTE for optimal risk/reward
• **Cash Requirement**: Strike price × 100 shares
• **Target**: 1-3% monthly returns

**⚡ Best Market Conditions:**
• **Sell on Red Days**: When fear is high, premiums rich
• **High IV**: VIX >20, individual stock IV elevated
• **Support Levels**: Place strikes at key technical levels
• **Quality Stocks**: Only sell puts on stocks you'd love to own

**🛡️ Risk Management:**
• **Max Loss**: Strike price minus premium received
• **Assignment**: Be HAPPY to own the stock at that price
• **Rolling**: Roll down and out if stock falls below strike
• **Capital**: Only use 20-30% of account for CSPs

**💡 Pro Strategy - The Wheel:**
1. Sell cash-secured put
2. If assigned, own the stock
3. Sell covered calls against the shares
4. If called away, back to step 1
5. Collect premium every step of the way

**🎯 Best Stocks for CSPs:**
• Quality companies you'd hold long-term
• Strong support levels visible on charts
• High IV but not "meme stock" crazy
• Examples: AAPL, MSFT, GOOGL at support

**Which stocks are you eyeing for cash-secured puts? Let's find the perfect strikes!** 💰`;
    }
    // Iron Condors Strategy
    else if (query.includes('iron condor')) {
      response = `⚡ **IRON CONDORS - INCOME MACHINE:**

🎯 **Strategy Overview:**
Sell put spread + sell call spread simultaneously. Profit from low volatility and time decay. Best neutral strategy for range-bound markets.

**📊 Iron Condor Structure:**
• **Sell Put**: Lower strike (bullish assumption)
• **Buy Put**: Even lower strike (protection)
• **Sell Call**: Higher strike (bearish assumption)  
• **Buy Call**: Even higher strike (protection)
• **Sweet Spot**: Stock stays between short strikes

**🚀 Optimal Market Conditions:**
• **High IV Environment**: VIX >20, elevated option premiums
• **Range-Bound Market**: Sideways or choppy price action
• **Low Movement Expected**: No major catalysts coming
• **30-45 DTE**: Optimal time for theta decay

**⚡ Setup Guidelines:**
• **Width**: 5-10 point spreads for good risk/reward
• **Probability**: Target 16-20 delta short strikes
• **Credit**: Aim for 1/3 of spread width in premium
• **Liquidity**: Only trade liquid underlyings (SPY, QQQ, AAPL)

**🛡️ Risk Management Rules:**
• **Close at 50% Max Profit**: Don't get greedy
• **Stop Loss**: 200% of credit received OR 50% of spread width
• **Early Management**: Adjust winners before losers
• **Avoid Earnings**: Close before any major announcements

**💡 Advanced Iron Condor Tips:**
• **SPY/QQQ**: Most liquid, tight spreads
• **Weekly Cycles**: Can trade every week for income
• **Volatility Timing**: Enter when VIX spikes >25
• **Win Rate**: Target 70-80% win rate, small consistent profits

**📊 Example Trade:**
SPY at $580:
• Sell 575 Put / Buy 570 Put (5-point spread)
• Sell 585 Call / Buy 590 Call (5-point spread)
• Collect $2.00 credit, risk $3.00
• Profit if SPY stays between 575-585

**Ready to build an iron condor? Give me a ticker and I'll structure the perfect setup!** 🦅`;
    }
    // 0DTE Trading
    else if (query.includes('0dte') || query.includes('0 dte')) {
      response = `⚡ **0DTE TRADING - ULTIMATE SCALPING:**

🎯 **0DTE Overview:**
Options expiring same day. Highest risk/reward in options trading. Pure gamma scalping requiring lightning-fast decisions and iron discipline.

**🚀 Why 0DTE Works:**
• **Massive Gamma**: Small stock moves = huge option moves
• **Pure Direction**: No time value, just intrinsic movement
• **Speed**: Quick profits (or losses) within hours/minutes
• **Liquidity**: SPY/QQQ have incredible 0DTE volume

**⚡ Optimal Conditions for 0DTE:**
• **Final 2 Hours**: 2-4 PM EST when gamma peaks
• **Trending Markets**: Strong directional bias needed
• **High Volume**: Institutional activity driving moves
• **Technical Levels**: Major support/resistance breaks

**🎯 Best 0DTE Setups:**
• **ATM Calls/Puts**: Maximum gamma exposure
• **Breakout Plays**: Buy calls on resistance breaks
• **Reversal Plays**: Puts on failed breakouts
• **Scalping**: Quick 20-50% gains, cut losses fast

**🛡️ Critical Risk Management:**
• **Position Size**: NEVER more than 1% of account
• **Stop Loss**: -50% immediately, no exceptions
• **Profit Target**: 50-100% gains, take it and run
• **Time Limit**: Close all positions by 3:50 PM

**⚡ 0DTE Psychology Rules:**
• **No Emotions**: Mechanical execution only
• **Accept Losses**: Most trades will lose money
• **Small Size**: Survive to fight another day
• **Quick Decisions**: Hesitation kills 0DTE profits

**💡 Advanced 0DTE Strategies:**
• **Call Spreads**: Limit risk while maintaining upside
• **Put Spreads**: Defined risk on market drops
• **Straddles**: Big move plays before close
• **Momentum Following**: Trade with the trend

**📊 Example 0DTE Setup:**
SPY at 580 at 2 PM:
• Buy 580 calls if breaking resistance
• Risk: $100 per contract
• Target: $200-300 per contract (100-200% gain)
• Stop: $50 per contract (-50% loss)
• Time Limit: Close by 3:45 PM no matter what

**⚠️ 0DTE Reality Check:**
• This is gambling, not investing
• Most retail traders lose money
• Requires extensive practice
• Start with paper trading first

**Want to learn 0DTE? I can teach you the mechanics, but promise me you'll start small!** ⚡`;
    }
    // Greeks Education
    else if (query.includes('delta') || query.includes('gamma') || query.includes('theta') || query.includes('vega') || query.includes('greeks')) {
      response = `⚡ **THE GREEKS - YOUR OPTIONS SUPERPOWERS:**

🚀 **Master These 4 Greeks to Win:**

**🔸 DELTA - Direction & Speed**
• **What**: How much option price moves per $1 stock move
• **Call Delta**: 0 to 1.00 (0.50 = 50¢ move per $1 stock move)
• **Put Delta**: 0 to -1.00 (-0.30 = 30¢ gain per $1 stock drop)
• **Sweet Spot**: 0.40-0.70 for directional plays
• **Pro Tip**: Higher delta = more expensive but safer

**🔸 THETA - Time Decay (Your Enemy/Friend)**
• **What**: Daily time decay stealing option value
• **Impact**: Accelerates in final 30 days to expiration
• **Strategy**: Sell options to COLLECT theta (covered calls, CSPs)
• **Timing**: Avoid buying options with <7 DTE
• **Weekend Effect**: 3 days of theta decay over weekends

**🔸 GAMMA - Acceleration Power**
• **What**: How fast delta changes as stock moves
• **Peak**: ATM options have highest gamma
• **Risk**: Can create explosive moves near expiration
• **0DTE**: Gamma goes ballistic on expiration day
• **Strategy**: Buy gamma before big moves, sell after

**🔸 VEGA - Volatility Sensitivity**
• **What**: How much option price changes per 1% IV move
• **Earnings**: High vega = huge IV crush after announcement
• **Buy Low IV**: Before known catalysts or market stress
• **Sell High IV**: When everyone's panicking (VIX >30)
• **Long-term**: LEAPS have highest vega exposure

**⚡ Greeks in Action - Real Examples:**

**Buying Calls (You Want):**
• High Delta (0.60+): More stock-like movement
• Low Theta: Minimal daily decay
• Low Vega: Less sensitive to IV changes
• Moderate Gamma: Acceleration on your side

**Selling Covered Calls (You Want):**
• Low Delta (0.15-0.30): Lower chance of assignment
• High Theta: Fast time decay in your favor
• High Vega: Benefit from IV crush
• Low Gamma: Less acceleration against you

**🎯 Advanced Greeks Strategies:**
• **Delta Hedging**: Buy/sell shares to neutralize delta
• **Gamma Scalping**: Profit from gamma acceleration
• **Theta Farming**: Consistent income from time decay
• **Vega Trading**: Buy low IV, sell high IV

**💡 Greeks Monitoring Tools:**
• Most brokers show Greeks in options chains
• Focus on total portfolio Greeks, not individual trades
• Watch how Greeks change with time and price moves
• Use Greeks to size positions appropriately

**Which Greek do you want to master first? I can dive deeper into any of them!** 📊`;
    }
    // Earnings Plays
    else if (query.includes('earnings') && isOptionsQuery) {
      response = `⚡ **EARNINGS OPTIONS STRATEGIES:**

🎯 **The Earnings Volatility Game:**
Earnings = biggest catalyst for individual stocks. Massive opportunities but requires understanding IV crush and timing.

**📊 Pre-Earnings Setup (1-2 weeks before):**
• **IV Crush Coming**: Options prices will collapse after earnings
• **Buy Strategies**: Straddles, strangles, calls/puts (directional)
• **Sell Strategies**: Iron condors, covered calls (collect high premium)
• **Timing**: Enter 1-2 weeks before, exit day before earnings

**🚀 Earnings Strategy Menu:**

**🔸 LONG STRADDLE (Big Move Expected):**
• Buy ATM call + ATM put
• Profit from move >total premium paid
• Best: When IV is low before earnings run-up
• Risk: IV crush if move isn't big enough

**🔸 SHORT IRON CONDOR (Range-Bound):**
• Sell put spread + call spread
• Profit if stock stays within strikes post-earnings
• Best: High IV environment, stable companies
• Risk: Unexpected huge move breaks your strikes

**🔸 DIRECTIONAL PLAYS:**
• Buy calls if bullish, puts if bearish
• Use spreads to reduce vega risk
• Target strikes based on expected move
• Exit before earnings or hold through

**⚡ IV Crush Education:**
• **Before Earnings**: IV inflated (expensive options)
• **After Earnings**: IV collapses (cheap options)
• **Impact**: Can lose money even if direction right
• **Solution**: Sell premium before, buy premium after

**🛡️ Earnings Risk Management:**
• **Position Size**: Max 2-3% per earnings play
• **Multiple Plays**: Spread across different earnings dates
• **Exit Strategy**: Take profits before announcement OR hold through
• **Paper Trade**: Practice timing and strategy selection

**💡 Advanced Earnings Techniques:**
• **Calendar Spreads**: Sell front month, buy back month
• **Ratio Spreads**: Different quantities of options
• **Synthetic Strategies**: Replicate stock with options
• **Post-Earnings**: Buy crushed options for next cycle

**📊 Earnings Calendar Priority:**
• **High IV**: Look for elevated option premiums
• **Liquid Options**: Tight bid-ask spreads
• **Historical Moves**: Research past earnings reactions
• **Analyst Expectations**: Consensus vs whisper numbers

**🎯 This Week's Earnings Plays:**
Which stocks are reporting earnings this week? I can help analyze the best options strategy for each one! 📈`;
    }
    // Market Analysis with Options Focus
    else if (query.includes('market') || query.includes('spy') || query.includes('qqq') || query.includes('vix')) {
      response = `🌊 **OPTIONS MARKET ANALYSIS:**

**📈 Current Options Environment:**

**🎯 Key Indices for Options Traders:**
• **SPY (S&P 500)**: Most liquid options, perfect for beginners
  - Tight spreads, high volume, weekly/daily expirations
• **QQQ (Nasdaq)**: Tech-heavy, higher volatility = better premiums
  - More explosive moves, great for directional plays
• **IWM (Russell 2000)**: Small caps, highest volatility
  - Big moves but wider spreads, advanced traders only
• **VIX**: Fear gauge affecting ALL options pricing

**⚡ Reading the Volatility Environment:**

**🟢 Low VIX (<20) - "Greed Mode":**
• Options are cheap = good time to BUY
• Market complacent, volatility selling strategies risky
• Perfect for: Long straddles, call buying, put protection

**🔴 High VIX (>30) - "Fear Mode":**
• Options are expensive = good time to SELL
• Market panicking, premium collection opportunities
• Perfect for: Covered calls, CSPs, iron condors

**🟡 Medium VIX (20-30) - "Normal Mode":**
• Balanced options pricing
• Trend-following strategies work best
• Mix of buying and selling approaches

**📊 Options Flow Indicators:**
• **Put/Call Ratio >1.0**: Bearish sentiment (contrarian bullish)
• **SKEW >130**: Fear of black swan events
• **Term Structure**: Compare 30-day vs 60-day IV
• **Dark Pool Activity**: Institutional positioning

**🎯 Current Market-Based Strategies:**

**🚀 Trending Market (Strong Direction):**
• Buy calls/puts in trend direction
• Use spreads to reduce cost
• Trail stops with technical levels
• Focus on momentum names

**📈 Range-Bound Market (Choppy/Sideways):**
• Iron condors on SPY/QQQ
• Covered calls for income
• Cash-secured puts at support
• Theta decay strategies

**🌪️ High Volatility Market (VIX >25):**
• Sell premium strategies dominate
• Short straddles/strangles
• Credit spreads with wide strikes
• Avoid buying expensive options

**💡 Sector Rotation for Options:**
• **Tech (QQQ)**: Higher IV, bigger moves
• **Financial (XLF)**: Interest rate sensitive
• **Energy (XLE)**: Commodity correlation
• **Healthcare (XLV)**: Defensive, lower IV

**📊 Weekly Game Plan:**
• **Monday**: Analyze weekend news, VIX levels
• **Tuesday-Thursday**: Peak trading, best liquidity
• **Friday**: Expiration effects, gamma risk
• **Options Expiration**: Third Friday monthly chaos

**What's your current market outlook? And which timeframe are you trading - daily, weekly, or monthly options?** 🎯`;
    }
    // Risk Management for Options
    else if (query.includes('risk') || query.includes('position size') || query.includes('stop loss')) {
      response = `🛡️ **OPTIONS RISK MANAGEMENT MASTERY:**

**💰 Position Sizing - The Foundation:**

**🎯 The Options Risk Pyramid:**
• **Conservative (1-2%)**: Covered calls, CSPs, spreads
• **Moderate (2-3%)**: Long options, iron condors
• **Aggressive (3-5%)**: 0DTE, earnings plays, straddles
• **Speculative (<1%)**: Lottery tickets, YOLO plays

**⚡ Account Allocation Rules:**
• **Max 20% in Options**: Never go all-in on options
• **Max 10% Per Trade**: Single position limits
• **Max 5% Per Expiration**: Spread risk across time
• **Cash Reserves**: Keep 30% for opportunities

**🔸 Options-Specific Risk Rules:**

**Time Decay Management:**
• **Don't Buy <7 DTE**: Unless scalping or 0DTE strategy
• **Sell 30-45 DTE**: Optimal theta decay window
• **Roll Before 21 DTE**: Avoid gamma risk explosion
• **Weekend Risk**: 3 days of theta over weekends

**Volatility Risk Control:**
• **Don't Buy High IV**: >75th percentile = expensive
• **Sell When IV High**: VIX >25 = premium selling time
• **IV Crush Protection**: Exit before earnings announcement
• **Volatility Clustering**: Prepare for continued high/low IV

**🛡️ Stop Loss Strategies by Trade Type:**

**🔸 Long Options (Calls/Puts):**
• **50% Rule**: Cut losses at 50% of premium paid
• **Time Stop**: Exit if no movement in first half of DTE
• **Technical Stop**: Exit if underlying breaks key level
• **Volatility Stop**: Exit if IV drops significantly

**🔸 Credit Spreads:**
• **50% Profit Rule**: Close at 50% of max profit
• **200% Loss Rule**: Stop loss at 200% of credit received
• **Early Management**: Close winning side early
• **Delta Management**: Adjust if delta gets too high

**🔸 Debit Spreads:**
• **50% Loss Rule**: Stop at 50% of premium paid
• **Profit Target**: Close at 75% of max profit
• **Time Management**: Exit with 30% of time remaining
• **Technical Exit**: Close if underlying reverses trend

**⚡ Portfolio Heat Management:**

**Correlation Limits:**
• **Max 30% in Single Sector**: Avoid tech-heavy blowups
• **Spread Across Timeframes**: Weekly + monthly exposure
• **Balance Strategies**: Mix buying + selling approaches
• **Hedge Positions**: VIX calls during market stress

**Emergency Protocols:**
• **Market Crash**: Close naked positions immediately
• **Volatility Spike**: Reassess all short positions
• **Earnings Disaster**: Don't panic-sell, reassess plan
• **Personal Stress**: Step away, don't revenge trade

**🎯 Advanced Risk Techniques:**

**Greeks Portfolio Management:**
• **Total Portfolio Delta**: Keep under ±50 for neutrality
• **Theta Tracking**: Monitor daily decay across all positions
• **Vega Exposure**: Limit sensitivity to volatility changes
• **Gamma Risk**: Watch acceleration risk near expiration

**Kelly Criterion for Options:**
• **Formula**: f = (bp - q) / b
• **Application**: Size positions based on edge and win rate
• **Reality**: Most retail traders oversize positions
• **Conservative**: Use 25% of Kelly suggestion

**💡 Psychological Risk Management:**
• **Trading Journal**: Track every decision and outcome
• **Position Limits**: Set before market opens
• **Emotional Stops**: Walk away when frustrated
• **Profit Taking**: Lock in gains systematically

**What's your biggest options risk challenge right now? Position sizing, stop losses, or portfolio management?** 💪`;
    }
    // General Options Trading
    else if (isOptionsQuery) {
      response = `⚡ **OPTIONS TRADING COMMAND CENTER:**

🚀 **Your Options Toolkit:**

**📊 Strategy Selection Guide:**
• **Bullish**: Calls, bull spreads, covered calls
• **Bearish**: Puts, bear spreads, protective puts
• **Neutral**: Iron condors, butterflies, straddles
• **Income**: Covered calls, CSPs, theta strategies
• **Volatility**: Straddles, strangles, calendar spreads

**🎯 Market Environment Strategies:**

**🔸 Low Volatility (VIX <20):**
• **Buy Options**: Cheap premiums before volatility expansion
• **Long Straddles**: Bet on volatility increase
• **Calendar Spreads**: Benefit from volatility skew
• **Avoid**: Selling premium (not enough credit)

**🔸 High Volatility (VIX >25):**
• **Sell Options**: Rich premiums, high probability wins
• **Iron Condors**: Range-bound profit from time decay
• **Covered Calls**: Enhanced income from high IV
• **Avoid**: Buying expensive options

**⚡ Time Frame Strategies:**

**🔸 0-7 DTE (Scalping):**
• High risk/reward gamma plays
• Requires constant monitoring
• Best for experienced traders
• ATM options for maximum gamma

**🔸 1-4 Weeks (Swing Trading):**
• Weekly options cycles
• Good balance of time/premium
• Technical analysis driven
• Popular retail timeframe

**🔸 30-60 DTE (Probability Trading):**
• Optimal theta decay window
• Higher probability strategies
• Professional trader favorite
• Best risk/reward balance

**🛡️ Risk Management Essentials:**
• **Position Size**: Never risk more than you can afford to lose
• **Diversification**: Spread across strikes, expirations, strategies
• **Profit Taking**: Lock in 50% gains on credit spreads
• **Loss Cutting**: Stop losses at 50% for debit plays

**📈 Performance Tracking:**
• **Win Rate**: Target 65-70% for credit strategies
• **Average Winner**: Should be larger than average loser
• **Monthly Returns**: Aim for 2-5% consistent growth
• **Sharpe Ratio**: Risk-adjusted returns matter most

**🎯 Next Level Options:**
• **Greeks Mastery**: Understand delta, theta, gamma, vega
• **Volatility Trading**: Buy low IV, sell high IV
• **Portfolio Management**: Total exposure monitoring
• **Tax Strategies**: Understand options tax implications

**What specific options topic would you like to dive deeper into?** 📊`;
    }
    // General greeting with options focus
    else if (query.includes('hello') || query.includes('hi') || query.includes('hey') || query.includes('what') && query.includes('up')) {
      response = `👋 **Hey there, options trader! Rolo here!**

⚡ **Ready to dominate the options market today?**

**🎯 I'm your specialist for:**
• **Options Strategy Analysis**: Calls, puts, spreads, straddles
• **Greeks Mastery**: Delta, theta, gamma, vega optimization  
• **Risk Management**: Position sizing, stop losses, portfolio heat
• **Volatility Trading**: IV analysis, earnings plays, VIX strategies
• **Market Analysis**: SPY/QQQ setups, sector rotations
• **Income Strategies**: Covered calls, CSPs, iron condors

**⚡ Try these options-focused questions:**
• *"What's the best AAPL options play right now?"*
• *"Explain iron condors for weekly income"*
• *"How do I manage theta decay risk?"*
• *"Should I buy or sell volatility today?"*
• *"Help me size this 0DTE trade properly"*

**🚀 Market Status Check:**
• What's your outlook - bullish, bearish, or neutral?
• Any specific tickers on your watchlist today?
• Looking for income plays or directional bets?

**💡 Pro Tip:** The more specific you are about your setup, market outlook, and risk tolerance, the better I can tailor strategies for your style!

**What's your first options move today?** 📈`;
    }
    // Default response with options focus
    else {
      response = `⚡ **Rolo - Your Options Trading AI!**

**🚀 I'm built specifically for OPTIONS TRADERS:**

**📈 What I Excel At:**
• **Any Ticker Analysis**: Just mention a symbol (AAPL, TSLA, NVDA, etc.) and I'll break down the options opportunities
• **Strategy Deep Dives**: Covered calls, iron condors, straddles, 0DTE plays
• **Greeks Education**: Delta, theta, gamma, vega - and how to profit from them
• **Risk Management**: Position sizing, portfolio heat, stop losses
• **Market Timing**: When to buy/sell volatility, earnings plays
• **Income Generation**: Weekly theta strategies, wheel trades

**⚡ Options-Focused Questions That Work:**
• *"Best options strategy for [TICKER]?"*
• *"How do I trade earnings with options?"*
• *"Explain iron condors vs butterflies"*
• *"Should I buy this call or sell a put spread?"*
• *"How do I manage a losing options position?"*

**🎯 Current Market Opportunities:**
• High IV names for premium selling
• Low IV setups for volatility buying  
• Technical levels for strike selection
• Earnings calendar for catalyst plays

**What specific options challenge can I help you solve today?** 📊`;
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
        response: `⚡ Rolo here! Your options trading AI is ready.\n\nTry asking me about:\n• Any ticker's options opportunities\n• Greeks and strategy analysis\n• Risk management for options\n• Market volatility insights\n\nWhat's your options play today?`,
        isLive: false,
        fallback: true 
      })
    };
  }
};
