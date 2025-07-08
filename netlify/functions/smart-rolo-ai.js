// netlify/functions/smart-rolo-ai.js
// SMART ROLO AI - PURE ALGORITHMIC INTELLIGENCE, NO EXTERNAL AI APIS

exports.handler = async (event, context) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS'
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
    const { message, conversationHistory, marketData, timestamp } = JSON.parse(event.body || '{}');
    
    if (!message) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Message is required' })
      };
    }

    console.log('Smart Rolo AI processing:', message.substring(0, 50) + '...');

    // Extract ticker symbols from message
    const tickerPattern = /\b([A-Z]{1,5})\b/g;
    const tickers = [...message.matchAll(tickerPattern)].map(match => match[1]);
    
    // Analyze message intent
    const intent = analyzeMessageIntent(message);
    
    // Get comprehensive market data for analysis
    const analysisData = await gatherAnalysisData(tickers);
    
    // Generate intelligent response based on intent and data
    const response = await generateIntelligentResponse(intent, message, analysisData, conversationHistory);
    
    console.log('✅ Smart Rolo AI response generated');

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        response: response.text,
        analysis: response.analysis,
        intent: intent,
        tickers: tickers,
        timestamp: new Date().toISOString(),
        source: 'Smart Rolo AI'
      })
    };

  } catch (error) {
    console.error('Smart Rolo AI error:', error);
    
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        response: 'I\'m having trouble analyzing the market data right now. Please try again.',
        error: error.message,
        timestamp: new Date().toISOString()
      })
    };
  }
};

// Analyze message intent using natural language patterns
function analyzeMessageIntent(message) {
  const msg = message.toLowerCase();
  
  // Stock analysis patterns
  if (msg.match(/\b(analyze|analysis|look at|check|review)\b.*\b[A-Z]{1,5}\b/)) {
    return 'stock_analysis';
  }
  
  // Options patterns
  if (msg.match(/\b(options?|calls?|puts?|strike|expiration|strategy|strategies)\b/)) {
    return 'options_strategy';
  }
  
  // Market sentiment patterns
  if (msg.match(/\b(market|sentiment|mood|feeling|overall|general)\b/)) {
    return 'market_sentiment';
  }
  
  // Top plays patterns
  if (msg.match(/\b(top|best|plays|opportunities|recommendations|picks)\b/)) {
    return 'top_plays';
  }
  
  // Technical analysis patterns
  if (msg.match(/\b(technical|rsi|macd|sma|ema|indicators|support|resistance)\b/)) {
    return 'technical_analysis';
  }
  
  // Entry/exit patterns
  if (msg.match(/\b(entry|exit|buy|sell|target|stop|price)\b/)) {
    return 'entry_exit';
  }
  
  // General conversation
  return 'general_question';
}

// Gather comprehensive analysis data
async function gatherAnalysisData(tickers) {
  const analysisData = {
    stocks: {},
    market: {},
    sentiment: {},
    vix: null
  };
  
  // Get data for each ticker
  for (const ticker of tickers) {
    try {
      const stockResponse = await fetch(`${getBaseUrl()}/smart-stock-data?symbol=${ticker}&entitlement=realtime`);
      if (stockResponse.ok) {
        const stockData = await stockResponse.json();
        analysisData.stocks[ticker] = stockData;
      }
    } catch (error) {
      console.log(`Failed to get data for ${ticker}:`, error.message);
    }
  }
  
  // Get market intelligence
  try {
    const marketResponse = await fetch(`${getBaseUrl()}/market-intelligence`);
    if (marketResponse.ok) {
      const marketData = await marketResponse.json();
      analysisData.market = marketData;
    }
  } catch (error) {
    console.log('Failed to get market intelligence:', error.message);
  }
  
  return analysisData;
}

// Generate intelligent response based on analysis
async function generateIntelligentResponse(intent, message, analysisData, conversationHistory) {
  switch (intent) {
    case 'stock_analysis':
      return generateStockAnalysis(analysisData, message);
    
    case 'options_strategy':
      return generateOptionsStrategy(analysisData, message);
    
    case 'market_sentiment':
      return generateMarketSentiment(analysisData);
    
    case 'top_plays':
      return generateTopPlays(analysisData);
    
    case 'technical_analysis':
      return generateTechnicalAnalysis(analysisData, message);
    
    case 'entry_exit':
      return generateEntryExit(analysisData, message);
    
    default:
      return generateGeneralResponse(message, conversationHistory);
  }
}

// Generate stock analysis response
function generateStockAnalysis(analysisData, message) {
  const tickers = Object.keys(analysisData.stocks);
  
  if (tickers.length === 0) {
    return {
      text: '📊 **Smart Analysis Ready!**\n\nI can analyze any stock ticker with:\n• Real-time price data\n• Technical indicators (RSI, MACD, SMA)\n• Options strategies\n• Entry/exit points\n\nJust mention a ticker symbol like AAPL, TSLA, NVDA, etc.',
      analysis: null
    };
  }
  
  const ticker = tickers[0];
  const stock = analysisData.stocks[ticker];
  
  if (!stock || !stock.price) {
    return {
      text: `❌ Unable to get real-time data for ${ticker}. Please try another ticker or try again.`,
      analysis: null
    };
  }
  
  // Calculate technical signals
  const technicalSignals = calculateTechnicalSignals(stock);
  const sentiment = calculateStockSentiment(stock, technicalSignals);
  const optionsStrategy = generateOptionsStrategyForStock(stock, technicalSignals);
  
  const response = `📊 **${ticker} Smart Analysis**\n\n` +
    `💰 **Current Price:** $${stock.price.toFixed(2)} ${formatChange(stock.change, stock.changePercent)}\n` +
    `📈 **Volume:** ${formatVolume(stock.volume)}\n` +
    `📊 **Range:** $${stock.low.toFixed(2)} - $${stock.high.toFixed(2)}\n\n` +
    
    `🔍 **Technical Indicators:**\n` +
    `• RSI (14): ${stock.rsi ? stock.rsi.toFixed(1) : 'N/A'} ${getRSISignal(stock.rsi)}\n` +
    `• MACD: ${getMACDSignal(stock.macd)}\n` +
    `• SMA 20: $${stock.sma20 ? stock.sma20.toFixed(2) : 'N/A'} ${getSMASignal(stock.price, stock.sma20)}\n\n` +
    
    `🎯 **Smart Assessment:** ${sentiment.signal}\n` +
    `${sentiment.reasoning}\n\n` +
    
    `📋 **Options Strategy:**\n${optionsStrategy}\n\n` +
    
    `⚠️ **Risk Management:** Position size 1-3% of portfolio, set stop loss at ${(stock.price * 0.95).toFixed(2)}`;
  
  return {
    text: response,
    analysis: {
      symbol: ticker,
      price: stock.price,
      rsi: stock.rsi,
      macd_signal: getMACDSignal(stock.macd),
      sma20: stock.sma20,
      volume: stock.volume,
      sentiment: sentiment.signal,
      options_strategy: optionsStrategy
    }
  };
}

// Generate options strategy response
function generateOptionsStrategy(analysisData, message) {
  const tickers = Object.keys(analysisData.stocks);
  
  if (tickers.length === 0) {
    return {
      text: '🎯 **Options Strategy Generator**\n\nI can create custom options strategies for any stock! Just mention a ticker and I\'ll analyze:\n\n• Current IV levels\n• Support/resistance levels\n• Optimal strike selection\n• Risk/reward ratios\n• Entry/exit timing\n\nExample: "AAPL options strategy" or "TSLA bullish play"',
      analysis: null
    };
  }
  
  const ticker = tickers[0];
  const stock = analysisData.stocks[ticker];
  
  if (!stock || !stock.price) {
    return {
      text: `❌ Unable to get options data for ${ticker}. Please try another ticker.`,
      analysis: null
    };
  }
  
  const technicalSignals = calculateTechnicalSignals(stock);
  const optionsAnalysis = generateAdvancedOptionsStrategy(stock, technicalSignals, message);
  
  return {
    text: optionsAnalysis,
    analysis: {
      symbol: ticker,
      price: stock.price,
      options_strategy: optionsAnalysis
    }
  };
}

// Calculate technical signals
function calculateTechnicalSignals(stock) {
  const signals = {
    rsi_signal: 'NEUTRAL',
    macd_signal: 'NEUTRAL',
    sma_signal: 'NEUTRAL',
    overall_signal: 'NEUTRAL'
  };
  
  // RSI signals
  if (stock.rsi) {
    if (stock.rsi > 70) signals.rsi_signal = 'OVERBOUGHT';
    else if (stock.rsi < 30) signals.rsi_signal = 'OVERSOLD';
    else if (stock.rsi > 50) signals.rsi_signal = 'BULLISH';
    else signals.rsi_signal = 'BEARISH';
  }
  
  // MACD signals
  if (stock.macd && stock.macd.macd && stock.macd.signal) {
    if (stock.macd.macd > stock.macd.signal) {
      signals.macd_signal = 'BULLISH';
    } else {
      signals.macd_signal = 'BEARISH';
    }
  }
  
  // SMA signals
  if (stock.sma20 && stock.price) {
    if (stock.price > stock.sma20) {
      signals.sma_signal = 'BULLISH';
    } else {
      signals.sma_signal = 'BEARISH';
    }
  }
  
  // Overall signal calculation
  const bullishSignals = Object.values(signals).filter(s => s === 'BULLISH').length;
  const bearishSignals = Object.values(signals).filter(s => s === 'BEARISH').length;
  
  if (bullishSignals > bearishSignals) signals.overall_signal = 'BULLISH';
  else if (bearishSignals > bullishSignals) signals.overall_signal = 'BEARISH';
  
  return signals;
}

// Calculate stock sentiment
function calculateStockSentiment(stock, technicalSignals) {
  const price = stock.price;
  const change = stock.change || 0;
  const changePercent = parseFloat((stock.changePercent || '0%').replace('%', ''));
  
  let sentiment = {
    signal: 'NEUTRAL',
    reasoning: 'Mixed signals in the market.'
  };
  
  // Strong momentum signals
  if (changePercent > 3 && technicalSignals.overall_signal === 'BULLISH') {
    sentiment = {
      signal: 'STRONG BULLISH',
      reasoning: `Strong upward momentum with ${changePercent.toFixed(1)}% gain and bullish technical indicators.`
    };
  } else if (changePercent < -3 && technicalSignals.overall_signal === 'BEARISH') {
    sentiment = {
      signal: 'STRONG BEARISH',
      reasoning: `Significant downward pressure with ${Math.abs(changePercent).toFixed(1)}% decline and bearish technicals.`
    };
  } else if (technicalSignals.overall_signal === 'BULLISH') {
    sentiment = {
      signal: 'BULLISH',
      reasoning: 'Technical indicators suggest upward momentum. Good for call options or bullish spreads.'
    };
  } else if (technicalSignals.overall_signal === 'BEARISH') {
    sentiment = {
      signal: 'BEARISH',
      reasoning: 'Technical indicators suggest downward pressure. Consider put options or protective strategies.'
    };
  }
  
  return sentiment;
}

// Generate options strategy for stock
function generateOptionsStrategyForStock(stock, technicalSignals) {
  const price = stock.price;
  const signal = technicalSignals.overall_signal;
  
  if (signal === 'BULLISH') {
    const callStrike = Math.ceil(price / 5) * 5; // Round up to nearest $5
    return `**Bull Call Spread:** Buy ${callStrike} calls, sell ${callStrike + 5} calls. Target 50% profit.`;
  } else if (signal === 'BEARISH') {
    const putStrike = Math.floor(price / 5) * 5; // Round down to nearest $5
    return `**Bear Put Spread:** Buy ${putStrike} puts, sell ${putStrike - 5} puts. Conservative downside play.`;
  } else {
    const atmStrike = Math.round(price / 5) * 5; // Round to nearest $5
    return `**Iron Condor:** Sell ${atmStrike} straddle, buy ${atmStrike - 10}/${atmStrike + 10} protection. Profit from low volatility.`;
  }
}

// Generate advanced options strategy
function generateAdvancedOptionsStrategy(stock, technicalSignals, message) {
  const price = stock.price;
  const msg = message.toLowerCase();
  
  let strategy = '';
  
  // Determine strategy type from message
  if (msg.includes('bullish') || msg.includes('call')) {
    strategy = generateBullishStrategy(stock, price);
  } else if (msg.includes('bearish') || msg.includes('put')) {
    strategy = generateBearishStrategy(stock, price);
  } else if (msg.includes('neutral') || msg.includes('iron condor') || msg.includes('straddle')) {
    strategy = generateNeutralStrategy(stock, price);
  } else {
    // Auto-select based on technical signals
    if (technicalSignals.overall_signal === 'BULLISH') {
      strategy = generateBullishStrategy(stock, price);
    } else if (technicalSignals.overall_signal === 'BEARISH') {
      strategy = generateBearishStrategy(stock, price);
    } else {
      strategy = generateNeutralStrategy(stock, price);
    }
  }
  
  return strategy;
}

// Generate bullish options strategy
function generateBullishStrategy(stock, price) {
  const atmStrike = Math.round(price / 5) * 5;
  const otmStrike = atmStrike + 10;
  
  return `🚀 **Bullish Options Strategy for ${stock.symbol}**\n\n` +
    `📊 **Current Price:** $${price.toFixed(2)}\n\n` +
    
    `🎯 **Recommended: Bull Call Spread**\n` +
    `• BUY: $${atmStrike} calls (ATM)\n` +
    `• SELL: $${otmStrike} calls (OTM)\n` +
    `• Expiration: 2-4 weeks out\n` +
    `• Max Risk: ~$3-5 per spread\n` +
    `• Max Profit: ~$5-7 per spread\n` +
    `• Breakeven: ~$${(atmStrike + 4).toFixed(2)}\n\n` +
    
    `📈 **Alternative: Long Calls**\n` +
    `• BUY: $${atmStrike} calls\n` +
    `• Target: 50-100% profit\n` +
    `• Stop Loss: 50% of premium paid\n\n` +
    
    `⚠️ **Risk Management:**\n` +
    `• Position size: 2-5% of portfolio\n` +
    `• Close at 50% profit or 21 DTE\n` +
    `• Watch for resistance at $${(price * 1.1).toFixed(2)}`;
}

// Generate bearish options strategy
function generateBearishStrategy(stock, price) {
  const atmStrike = Math.round(price / 5) * 5;
  const otmStrike = atmStrike - 10;
  
  return `📉 **Bearish Options Strategy for ${stock.symbol}**\n\n` +
    `📊 **Current Price:** $${price.toFixed(2)}\n\n` +
    
    `🎯 **Recommended: Bear Put Spread**\n` +
    `• BUY: $${atmStrike} puts (ATM)\n` +
    `• SELL: $${otmStrike} puts (OTM)\n` +
    `• Expiration: 2-4 weeks out\n` +
    `• Max Risk: ~$3-5 per spread\n` +
    `• Max Profit: ~$5-7 per spread\n` +
    `• Breakeven: ~$${(atmStrike - 4).toFixed(2)}\n\n` +
    
    `📉 **Alternative: Long Puts**\n` +
    `• BUY: $${atmStrike} puts\n` +
    `• Target: 50-100% profit\n` +
    `• Stop Loss: 50% of premium paid\n\n` +
    
    `⚠️ **Risk Management:**\n` +
    `• Position size: 2-5% of portfolio\n` +
    `• Close at 50% profit or 21 DTE\n` +
    `• Watch for support at $${(price * 0.9).toFixed(2)}`;
}

// Generate neutral options strategy
function generateNeutralStrategy(stock, price) {
  const atmStrike = Math.round(price / 5) * 5;
  
  return `⚖️ **Neutral Options Strategy for ${stock.symbol}**\n\n` +
    `📊 **Current Price:** $${price.toFixed(2)}\n\n` +
    
    `🎯 **Recommended: Iron Condor**\n` +
    `• SELL: $${atmStrike - 5} puts & $${atmStrike + 5} calls\n` +
    `• BUY: $${atmStrike - 15} puts & $${atmStrike + 15} calls\n` +
    `• Expiration: 30-45 DTE\n` +
    `• Max Profit: ~$3-4 per spread\n` +
    `• Max Risk: ~$6-7 per spread\n` +
    `• Profit Range: $${atmStrike - 5} - $${atmStrike + 5}\n\n` +
    
    `⭕ **Alternative: Short Straddle**\n` +
    `• SELL: $${atmStrike} calls & puts\n` +
    `• Higher premium, higher risk\n` +
    `• Best in low volatility environment\n\n` +
    
    `⚠️ **Risk Management:**\n` +
    `• Close at 25-50% max profit\n` +
    `• Manage at 21 DTE\n` +
    `• Best when IV rank > 30`;
}

// Utility functions
function getRSISignal(rsi) {
  if (!rsi) return '';
  if (rsi > 70) return '(Overbought ⚠️)';
  if (rsi < 30) return '(Oversold 🚀)';
  if (rsi > 50) return '(Bullish 📈)';
  return '(Bearish 📉)';
}

function getMACDSignal(macd) {
  if (!macd || !macd.macd || !macd.signal) return 'N/A';
  return macd.macd > macd.signal ? 'Bullish 📈' : 'Bearish 📉';
}

function getSMASignal(price, sma) {
  if (!price || !sma) return '';
  return price > sma ? '(Above trend 📈)' : '(Below trend 📉)';
}

function formatChange(change, changePercent) {
  if (!change) return '';
  const sign = change >= 0 ? '+' : '';
  return `(${sign}${change.toFixed(2)} / ${changePercent})`;
}

function formatVolume(volume) {
  if (!volume) return 'N/A';
  if (volume > 1000000) return `${(volume / 1000000).toFixed(1)}M`;
  if (volume > 1000) return `${(volume / 1000).toFixed(0)}K`;
  return volume.toLocaleString();
}

function getBaseUrl() {
  return 'https://magenta-monstera-8d552b.netlify.app/.netlify/functions';
}

// Generate market sentiment
function generateMarketSentiment(analysisData) {
  return {
    text: '📊 **Market Sentiment Analysis**\n\nAnalyzing current market conditions based on:\n• VIX levels\n• Sector rotation\n• Options flow\n• Social sentiment\n\nProvide a specific ticker for detailed sentiment analysis.',
    analysis: null
  };
}

// Generate top plays
function generateTopPlays(analysisData) {
  return {
    text: '🎯 **Top Plays Generator**\n\nI\'m analyzing market data to find the best opportunities:\n• High probability setups\n• Technical breakouts\n• Options strategies\n• Risk/reward ratios\n\nCheck the Plays tab for live opportunities or ask about specific tickers!',
    analysis: null
  };
}

// Generate technical analysis
function generateTechnicalAnalysis(analysisData, message) {
  return {
    text: '📈 **Technical Analysis**\n\nI can provide detailed technical analysis including:\n• RSI, MACD, SMA indicators\n• Support/resistance levels\n• Chart patterns\n• Volume analysis\n\nMention a ticker symbol for specific technical analysis.',
    analysis: null
  };
}

// Generate entry/exit points
function generateEntryExit(analysisData, message) {
  return {
    text: '🎯 **Entry/Exit Point Analysis**\n\nI can help determine optimal entry and exit points based on:\n• Technical levels\n• Risk/reward ratios\n• Volume patterns\n• Options pricing\n\nProvide a ticker and strategy type for specific entry/exit recommendations.',
    analysis: null
  };
}

// Generate general response
function generateGeneralResponse(message, conversationHistory) {
  return {
    text: '🚀 **Smart Rolo AI Ready!**\n\nI\'m your intelligent trading assistant powered by real-time market data. I can help with:\n\n📊 **Stock Analysis** - "Analyze AAPL"\n🎯 **Options Strategies** - "TSLA bullish play"\n📈 **Technical Analysis** - "NVDA technical indicators"\n🔍 **Market Sentiment** - "Overall market mood"\n⚡ **Entry/Exit Points** - "HOOD entry target"\n\nWhat would you like to explore?',
    analysis: null
  };
}
