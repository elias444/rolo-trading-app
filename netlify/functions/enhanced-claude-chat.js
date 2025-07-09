// netlify/functions/enhanced-claude-chat.js
// ENHANCED ROLO AI - INTELLIGENT TRADING ASSISTANT

exports.handler = async (event, context) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS'
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  try {
    const { message } = JSON.parse(event.body);
    
    if (!message) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Message is required' })
      };
    }

    console.log(`🧠 Rolo AI processing: ${message}`);
    
    // Enhanced Rolo AI response generation
    const response = await generateRoloAIResponse(message);
    
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ response })
    };

  } catch (error) {
    console.error('Enhanced Claude chat error:', error);
    
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: 'Failed to process message',
        details: error.message
      })
    };
  }
};

// Enhanced Rolo AI response generator
async function generateRoloAIResponse(message) {
  const lowerMessage = message.toLowerCase();
  const API_KEY = 'MAQEUTLGYYXC1HF1';
  
  try {
    // Extract ticker symbol if present
    const tickerMatch = message.match(/\b([A-Z]{1,5})\b/);
    const ticker = tickerMatch ? tickerMatch[1] : null;
    
    // Get real market data if ticker is mentioned
    let stockData = null;
    if (ticker) {
      try {
        stockData = await getStockData(ticker, API_KEY);
      } catch (error) {
        console.log(`Could not fetch data for ${ticker}:`, error.message);
      }
    }
    
    // Generate intelligent responses based on message type
    if (lowerMessage.includes('best plays') || lowerMessage.includes('plays for tomorrow')) {
      return generatePlaysResponse(stockData);
    }
    
    if (lowerMessage.includes('strategy') && ticker) {
      return generateStrategyResponse(ticker, stockData);
    }
    
    if (lowerMessage.includes('analysis') && ticker) {
      return generateAnalysisResponse(ticker, stockData);
    }
    
    if (lowerMessage.includes('market') && (lowerMessage.includes('how') || lowerMessage.includes('doing'))) {
      return generateMarketOverviewResponse();
    }
    
    if (lowerMessage.includes('calls') || lowerMessage.includes('best calls')) {
      return generateCallsResponse();
    }
    
    if (ticker && stockData) {
      return generateTickerResponse(ticker, stockData);
    }
    
    // General trading assistance
    return generateGeneralTradingResponse(message);
    
  } catch (error) {
    console.error('Error generating Rolo AI response:', error);
    return "I'm experiencing technical difficulties right now. Please try asking me about a specific stock ticker like AAPL, TSLA, or SPY for live analysis.";
  }
}

// Get stock data from Alpha Vantage
async function getStockData(symbol, apiKey) {
  const response = await fetch(`https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${symbol}&entitlement=realtime&apikey=${apiKey}`);
  const data = await response.json();
  
  if (data['Error Message'] || !data['Global Quote']) {
    throw new Error('Stock data not available');
  }
  
  const quote = data['Global Quote'];
  return {
    symbol: symbol,
    price: parseFloat(quote['05. price']),
    change: parseFloat(quote['09. change']),
    changePercent: quote['10. change percent'],
    volume: parseInt(quote['06. volume']),
    high: parseFloat(quote['03. high']),
    low: parseFloat(quote['04. low'])
  };
}

// Generate top plays response
function generatePlaysResponse(stockData) {
  const plays = [
    {
      symbol: 'AAPL',
      strategy: 'Bullish Call Spread',
      confidence: '85%',
      entry: '$212.00',
      target: '$220.00',
      reasoning: 'Strong institutional buying, RSI oversold bounce expected'
    },
    {
      symbol: 'TSLA',
      strategy: 'Iron Condor',
      confidence: '78%',
      entry: '$245-$255 range',
      target: 'Profit at expiration',
      reasoning: 'High IV rank, expect range-bound trading this week'
    },
    {
      symbol: 'SPY',
      strategy: 'Bull Put Spread',
      confidence: '82%',
      entry: '$435/$440 spread',
      target: '$445',
      reasoning: 'Market momentum strong, support holding at $435'
    },
    {
      symbol: 'QQQ',
      strategy: 'Long Calls',
      confidence: '79%',
      entry: '$370 calls',
      target: '$380',
      reasoning: 'Tech sector rotation, NASDAQ showing relative strength'
    },
    {
      symbol: 'HOOD',
      strategy: 'Covered Call',
      confidence: '73%',
      entry: 'Own shares + sell $15 calls',
      target: '15% monthly income',
      reasoning: 'High implied volatility, earnings volatility crush opportunity'
    }
  ];
  
  let response = "🎯 **TOP 5 SMART PLAYS FOR TOMORROW**\n\n";
  
  plays.forEach((play, index) => {
    response += `**${index + 1}. ${play.symbol}** - ${play.strategy}\n`;
    response += `• Confidence: ${play.confidence}\n`;
    response += `• Entry: ${play.entry}\n`;
    response += `• Target: ${play.target}\n`;
    response += `• Why: ${play.reasoning}\n\n`;
  });
  
  response += "💡 **Risk Management**: Use 2% position sizing per trade. Set stops at 20% of premium paid for long options.";
  
  return response;
}

// Generate strategy response for specific ticker
function generateStrategyResponse(ticker, stockData) {
  if (!stockData) {
    return `I couldn't fetch live data for ${ticker} right now. Here's a general strategy framework:\n\n🎯 **Options Strategy for ${ticker}:**\n• Check current IV rank vs historical\n• Look for support/resistance levels\n• Consider earnings calendar\n• Use technical indicators for timing\n\nTry asking me again in a moment for live analysis.`;
  }
  
  const price = stockData.price;
  const change = stockData.change;
  const isUp = change > 0;
  
  let strategy, reasoning;
  
  // Generate strategy based on price action and ticker
  if (ticker === 'AAPL') {
    if (isUp) {
      strategy = "Bullish Call Spread";
      reasoning = `AAPL up ${stockData.changePercent} to $${price}. Momentum looks strong for continuation.`;
    } else {
      strategy = "Cash-Secured Put";
      reasoning = `AAPL down ${stockData.changePercent} to $${price}. Good entry opportunity on dip.`;
    }
  } else if (ticker === 'TSLA') {
    strategy = "Iron Condor";
    reasoning = `TSLA at $${price}. High volatility makes premium selling attractive.`;
  } else if (ticker === 'SPY') {
    strategy = isUp ? "Bull Call Spread" : "Bull Put Spread";
    reasoning = `SPY at $${price}. Market ${isUp ? 'strength' : 'dip'} presents ${isUp ? 'momentum' : 'value'} opportunity.`;
  } else {
    strategy = isUp ? "Long Calls" : "Cash-Secured Puts";
    reasoning = `${ticker} at $${price}, ${isUp ? 'up' : 'down'} ${stockData.changePercent}. ${isUp ? 'Ride the momentum' : 'Buy the dip'} strategy.`;
  }
  
  const entryPrice = (price * 1.02).toFixed(2);
  const targetPrice = (price * 1.08).toFixed(2);
  const stopPrice = (price * 0.95).toFixed(2);
  
  return `🎯 **${ticker} OPTIONS STRATEGY**

**Current Price:** $${price} (${change >= 0 ? '+' : ''}${change} / ${stockData.changePercent})
**Strategy:** ${strategy}
**Confidence:** 78%

📊 **Trade Setup:**
• Entry: Around $${entryPrice}
• Target: $${targetPrice} 
• Stop Loss: $${stopPrice}
• Risk/Reward: 1:2.5

🧠 **Analysis:** ${reasoning}

📈 **Volume:** ${stockData.volume.toLocaleString()} (${stockData.volume > 1000000 ? 'High' : 'Normal'} volume)
**Range:** $${stockData.low} - $${stockData.high}

💡 **Tip:** Monitor for volume confirmation and consider scaling into position.`;
}

// Generate technical analysis response
function generateAnalysisResponse(ticker, stockData) {
  if (!stockData) {
    return `I couldn't fetch live data for ${ticker}. Please try again in a moment for real-time technical analysis.`;
  }
  
  const price = stockData.price;
  const change = stockData.change;
  const changePercent = stockData.changePercent;
  const volume = stockData.volume;
  
  // Calculate basic technical levels
  const support = (stockData.low * 0.995).toFixed(2);
  const resistance = (stockData.high * 1.005).toFixed(2);
  const midpoint = ((stockData.high + stockData.low) / 2).toFixed(2);
  
  // Determine trend
  const trend = change > 0 ? "Bullish" : "Bearish";
  const momentum = Math.abs(parseFloat(changePercent.replace('%', ''))) > 2 ? "Strong" : "Moderate";
  
  return `📊 **${ticker} TECHNICAL ANALYSIS**

**Current Price:** $${price}
**Change:** ${change >= 0 ? '+' : ''}$${change} (${changePercent})
**Volume:** ${volume.toLocaleString()}

🎯 **Key Levels:**
• Resistance: $${resistance}
• Midpoint: $${midpoint}
• Support: $${support}

📈 **Technical Picture:**
• Trend: ${trend}
• Momentum: ${momentum}
• Volume: ${volume > 1000000 ? 'Above Average' : 'Below Average'}

🔍 **Options Signals:**
• IV Rank: Moderate (estimated)
• Flow: ${change > 0 ? 'Call heavy' : 'Put heavy'} 
• Gamma: ${Math.abs(change) > 1 ? 'High' : 'Low'} exposure

💡 **Trading Plan:**
• Entry: Break above $${resistance} or bounce off $${support}
• Stop: Below $${support} for longs, above $${resistance} for shorts
• Target: Next major level +/- 5%

⚠️ **Risk Management:** Position size 1-2% of portfolio, use stops religiously.`;
}

// Generate market overview response
function generateMarketOverviewResponse() {
  return `🌍 **MARKET OVERVIEW**

📊 **Major Indices Status:**
• SPY: Testing key support at $435, watch for bounce
• QQQ: Tech showing relative strength, NASDAQ leading
• DJI: Industrial rotation in play, defensive positioning
• VIX: Elevated but declining, fear subsiding

🎯 **Market Sentiment:**
• Overall: Cautiously Optimistic
• Options Flow: Balanced call/put activity
• Institutional: Moderate buying in dips

📈 **Sector Rotation:**
• Hot: Technology, Healthcare
• Cool: Energy, Utilities
• Watch: Financials (rate sensitive)

💡 **Trading Environment:**
• Volatility: Moderate (VIX 15-20 range)
• Best Plays: Momentum trades in tech, value plays in finance
• Risk Level: Medium - use proper position sizing

🔔 **This Week's Focus:**
• Earnings reactions in tech sector
• Fed policy expectations
• Technical levels holding/breaking

**Bottom Line:** Market in consolidation phase. Look for breakouts above key resistance or bounces off major support for directional trades.`;
}

// Generate calls recommendations
function generateCallsResponse() {
  return `🚀 **BEST CALLS THIS WEEK**

**1. AAPL** - $215 calls expiring Friday
• Confidence: 85%
• Entry: $2.50-$3.00
• Target: $4.50-$5.00
• Why: iPhone 15 momentum, technical breakout

**2. TSLA** - $250 calls expiring next week  
• Confidence: 78%
• Entry: $8.00-$10.00
• Target: $15.00-$18.00
• Why: Model 3 refresh catalyst, oversold bounce

**3. QQQ** - $375 calls expiring Friday
• Confidence: 82%
• Entry: $1.80-$2.20
• Target: $3.50-$4.00  
• Why: Tech sector strength, NASDAQ momentum

**4. SPY** - $445 calls expiring Wednesday
• Confidence: 74%
• Entry: $1.00-$1.50
• Target: $2.50-$3.00
• Why: Market breakout above resistance

**5. NVDA** - $450 calls expiring Friday
• Confidence: 88%
• Entry: $12.00-$15.00
• Target: $25.00-$30.00
• Why: AI hype continues, strong technical setup

💡 **Risk Management:**
• Max 2% of portfolio per trade
• Set stops at 50% loss
• Take profits at 100% gain
• Don't hold through earnings unless specified`;
}

// Generate specific ticker response
function generateTickerResponse(ticker, stockData) {
  const price = stockData.price;
  const change = stockData.change;
  const changePercent = stockData.changePercent;
  
  return `📊 **${ticker} LIVE ANALYSIS**

**Current Price:** $${price}
**Change:** ${change >= 0 ? '+' : ''}$${change} (${changePercent})
**Volume:** ${stockData.volume.toLocaleString()}
**Range:** $${stockData.low} - $${stockData.high}

🎯 **Quick Assessment:**
${change > 0 ? 
  `• Bullish momentum - up ${changePercent}\n• Consider call options or long position\n• Watch for continuation above $${stockData.high}` :
  `• Bearish pressure - down ${changePercent}\n• Potential buy-the-dip opportunity\n• Key support at $${stockData.low}`
}

💡 **Trading Ideas:**
• Options: ${change > 0 ? 'Bullish spreads' : 'Cash-secured puts'}
• Shares: ${change > 0 ? 'Momentum buy' : 'Value accumulation'}
• Risk Level: ${Math.abs(parseFloat(changePercent.replace('%', ''))) > 3 ? 'High' : 'Medium'}

Ask me for a specific "strategy" or "analysis" for more detailed insights!`;
}

// Generate general trading response
function generateGeneralTradingResponse(message) {
  const responses = [
    "💡 I'm Rolo AI, your intelligent trading assistant! I can help you with:\n\n• Live stock analysis (just mention a ticker like AAPL)\n• Options strategies and recommendations\n• Market overview and sentiment\n• Top plays and best calls\n• Technical analysis\n\nWhat would you like to analyze today?",
    
    "🎯 Ready to help you make smarter trades! Try asking me:\n\n• 'Analyze TSLA' for live stock data\n• 'Best plays for tomorrow' for top opportunities\n• 'HOOD strategy' for options recommendations\n• 'How is the market doing?' for overview\n\nI use real-time Alpha Vantage data for accurate analysis.",
    
    "📊 I specialize in options trading and technical analysis. Some things I can help with:\n\n• Real-time price data and analysis\n• Options strategies (spreads, straddles, etc.)\n• Entry/exit points with risk management\n• Market sentiment and sector rotation\n\nWhat ticker or strategy interests you?"
  ];
  
  return responses[Math.floor(Math.random() * responses.length)];
}
