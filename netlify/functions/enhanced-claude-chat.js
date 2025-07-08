// netlify/functions/enhanced-claude-chat.js
// SMART AI WITHOUT ANTHROPIC - ZERO MOCK DATA

exports.handler = async (event, context) => {
  // Handle CORS
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

    // Extract ticker from message
    const ticker = extractTicker(message);
    
    let response;
    
    if (ticker) {
      // Get live stock data
      const stockData = await getStockData(ticker);
      
      if (stockData && stockData.price) {
        // Generate intelligent analysis with real data
        response = generateIntelligentAnalysis(ticker, stockData, message);
      } else {
        response = `I couldn't find current data for ${ticker.toUpperCase()}. Please verify the ticker symbol and try again.`;
      }
    } else {
      // Handle general trading questions
      response = handleGeneralQuestions(message);
    }
    
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ response })
    };
    
  } catch (error) {
    console.error('Enhanced Claude error:', error);
    
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        error: 'Service temporarily unavailable',
        response: 'I\'m having trouble processing your request right now. Please try again in a moment.'
      })
    };
  }
};

// Extract ticker symbol from message
function extractTicker(message) {
  const words = message.toUpperCase().split(/\s+/);
  
  // Known major tickers
  const knownTickers = [
    'AAPL', 'MSFT', 'GOOGL', 'GOOG', 'AMZN', 'TSLA', 'META', 'NVDA', 'NFLX', 
    'HOOD', 'SPY', 'QQQ', 'IWM', 'DIA', 'AMD', 'INTC', 'DIS', 'JPM', 'BAC', 
    'WMT', 'V', 'MA', 'JNJ', 'PG', 'UNH', 'HD', 'PYPL', 'ADBE', 'CRM',
    'BABA', 'TSM', 'ASML', 'LLY', 'ABBV', 'PFE', 'KO', 'PEP', 'COST', 'AVGO',
    'TXN', 'QCOM', 'ORCL', 'ACN', 'NKE', 'TMO', 'DHR', 'NEE', 'ABT', 'VZ',
    'CMCSA', 'CSCO', 'IBM', 'AMAT', 'SBUX', 'CAT', 'GS', 'MS', 'C', 'WFC'
  ];
  
  for (const word of words) {
    // Check if it's a known ticker
    if (knownTickers.includes(word)) {
      return word;
    }
    
    // Check if it looks like a ticker (1-5 letters, all caps)
    if (/^[A-Z]{1,5}$/.test(word)) {
      return word;
    }
  }
  
  return null;
}

// Get stock data from Alpha Vantage
async function getStockData(symbol) {
  try {
    const API_KEY = process.env.ALPHA_VANTAGE_API_KEY || 'MAQEUTLGYYXC1HF1';
    const url = `https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${symbol}&apikey=${API_KEY}`;
    
    const response = await fetch(url);
    const data = await response.json();
    
    const quote = data['Global Quote'];
    
    if (!quote) {
      return null;
    }
    
    return {
      symbol: quote['01. symbol'],
      price: parseFloat(quote['05. price']),
      change: parseFloat(quote['09. change']),
      changePercent: parseFloat(quote['10. change percent'].replace('%', '')),
      volume: parseInt(quote['06. volume']),
      high: parseFloat(quote['03. high']),
      low: parseFloat(quote['04. low']),
      open: parseFloat(quote['02. open']),
      previousClose: parseFloat(quote['08. previous close'])
    };
    
  } catch (error) {
    console.error('Error fetching stock data:', error);
    return null;
  }
}

// Generate intelligent analysis with real data
function generateIntelligentAnalysis(ticker, data, originalMessage) {
  const { price, change, changePercent, volume, high, low, open, previousClose } = data;
  
  let analysis = `📊 **${ticker} Smart Analysis**\n\n`;
  
  // Current price and movement
  analysis += `💰 **Current Price**: $${price.toFixed(2)}\n`;
  analysis += `📈 **Today's Change**: ${change >= 0 ? '+' : ''}$${change.toFixed(2)} (${changePercent >= 0 ? '+' : ''}${changePercent.toFixed(2)}%)\n`;
  analysis += `📊 **Range**: $${low.toFixed(2)} - $${high.toFixed(2)}\n`;
  analysis += `📦 **Volume**: ${volume.toLocaleString()}\n\n`;
  
  // Price action analysis
  const pricePosition = ((price - low) / (high - low)) * 100;
  
  if (pricePosition > 80) {
    analysis += `🚀 **Near Daily High**: Trading at ${pricePosition.toFixed(0)}% of daily range - strong momentum!\n`;
  } else if (pricePosition < 20) {
    analysis += `📉 **Near Daily Low**: Trading at ${pricePosition.toFixed(0)}% of daily range - potential oversold.\n`;
  } else {
    analysis += `📊 **Mid-Range**: Trading at ${pricePosition.toFixed(0)}% of daily range - balanced action.\n`;
  }
  
  // Volatility assessment
  const dailyRange = ((high - low) / previousClose) * 100;
  
  if (dailyRange > 5) {
    analysis += `⚡ **High Volatility**: ${dailyRange.toFixed(1)}% daily range - options premium elevated.\n`;
  } else if (dailyRange > 2) {
    analysis += `📊 **Normal Volatility**: ${dailyRange.toFixed(1)}% daily range - standard trading.\n`;
  } else {
    analysis += `😴 **Low Volatility**: ${dailyRange.toFixed(1)}% daily range - compressed range.\n`;
  }
  
  // Volume analysis
  const volumeCategory = getVolumeCategory(ticker, volume);
  analysis += `📦 **Volume Analysis**: ${volumeCategory}\n\n`;
  
  // Options strategy recommendations
  if (originalMessage.toLowerCase().includes('option') || originalMessage.toLowerCase().includes('strategy')) {
    analysis += generateOptionsStrategies(ticker, data);
  } else {
    analysis += generateTradingInsights(ticker, data);
  }
  
  // Technical levels
  const support = calculateSupport(price, low, previousClose);
  const resistance = calculateResistance(price, high, previousClose);
  
  analysis += `\n📈 **Key Technical Levels**:\n`;
  analysis += `• **Support**: $${support.toFixed(2)}\n`;
  analysis += `• **Resistance**: $${resistance.toFixed(2)}\n`;
  analysis += `• **Risk Level**: ${assessRisk(changePercent, dailyRange)}\n\n`;
  
  // Risk management
  analysis += `⚠️ **Risk Management**: Position size appropriately and always use stops. This analysis is for educational purposes only.`;
  
  return analysis;
}

// Generate options strategies based on market conditions
function generateOptionsStrategies(ticker, data) {
  const { price, changePercent, high, low, previousClose } = data;
  const dailyRange = ((high - low) / previousClose) * 100;
  
  let strategies = `🎯 **Options Strategy Recommendations**:\n\n`;
  
  // High volatility strategies
  if (dailyRange > 4) {
    strategies += `**High Volatility Environment**:\n`;
    strategies += `• **Iron Condor**: Sell premium in wide range\n`;
    strategies += `• **Covered Calls**: Generate income from elevated premium\n`;
    strategies += `• **Cash-Secured Puts**: Enter at discount with high premium\n\n`;
  }
  
  // Directional strategies based on momentum
  if (Math.abs(changePercent) > 2) {
    if (changePercent > 0) {
      strategies += `**Bullish Momentum Detected**:\n`;
      strategies += `• **Call Spreads**: Limited risk, defined profit\n`;
      strategies += `• **Protective Puts**: Hedge existing positions\n`;
    } else {
      strategies += `**Bearish Pressure Observed**:\n`;
      strategies += `• **Put Spreads**: Profit from continued decline\n`;
      strategies += `• **Covered Calls**: Income on existing positions\n`;
    }
    strategies += `• **Straddle/Strangle**: Profit from continued volatility\n\n`;
  }
  
  // Low volatility strategies
  if (dailyRange < 2) {
    strategies += `**Low Volatility Environment**:\n`;
    strategies += `• **Long Straddle**: Buy cheap options before expansion\n`;
    strategies += `• **Calendar Spreads**: Benefit from time decay\n`;
    strategies += `• **Butterfly Spreads**: Profit from range-bound action\n\n`;
  }
  
  // Price-based recommendations
  if (price > 200) {
    strategies += `**High-Priced Stock Considerations**:\n`;
    strategies += `• Use spreads to reduce capital requirements\n`;
    strategies += `• Consider fractional strategies\n`;
  } else if (price < 50) {
    strategies += `**Lower-Priced Stock Advantages**:\n`;
    strategies += `• Single-leg strategies more accessible\n`;
    strategies += `• Higher leverage potential\n`;
  }
  
  return strategies;
}

// Generate general trading insights
function generateTradingInsights(ticker, data) {
  const { changePercent, high, low, previousClose } = data;
  const dailyRange = ((high - low) / previousClose) * 100;
  
  let insights = `💡 **Trading Insights**:\n\n`;
  
  // Momentum analysis
  if (changePercent > 3) {
    insights += `🚀 **Strong Bullish Signal**: Consider momentum continuation strategies\n`;
    insights += `📈 **Trend**: Look for pullbacks as entry opportunities\n`;
  } else if (changePercent < -3) {
    insights += `📉 **Bearish Pressure**: Watch for bounce or further decline\n`;
    insights += `🔄 **Reversal**: Monitor for oversold bounce signals\n`;
  } else {
    insights += `📊 **Consolidation**: Range-bound trading, look for breakouts\n`;
    insights += `⚖️ **Neutral**: Wait for clear directional signal\n`;
  }
  
  // Volatility insights
  if (dailyRange > 4) {
    insights += `⚡ **High Vol Day**: Great for options sellers, risky for buyers\n`;
  } else if (dailyRange < 1.5) {
    insights += `😴 **Quiet Trading**: Potential energy building for big move\n`;
  }
  
  insights += `\n🎯 **Next Steps**: Ask me about specific options strategies for ${ticker}!\n`;
  
  return insights;
}

// Helper functions for technical analysis
function getVolumeCategory(ticker, volume) {
  // Simplified volume categorization
  if (volume > 10000000) return "Very High - Institutional activity";
  if (volume > 5000000) return "High - Strong interest";
  if (volume > 1000000) return "Average - Normal trading";
  if (volume > 100000) return "Light - Lower interest";
  return "Very Light - Minimal activity";
}

function calculateSupport(price, low, previousClose) {
  // Simple support calculation using recent low and previous close
  return Math.min(low, previousClose * 0.98);
}

function calculateResistance(price, high, previousClose) {
  // Simple resistance calculation using recent high
  return Math.max(high, previousClose * 1.02);
}

function assessRisk(changePercent, dailyRange) {
  const volatility = Math.abs(changePercent) + dailyRange;
  
  if (volatility > 8) return "HIGH - Use smaller position sizes";
  if (volatility > 4) return "MODERATE - Standard risk management";
  return "LOW - Normal position sizing";
}

// Handle general trading questions
function handleGeneralQuestions(message) {
  const lowerMessage = message.toLowerCase();
  
  if (lowerMessage.includes('vix') || lowerMessage.includes('volatility')) {
    return `📊 **VIX & Volatility Guide**:\n\n• **VIX < 15**: Low vol - buy options, expect expansion\n• **VIX 15-25**: Normal range - standard strategies\n• **VIX > 25**: High vol - sell premium, expect contraction\n• **VIX > 35**: Extreme fear - contrarian opportunities\n\n💡 **Strategy**: When VIX spikes, look for oversold bounces. When VIX is low, prepare for volatility expansion.`;
  }
  
  if (lowerMessage.includes('support') || lowerMessage.includes('resistance')) {
    return `📈 **Support & Resistance Trading**:\n\n• **Support**: Price level where buying interest emerges\n• **Resistance**: Price level where selling pressure appears\n• **Breakout**: Price moves beyond key levels with volume\n• **False Break**: Quick reversal back into range\n\n🎯 **Trading Tips**: Buy near support, sell near resistance, trade breakouts with confirmation.`;
  }
  
  if (lowerMessage.includes('risk') || lowerMessage.includes('management')) {
    return `⚠️ **Risk Management Essentials**:\n\n• **Position Size**: Never risk more than 1-2% per trade\n• **Stop Losses**: Define exit before entry\n• **Diversification**: Don't put all eggs in one basket\n• **Risk/Reward**: Aim for 2:1 or better ratios\n• **Emotions**: Stick to your plan, avoid FOMO\n\n💡 **Remember**: Protecting capital is more important than making profits!`;
  }
  
  if (lowerMessage.includes('entry') || lowerMessage.includes('exit')) {
    return `🎯 **Entry & Exit Strategy**:\n\n**Entry Signals**:\n• Breakout above resistance with volume\n• Bounce off support level\n• RSI oversold/overbought reversal\n• Moving average crossover\n\n**Exit Signals**:\n• Hit profit target (2:1 risk/reward)\n• Stop loss triggered\n• Momentum fading\n• Time decay (for options)\n\n💡 **Pro Tip**: Plan your exit before you enter!`;
  }
  
  if (lowerMessage.includes('option') || lowerMessage.includes('strategy')) {
    return `🎯 **Options Strategy Selection**:\n\n**Market Direction**:\n• **Bullish**: Call spreads, covered calls\n• **Bearish**: Put spreads, protective puts\n• **Neutral**: Iron condors, butterflies\n\n**Volatility Environment**:\n• **High Vol**: Sell premium (iron condors, covered calls)\n• **Low Vol**: Buy premium (straddles, long options)\n\n**Time Frame**:\n• **Short-term**: Weekly options, day trading\n• **Long-term**: LEAPS, buy-and-hold\n\n💡 Tell me a specific ticker for personalized strategies!`;
  }
  
  return `🤖 **Rolo AI - Your Trading Assistant**\n\nI specialize in:\n• Real-time stock analysis\n• Options strategy recommendations\n• Technical level identification\n• Risk management guidance\n\n🎯 **Try asking**:\n• "Analyze AAPL for options"\n• "TSLA support and resistance"\n• "Best strategy for high volatility"\n• "HOOD risk assessment"\n\nJust mention any ticker symbol and I'll provide detailed analysis with live market data!`;
}
