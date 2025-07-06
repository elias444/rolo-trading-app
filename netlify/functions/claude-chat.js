// netlify/functions/claude-chat.js - UNIVERSAL STOCK ANALYSIS
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

    const query = message.toLowerCase();
    let response = '';

    // UNIVERSAL TICKER DETECTION - Works for ANY stock symbol
    const tickerMatches = message.match(/\b[A-Z]{1,5}\b/g) || [];
    const isOptionsQuery = query.includes('option') || query.includes('call') || query.includes('put') || 
                          query.includes('strike') || query.includes('strategy') || query.includes('strategies') ||
                          query.includes('trade') || query.includes('play');

    console.log('Query:', query);
    console.log('Ticker matches:', tickerMatches);

    // UNIVERSAL STOCK ANALYSIS - Works for ANY ticker
    if (tickerMatches.length > 0) {
      const ticker = tickerMatches[0];
      
      // Get stock characteristics based on ticker patterns
      const stockInfo = getStockCharacteristics(ticker);
      
      response = `⚡ **${ticker} OPTIONS ANALYSIS:**

🎯 **${stockInfo.name} - Options Trading Breakdown:**

**📊 ${ticker} Stock Profile:**
• **Category**: ${stockInfo.category}
• **Volatility**: ${stockInfo.volatility}
• **Options Liquidity**: ${stockInfo.liquidity}
• **Typical IV Range**: ${stockInfo.ivRange}
• **Key Catalysts**: ${stockInfo.catalysts}

**🚀 ${ticker} Options Strategies:**

**📈 BULLISH ${ticker} Plays:**
• **Call Options**: ${stockInfo.bullishCalls}
• **Bull Call Spreads**: ${stockInfo.bullishSpreads}
• **Cash-Secured Puts**: ${stockInfo.bullishCSP}

**📉 BEARISH ${ticker} Plays:**
• **Put Options**: ${stockInfo.bearishPuts}
• **Bear Put Spreads**: ${stockInfo.bearishSpreads}
• **Put Credit Spreads**: ${stockInfo.bearishCredit}

**⚖️ NEUTRAL ${ticker} Strategies:**
• **Iron Condors**: ${stockInfo.neutralCondor}
• **Covered Calls**: ${stockInfo.neutralCoveredCalls}
• **Straddles/Strangles**: ${stockInfo.neutralStraddle}

**⚡ ${ticker} Risk Considerations:**
• **Volatility Risk**: ${stockInfo.volatilityRisk}
• **Liquidity Risk**: ${stockInfo.liquidityRisk}
• **Sector Risk**: ${stockInfo.sectorRisk}
• **News Sensitivity**: ${stockInfo.newsSensitivity}

**🎯 ${ticker} Key Technical Levels:**
• **Support Zones**: ${stockInfo.supportLevels}
• **Resistance Areas**: ${stockInfo.resistanceLevels}
• **Breakout Levels**: ${stockInfo.breakoutLevels}
• **Options Strike Clusters**: ${stockInfo.strikeGuidance}

**💡 ${ticker} Options Trading Tips:**
• **Best Time to Trade**: ${stockInfo.bestTiming}
• **IV Environment**: ${stockInfo.ivGuidance}
• **Position Sizing**: ${stockInfo.positionSize}
• **Exit Strategy**: ${stockInfo.exitStrategy}

**📅 ${ticker} Calendar Considerations:**
• **Earnings**: ${stockInfo.earningsImpact}
• **Ex-Dividend**: ${stockInfo.dividendImpact}
• **Sector Events**: ${stockInfo.sectorEvents}
• **Market Correlation**: ${stockInfo.marketCorrelation}

**🛡️ ${ticker} Risk Management:**
• **Max Position Size**: ${stockInfo.maxPosition}
• **Stop Loss Levels**: ${stockInfo.stopLoss}
• **Profit Targets**: ${stockInfo.profitTargets}
• **Time Decay Management**: ${stockInfo.timeDecay}

**What's your specific ${ticker} outlook? Looking for income generation, directional speculation, or volatility trading?** 📈`;
    }
    
    // STRATEGY-SPECIFIC RESPONSES
    else if (query.includes('covered call')) {
      response = `⚡ **COVERED CALLS MASTERY:**

🎯 **The Income Generator's Blueprint:**

**📋 Covered Call Mechanics:**
• Own 100 shares + sell 1 call option against them
• Collect premium income while capping upside potential
• Works best in neutral-to-slightly-bullish markets

**🚀 Optimal Setup Guidelines:**
• **Strike Selection**: 15-30 delta (usually OTM)
• **Time Frame**: 30-45 DTE for optimal theta decay
• **IV Environment**: Sell when IV >50th percentile
• **Stock Quality**: Use stocks you'd hold long-term

**💰 Income Targets:**
• **Monthly Goal**: 1-3% of stock value in premium
• **Annual Enhancement**: 12-36% additional returns
• **Win Rate**: 70-85% of options expire worthless

**⚡ Best Covered Call Candidates:**
• **High IV Stocks**: NVDA, TSLA, AMD, HOOD
• **Blue Chips**: AAPL, MSFT, GOOGL, JNJ
• **Dividend Stocks**: KO, PG, VZ, T
• **ETFs**: SPY, QQQ, IWM, XLF

**🛡️ Risk Management:**
• **Assignment**: Be ready to sell at strike price
• **Rolling**: Roll up and out if stock rallies past strike
• **Diversification**: Don't cover entire portfolio
• **Market Risk**: Underlying stock can still decline

**💡 Advanced Techniques:**
• **LEAPS Covered Calls**: Use LEAPS instead of owning stock
• **Ratio Covered Calls**: Sell more calls than shares owned
• **Collar Strategy**: Add protective puts for downside protection
• **Tax Considerations**: Be aware of wash sale rules

**🎯 Execution Tips:**
• Sell calls on green days when premiums are inflated
• Target strikes above recent resistance levels
• Consider earnings calendar (close before announcements)
• Track total return: dividends + premium + capital gains

**Ready to start generating income? What stocks do you currently own?** 📊`;
    }
    
    else if (query.includes('iron condor')) {
      response = `⚡ **IRON CONDORS - RANGE-BOUND PROFIT MACHINE:**

🎯 **Master the Neutral Income Strategy:**

**📋 Iron Condor Structure:**
• Sell OTM put spread + sell OTM call spread simultaneously
• Collect net credit, profit if stock stays between short strikes
• Limited risk, limited reward, high probability strategy

**🚀 Optimal Iron Condor Setup:**
• **Underlying**: Liquid options (SPY, QQQ, AAPL, MSFT)
• **Strike Selection**: 15-20 delta short strikes
• **Spread Width**: 5-10 points for good risk/reward
• **Time Frame**: 30-45 DTE for theta decay advantage

**💰 Profit Mechanics:**
• **Target Credit**: 1/3 of spread width minimum
• **Max Profit**: Full credit received (at expiration)
• **Breakeven Points**: Short strikes ± net credit
• **Win Rate**: 65-75% when properly managed

**⚡ Market Conditions for Iron Condors:**
• **High IV Environment**: VIX >20, rich premiums
• **Range-Bound Markets**: Sideways or choppy action
• **Post-Earnings**: After IV crush settles
• **Low Catalyst Period**: No major news expected

**🛡️ Risk Management Rules:**
• **Max Loss**: Spread width minus credit received
• **Profit Target**: Close at 50% of max profit
• **Stop Loss**: 200% of credit OR 50% of spread width
• **Early Management**: Adjust winners before losers

**💡 Advanced Iron Condor Techniques:**
• **Unbalanced ICs**: Adjust strikes for directional bias
• **Weekly Iron Condors**: Trade every week for income
• **Earnings Iron Condors**: Sell before, close after announcement
• **ETF Iron Condors**: SPY/QQQ for consistent income

**📊 Example Trade:**
SPY at $580 (45 DTE):
• Sell $570 Put / Buy $565 Put (put spread)
• Sell $590 Call / Buy $595 Call (call spread)
• Collect $2.00 credit, profit if SPY stays $570-$590

**🎯 Best Iron Condor Underlyings:**
• **SPY**: Highest liquidity, multiple expirations
• **QQQ**: Tech exposure, good volatility
• **IWM**: Small caps, higher premiums
• **Individual Stocks**: AAPL, MSFT, GOOGL (earnings plays)

**Ready to build your iron condor income stream? What's your preferred underlying?** 🦅`;
    }
    
    else if (query.includes('0dte') || query.includes('0 dte')) {
      response = `⚡ **0DTE TRADING - SAME DAY EXPIRATION:**

🎯 **The Ultimate High-Risk, High-Reward Strategy:**

**📋 0DTE Basics:**
• Options expiring the same trading day
• Massive gamma exposure = explosive price movements
• Pure directional play with no time value left
• Requires lightning-fast decision making

**🚀 0DTE Optimal Conditions:**
• **Timing**: Final 2-3 hours of trading (2-4 PM EST)
• **Volume**: High volume days with institutional activity
• **Volatility**: Trending markets with clear direction
• **Liquidity**: SPY/QQQ only (tight spreads essential)

**💰 0DTE Profit Potential:**
• **Typical Gains**: 50-200% in minutes/hours
• **Success Rate**: 30-40% (most trades lose money)
• **Account Impact**: Can make or break accounts quickly
• **Skill Requirement**: Advanced traders only

**⚡ 0DTE Strategy Menu:**
• **ATM Calls/Puts**: Maximum gamma exposure
• **Call/Put Spreads**: Defined risk versions
• **Iron Condors**: Sell volatility into close
• **Straddles**: Big move plays before close

**🛡️ Critical Risk Management:**
• **Position Size**: NEVER exceed 1% of account
• **Stop Loss**: -50% immediately, no exceptions
• **Profit Target**: 50-100% gains, take it and run
• **Time Cutoff**: Close ALL positions by 3:50 PM

**💡 0DTE Execution Rules:**
• **No Emotions**: Mechanical execution only
• **Quick Decisions**: Hesitation kills profits
• **Accept Losses**: Most trades will lose money
• **Paper Trade First**: Practice before risking real money

**🎯 0DTE Setups:**
• **Breakout Play**: Buy calls on resistance break
• **Reversal Play**: Buy puts on failed breakout
• **Momentum Follow**: Trade with the trend
• **Support/Resistance**: Bounce plays at key levels

**📊 Example 0DTE Trade:**
SPY at $580 at 2:30 PM:
• Buy $580 calls if breaking above resistance
• Risk: $50 per contract (small size)
• Target: $100-150 per contract (100-200% gain)
• Stop: $25 per contract (-50% loss)
• Exit: By 3:45 PM regardless of P&L

**⚠️ 0DTE Reality Check:**
• This is speculation, not investing
• Most retail traders lose money consistently
• Requires extensive screen time and practice
• Start with paper trading to learn mechanics
• Only use money you can afford to lose completely

**0DTE is not for beginners! Are you experienced with options and ready for the challenge?** ⚡`;
    }
    
    // GREEKS EDUCATION
    else if (query.includes('greeks') || query.includes('delta') || query.includes('theta') || query.includes('gamma') || query.includes('vega')) {
      response = `⚡ **THE GREEKS - OPTIONS SUPERPOWERS:**

🎯 **Master These 4 Greeks to Dominate Options:**

**🔸 DELTA - Direction & Speed**
• **Definition**: How much option price changes per $1 stock move
• **Call Delta**: 0 to 1.00 (0.50 = 50¢ move per $1 stock move)
• **Put Delta**: 0 to -1.00 (-0.30 = 30¢ gain per $1 stock drop)
• **Trading Tip**: 0.40-0.70 delta for directional plays
• **Portfolio Use**: Hedge ratio for delta-neutral strategies

**🔸 THETA - Time Decay (The Silent Killer)**
• **Definition**: Daily time value loss from options
• **Impact**: Accelerates dramatically in final 30 days
• **Long Options**: Theta is your enemy (buy low theta)
• **Short Options**: Theta is your friend (sell high theta)
• **Sweet Spot**: Sell 30-45 DTE, buy >60 DTE

**🔸 GAMMA - Acceleration Power**
• **Definition**: Rate of change in delta as stock moves
• **Peak Power**: ATM options have highest gamma
• **0DTE Effect**: Gamma explodes on expiration day
• **Risk/Reward**: High gamma = high profit potential + high risk
• **Strategy**: Buy gamma before big moves, sell after

**🔸 VEGA - Volatility Sensitivity**
• **Definition**: Option price change per 1% IV move
• **Earnings Impact**: Massive vega risk around announcements
• **Market Timing**: Buy low IV, sell high IV
• **LEAPS**: Highest vega exposure (most sensitive)
• **VIX Correlation**: High VIX = high vega impact

**⚡ Greeks in Action - Real Trading:**

**🎯 Long Call Strategy (You Want):**
• High Delta (0.60+): More stock-like movement
• Low Theta: Minimal daily decay
• Moderate Gamma: Acceleration working for you
• Low Vega: Less IV sensitivity

**🎯 Short Put Strategy (You Want):**
• Low Delta (0.15-0.30): Lower assignment risk
• High Theta: Fast decay in your favor
• Low Gamma: Stable delta throughout trade
• High Vega: Benefit from IV collapse

**🛡️ Greeks Risk Management:**
• **Portfolio Delta**: Keep between -50 to +50 for neutrality
• **Theta Decay**: Monitor daily P&L from time decay
• **Gamma Risk**: Dangerous near expiration with large positions
• **Vega Exposure**: Limit during high IV periods

**💡 Advanced Greeks Strategies:**
• **Delta Hedging**: Buy/sell shares to neutralize delta
• **Gamma Scalping**: Profit from price acceleration
• **Theta Harvesting**: Collect time decay systematically
• **Vega Trading**: Buy cheap IV, sell expensive IV

**📊 Greeks Monitoring Tools:**
• Most brokers show Greeks in options chains
• Focus on portfolio Greeks, not individual positions
• Watch how Greeks change with time and price
• Use Greeks to determine position sizing

**Which Greek would you like to master first? They're all interconnected!** 📈`;
    }
    
    // DEFAULT RESPONSE - Enhanced with examples
    else {
      response = `🧠 **Rolo's Universal Options Analysis:**

**⚡ I can analyze ANY stock ticker! Here's how:**

**🎯 For Any Ticker Analysis:**
• **"HOOD options strategies"** → Complete HOOD breakdown
• **"NVDA earnings play"** → NVIDIA catalyst analysis
• **"BRK.A covered calls"** → Berkshire income strategy
• **"COIN volatility trade"** → Coinbase options opportunities

**📚 Universal Strategy Guides:**
• **"Covered calls setup"** → Income generation blueprint
• **"Iron condor strategy"** → Range-bound profit machine
• **"0DTE trading"** → Same-day expiration tactics
• **"Earnings options plays"** → Catalyst trading guide

**⚡ Market Environment Analysis:**
• **"High IV stocks"** → Premium selling opportunities
• **"Low IV plays"** → Volatility buying setups
• **"VIX trading"** → Fear index strategies
• **"Sector rotation"** → Industry-specific plays

**🛡️ Risk Management Education:**
• **"Position sizing"** → How much to risk per trade
• **"Greeks explained"** → Delta, theta, gamma, vega
• **"Stop loss strategies"** → When and how to exit
• **"Portfolio management"** → Total exposure monitoring

**💡 Advanced Topics:**
• **"Wheel strategy"** → CSP to covered calls cycle
• **"Calendar spreads"** → Time decay arbitrage
• **"Ratio spreads"** → Unequal leg strategies
• **"Synthetic positions"** → Stock replacement techniques

**🎯 Popular Stock Categories I Analyze:**
• **Mega Caps**: AAPL, MSFT, GOOGL, AMZN, TSLA
• **Meme Stocks**: GME, AMC, HOOD, PLTR
• **Tech Growth**: NVDA, AMD, CRM, SNOW
• **ETFs**: SPY, QQQ, IWM, XLF, GLD
• **Crypto Related**: COIN, MSTR, RIOT, MARA
• **Biotech**: MRNA, PFE, JNJ, ABBV
• **Energy**: XOM, CVX, OXY, SLB

**Just mention ANY ticker symbol and I'll give you a complete options analysis! What stock interests you today?** 📊`;
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
        response: `⚡ Rolo here! I can analyze ANY stock ticker for options trading.\n\nJust ask: "[TICKER] options strategies"\n\nTry: AAPL, TSLA, NVDA, HOOD, SPY, QQQ, or any stock symbol!\n\nWhat ticker interests you?`,
        isLive: false,
        fallback: true 
      })
    };
  }
};

// UNIVERSAL STOCK CHARACTERISTICS FUNCTION
function getStockCharacteristics(ticker) {
  // Create intelligent characteristics based on ticker patterns and known info
  const characteristics = {
    name: getCompanyName(ticker),
    category: getStockCategory(ticker),
    volatility: getVolatilityProfile(ticker),
    liquidity: getLiquidityProfile(ticker),
    ivRange: getIVRange(ticker),
    catalysts: getCatalysts(ticker),
    
    // Strategy-specific guidance
    bullishCalls: getBullishCallsGuidance(ticker),
    bullishSpreads: getBullishSpreadsGuidance(ticker),
    bullishCSP: getBullishCSPGuidance(ticker),
    bearishPuts: getBearishPutsGuidance(ticker),
    bearishSpreads: getBearishSpreadsGuidance(ticker),
    bearishCredit: getBearishCreditGuidance(ticker),
    neutralCondor: getNeutralCondorGuidance(ticker),
    neutralCoveredCalls: getNeutralCoveredCallsGuidance(ticker),
    neutralStraddle: getNeutralStraddleGuidance(ticker),
    
    // Risk factors
    volatilityRisk: getVolatilityRisk(ticker),
    liquidityRisk: getLiquidityRisk(ticker),
    sectorRisk: getSectorRisk(ticker),
    newsSensitivity: getNewsSensitivity(ticker),
    
    // Technical guidance
    supportLevels: "Use technical analysis to identify key support zones",
    resistanceLevels: "Monitor resistance areas for strike selection",
    breakoutLevels: "Watch for volume confirmation on breakouts",
    strikeGuidance: "Focus on strikes with high open interest",
    
    // Trading guidance
    bestTiming: getBestTiming(ticker),
    ivGuidance: getIVGuidance(ticker),
    positionSize: getPositionSizeGuidance(ticker),
    exitStrategy: getExitStrategy(ticker),
    earningsImpact: getEarningsImpact(ticker),
    dividendImpact: getDividendImpact(ticker),
    sectorEvents: getSectorEvents(ticker),
    marketCorrelation: getMarketCorrelation(ticker),
    
    // Risk management
    maxPosition: getMaxPosition(ticker),
    stopLoss: getStopLoss(ticker),
    profitTargets: getProfitTargets(ticker),
    timeDecay: getTimeDecay(ticker)
  };
  
  return characteristics;
}

// Helper functions for stock characteristics
function getCompanyName(ticker) {
  const names = {
    'AAPL': 'Apple Inc.',
    'MSFT': 'Microsoft Corp.',
    'GOOGL': 'Alphabet Inc.',
    'TSLA': 'Tesla Inc.',
    'NVDA': 'NVIDIA Corp.',
    'HOOD': 'Robinhood Markets',
    'SPY': 'SPDR S&P 500 ETF',
    'QQQ': 'Invesco QQQ Trust'
  };
  return names[ticker] || `${ticker} Corporation`;
}

function getStockCategory(ticker) {
  if (['SPY', 'QQQ', 'IWM', 'XLF'].includes(ticker)) return 'ETF/Index';
  if (['AAPL', 'MSFT', 'GOOGL', 'AMZN'].includes(ticker)) return 'Mega-Cap Technology';
  if (['TSLA', 'NVDA', 'AMD'].includes(ticker)) return 'High-Growth Technology';
  if (['HOOD', 'COIN', 'SQ'].includes(ticker)) return 'Fintech/Disruptive';
  if (['GME', 'AMC', 'BBBY'].includes(ticker)) return 'Meme Stock/High Volatility';
  if (ticker.length <= 3) return 'Large-Cap Stock';
  return 'Individual Equity';
}

function getVolatilityProfile(ticker) {
  if (['TSLA', 'NVDA', 'HOOD', 'GME', 'AMC'].includes(ticker)) return 'High (30-60% IV)';
  if (['AAPL', 'MSFT', 'GOOGL'].includes(ticker)) return 'Moderate (20-40% IV)';
  if (['SPY', 'QQQ'].includes(ticker)) return 'Low-Moderate (15-30% IV)';
  return 'Variable (depends on market conditions)';
}

function getLiquidityProfile(ticker) {
  if (['SPY', 'QQQ', 'AAPL', 'MSFT'].includes(ticker)) return 'Excellent (tight spreads, high volume)';
  if (['TSLA', 'NVDA', 'GOOGL', 'AMZN'].includes(ticker)) return 'Very Good (liquid options market)';
  if (['HOOD', 'AMD', 'COIN'].includes(ticker)) return 'Good (adequate liquidity)';
  return 'Check bid-ask spreads before trading';
}

function getIVRange(ticker) {
  if (['TSLA', 'HOOD', 'GME'].includes(ticker)) return '40-80% (high volatility stock)';
  if (['NVDA', 'AMD'].includes(ticker)) return '30-60% (growth stock)';
  if (['AAPL', 'MSFT'].includes(ticker)) return '20-40% (blue chip)';
  if (['SPY', 'QQQ'].includes(ticker)) return '15-35% (index/ETF)';
  return '20-50% (typical range)';
}

function getCatalysts(ticker) {
  if (['AAPL'].includes(ticker)) return 'Quarterly earnings, product launches, iPhone cycles';
  if (['TSLA'].includes(ticker)) return 'Delivery numbers, earnings, Elon tweets, EV market news';
  if (['NVDA'].includes(ticker)) return 'AI developments, data center demand, gaming trends';
  if (['HOOD'].includes(ticker)) return 'Regulatory news, crypto trends, user growth metrics';
  if (['SPY', 'QQQ'].includes(ticker)) return 'Fed policy, economic data, market sentiment';
  return 'Earnings reports, sector news, market movements';
}

function getBullishCallsGuidance(ticker) {
  if (['TSLA', 'NVDA'].includes(ticker)) return 'Target 0.40-0.60 delta, 30-60 DTE for momentum plays';
  if (['AAPL', 'MSFT'].includes(ticker)) return 'ITM calls for safety, OTM for leverage on earnings';
  if (['SPY', 'QQQ'].includes(ticker)) return 'ATM calls for market exposure, spreads for risk management';
  return 'Consider 0.30-0.50 delta calls with 30+ DTE';
}

function getBullishSpreadsGuidance(ticker) {
  return `${ticker} bull call spreads: Buy lower strike, sell higher strike for defined risk`;
}

function getBullishCSPGuidance(ticker) {
  return `Sell puts below key support levels to get paid while waiting to own ${ticker}`;
}

function getBearishPutsGuidance(ticker) {
  if (['HOOD', 'TSLA'].includes(ticker)) return 'High IV makes puts expensive but profitable on big moves';
  return `${ticker} puts: Target high-probability strikes below support`;
}

function getBearishSpreadsGuidance(ticker) {
  return `${ticker} bear put spreads: Buy higher strike, sell lower strike`;
}

function getBearishCreditGuidance(ticker) {
  return `Sell ${ticker} put spreads below support for income generation`;
}

function getNeutralCondorGuidance(ticker) {
  if (['SPY', 'QQQ'].includes(ticker)) return 'Perfect for weekly iron condors in range-bound markets';
  return `Trade ${ticker} iron condors in high IV, low movement periods`;
}

function getNeutralCoveredCallsGuidance(ticker) {
  if (['AAPL', 'MSFT'].includes(ticker)) return 'Excellent for covered calls - stable with good premiums';
  return `If you own ${ticker} shares, sell calls for additional income`;
}

function getNeutralStraddleGuidance(ticker) {
  return `${ticker} straddles: Buy before earnings, sell before announcement`;
}

function getVolatilityRisk(ticker) {
  if (['TSLA', 'HOOD', 'GME'].includes(ticker)) return 'Very High - explosive moves common';
  if (['NVDA', 'AMD'].includes(ticker)) return 'High - growth stock volatility';
  return 'Moderate - normal stock price fluctuations';
}

function getLiquidityRisk(ticker) {
  if (['SPY', 'QQQ', 'AAPL'].includes(ticker)) return 'Very Low - excellent liquidity';
  return 'Check bid-ask spreads, avoid wide spreads';
}

function getSectorRisk(ticker) {
  if (['AAPL', 'MSFT', 'GOOGL'].includes(ticker)) return 'Tech sector correlation risk';
  if (['HOOD', 'COIN'].includes(ticker)) return 'Fintech/crypto regulatory risk';
  return 'Sector-specific news and rotation risk';
}

function getNewsSensitivity(ticker) {
  if (['TSLA', 'HOOD'].includes(ticker)) return 'Very High - news-driven price action';
  if (['AAPL', 'MSFT'].includes(ticker)) return 'Moderate - earnings and product news';
  return 'Normal corporate news sensitivity';
}

function getBestTiming(ticker) {
  if (['SPY', 'QQQ'].includes(ticker)) return 'Any time - always liquid markets';
  return 'Avoid low-volume periods, trade during market hours';
}

function getIVGuidance(ticker) {
  return `Buy ${ticker} options when IV <25th percentile, sell when IV >75th percentile`;
}

function getPositionSizeGuidance(ticker) {
  if (['TSLA', 'HOOD', 'GME'].includes(ticker)) return 'Small positions (1-2%) due to high volatility';
  return 'Standard options position sizing (2-5% of account)';
}

function getExitStrategy(ticker) {
  return `${ticker} exits: 50% profit on credit spreads, 100% on debit spreads`;
}

function getEarningsImpact(ticker) {
  return `${ticker} earnings typically cause 3-8% moves with significant IV crush`;
}

function getDividendImpact(ticker) {
  if (['AAPL', 'MSFT'].includes(ticker)) return 'Quarterly dividends affect options pricing near ex-date';
  return 'Monitor dividend calendar for options assignment risk';
}

function getSectorEvents(ticker) {
  if (['AAPL', 'MSFT'].includes(ticker)) return 'Tech conferences, product launches, industry trends';
  if (['HOOD', 'COIN'].includes(ticker)) return 'Regulatory announcements, crypto market moves';
  return 'Industry-specific events and conferences';
}

function getMarketCorrelation(ticker) {
  if (['SPY'].includes(ticker)) return 'Pure market correlation (beta = 1.0)';
  if (['QQQ', 'AAPL', 'MSFT'].includes(ticker)) return 'High tech/growth correlation';
  return 'Moderate market correlation with sector bias';
}

function getMaxPosition(ticker) {
  if (['TSLA', 'HOOD', 'GME'].includes(ticker)) return '1-2% max due to high volatility';
  return '3-5% max position size recommended';
}

function getStopLoss(ticker) {
  return `${ticker} stops: -50% on long options, +200% credit on short options`;
}

function getProfitTargets(ticker) {
  return `${ticker} targets: 50-100% on debit spreads, 25-50% on credit spreads`;
}

function getTimeDecay(ticker) {
  return `${ticker} time decay: Avoid buying <21 DTE, sell 30-45 DTE optimal`;
}
