// netlify/functions/claude-chat.js - SMART VERSION
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
    const { message } = JSON.parse(event.body || '{}');
    
    if (!message) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Message is required' })
      };
    }

    // Try to use real Claude API first
    const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
    
    if (ANTHROPIC_API_KEY) {
      try {
        const response = await fetch('https://api.anthropic.com/v1/messages', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': ANTHROPIC_API_KEY,
            'anthropic-version': '2023-06-01'
          },
          body: JSON.stringify({
            model: 'claude-3-sonnet-20240229',
            max_tokens: 1000,
            messages: [{
              role: 'user',
              content: `You are Rolo, a professional trading assistant. You're smart, conversational, and provide specific actionable trading advice. Respond to this trading question with detailed analysis: ${message}`
            }]
          })
        });

        if (response.ok) {
          const data = await response.json();
          return {
            statusCode: 200,
            headers,
            body: JSON.stringify({ 
              response: data.content[0].text,
              isLive: true,
              source: 'Claude API'
            })
          };
        }
      } catch (apiError) {
        console.error('Claude API error:', apiError);
        // Fall through to smart responses below
      }
    }

    // Smart trading responses based on query
    const query = message.toLowerCase();
    let response = '';

    // Get live stock data if asking about specific stock
    if (query.includes('aapl') || query.includes('apple')) {
      response = await getStockAnalysis('AAPL', message);
    } else if (query.includes('tsla') || query.includes('tesla')) {
      response = await getStockAnalysis('TSLA', message);
    } else if (query.includes('spy') || query.includes('s&p')) {
      response = await getStockAnalysis('SPY', message);
    } else if (query.includes('hood') || query.includes('robinhood')) {
      response = await getStockAnalysis('HOOD', message);
    } else if (query.includes('nvda') || query.includes('nvidia')) {
      response = await getStockAnalysis('NVDA', message);
    } else if (query.includes('play') || query.includes('tomorrow') || query.includes('best')) {
      response = getTradingPlays(message);
    } else if (query.includes('option') || query.includes('call') || query.includes('put')) {
      response = getOptionsStrategy(message);
    } else if (query.includes('market') || query.includes('vix')) {
      response = getMarketAnalysis(message);
    } else {
      response = getGeneralTradingAdvice(message);
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ 
        response: response,
        isLive: false,
        source: 'Smart Rolo AI'
      })
    };

  } catch (error) {
    console.error('Chat function error:', error);
    
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        error: 'Sorry, I encountered an error. Please try again.',
        details: error.message
      })
    };
  }
};

// Get stock analysis with real data
async function getStockAnalysis(symbol, message) {
  try {
    // Get real stock data from your Alpha Vantage API
    const response = await fetch(`https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${symbol}&apikey=${process.env.ALPHA_VANTAGE_API_KEY}`);
    
    if (response.ok) {
      const data = await response.json();
      const quote = data['Global Quote'];
      
      if (quote) {
        const price = parseFloat(quote['05. price']);
        const change = parseFloat(quote['09. change']);
        const changePercent = quote['10. change percent'];
        const volume = quote['06. volume'];
        
        let analysis = `📊 **${symbol} Real-Time Analysis**\n\n`;
        analysis += `💰 **Current Price**: $${price.toFixed(2)}\n`;
        analysis += `📈 **Change**: ${change >= 0 ? '+' : ''}$${change.toFixed(2)} (${changePercent})\n`;
        analysis += `📦 **Volume**: ${(parseInt(volume) / 1000000).toFixed(1)}M shares\n\n`;
        
        // Smart analysis based on price movement
        if (Math.abs(change) > 2) {
          analysis += `🔥 **Strong Movement**: ${Math.abs(change).toFixed(2)}% ${change > 0 ? 'gain' : 'loss'} today suggests significant momentum. `;
          analysis += change > 0 ? 'Watch for continuation or profit-taking resistance. ' : 'Look for support levels or further breakdown. ';
        } else {
          analysis += `📊 **Steady Trading**: ${Math.abs(change).toFixed(2)}% ${change > 0 ? 'gain' : 'loss'} shows normal volatility. `;
        }
        
        // Volume analysis
        const volumeM = parseInt(volume) / 1000000;
        if (volumeM > 50) {
          analysis += `High volume (${volumeM.toFixed(1)}M) confirms price action. `;
        } else if (volumeM < 10) {
          analysis += `Low volume (${volumeM.toFixed(1)}M) - price moves may not be sustainable. `;
        }
        
        // Trading suggestions
        analysis += `\n\n🎯 **Trading Suggestions**:\n`;
        if (change > 0) {
          analysis += `• **Bullish**: Consider call options or long positions on pullbacks\n`;
          analysis += `• **Resistance**: Watch $${(price * 1.02).toFixed(2)} level\n`;
          analysis += `• **Support**: Key level at $${(price * 0.98).toFixed(2)}\n`;
        } else {
          analysis += `• **Bearish**: Consider put options or short positions on rallies\n`;
          analysis += `• **Resistance**: Watch $${(price * 1.02).toFixed(2)} level\n`;
          analysis += `• **Support**: Key level at $${(price * 0.98).toFixed(2)}\n`;
        }
        
        analysis += `\n💡 **What's your trading timeframe? I can provide more specific entry/exit strategies!**`;
        
        return analysis;
      }
    }
  } catch (error) {
    console.error('Stock analysis error:', error);
  }
  
  // Fallback to general analysis
  return getGeneralStockAnalysis(symbol, message);
}

// General stock analysis (fallback)
function getGeneralStockAnalysis(symbol, message) {
  const stockInfo = {
    'AAPL': {
      name: 'Apple',
      sector: 'Technology',
      key_drivers: ['iPhone sales', 'Services revenue', 'China market', 'Innovation cycles'],
      risk_level: 'Medium',
      options_activity: 'High'
    },
    'TSLA': {
      name: 'Tesla',
      sector: 'Electric Vehicles',
      key_drivers: ['EV delivery numbers', 'Autonomous driving', 'Energy storage', 'Regulatory changes'],
      risk_level: 'High',
      options_activity: 'Very High'
    },
    'SPY': {
      name: 'S&P 500 ETF',
      sector: 'Market Index',
      key_drivers: ['Fed policy', 'Economic data', 'Earnings season', 'Market sentiment'],
      risk_level: 'Low',
      options_activity: 'Very High'
    },
    'HOOD': {
      name: 'Robinhood',
      sector: 'Fintech',
      key_drivers: ['Monthly active users', 'Crypto trading', 'Interest rates', 'Regulatory changes'],
      risk_level: 'High',
      options_activity: 'High'
    },
    'NVDA': {
      name: 'NVIDIA',
      sector: 'AI/Semiconductors',
      key_drivers: ['AI demand', 'Data center growth', 'Gaming market', 'Crypto mining'],
      risk_level: 'High',
      options_activity: 'Very High'
    }
  };
  
  const info = stockInfo[symbol] || { name: symbol, sector: 'Unknown', key_drivers: ['Market conditions'], risk_level: 'Medium', options_activity: 'Medium' };
  
  let analysis = `📊 **${info.name} (${symbol}) Analysis**\n\n`;
  analysis += `🏢 **Sector**: ${info.sector}\n`;
  analysis += `⚠️ **Risk Level**: ${info.risk_level}\n`;
  analysis += `📈 **Options Activity**: ${info.options_activity}\n\n`;
  
  analysis += `🔍 **Key Drivers to Watch**:\n`;
  info.key_drivers.forEach(driver => {
    analysis += `• ${driver}\n`;
  });
  
  analysis += `\n💡 **What specific aspect are you most interested in? Price targets, options strategies, or risk management?**`;
  
  return analysis;
}

// Trading plays
function getTradingPlays(message) {
  const plays = [
    {
      title: "🔥 Momentum Play",
      description: "Look for stocks with >3% moves on high volume",
      strategy: "Buy call options on strong breakouts above resistance",
      risk: "Medium",
      timeframe: "1-3 days"
    },
    {
      title: "📊 VIX Strategy",
      description: "Market volatility currently suggests premium selling opportunities",
      strategy: "Sell put spreads on quality stocks during high VIX periods",
      risk: "Medium",
      timeframe: "1-2 weeks"
    },
    {
      title: "🎯 Earnings Play",
      description: "Identify stocks with upcoming earnings and low implied volatility",
      strategy: "Buy straddles 1-2 weeks before earnings announcement",
      risk: "High",
      timeframe: "1-2 weeks"
    },
    {
      title: "🔒 Income Play",
      description: "Generate consistent income with covered calls",
      strategy: "Sell covered calls on dividend stocks you own",
      risk: "Low",
      timeframe: "1 month"
    }
  ];
  
  let response = `🎯 **Smart Trading Plays for Current Market**\n\n`;
  
  plays.forEach((play, index) => {
    response += `**${index + 1}. ${play.title}**\n`;
    response += `${play.description}\n`;
    response += `Strategy: ${play.strategy}\n`;
    response += `Risk: ${play.risk} | Timeframe: ${play.timeframe}\n\n`;
  });
  
  response += `💡 **Which play interests you most? I can provide specific entry/exit strategies and position sizing!**`;
  
  return response;
}

// Options strategy
function getOptionsStrategy(message) {
  let response = `📈 **Options Strategy Guide**\n\n`;
  
  if (message.includes('call')) {
    response += `🚀 **Call Options Strategy**:\n`;
    response += `• **Bullish outlook**: Buy calls when you expect upward price movement\n`;
    response += `• **Strike selection**: Buy slightly out-of-the-money (OTM) for leverage\n`;
    response += `• **Timing**: 30-45 days to expiration for optimal theta decay balance\n`;
    response += `• **Risk management**: Never risk more than 2-3% of portfolio per trade\n\n`;
    response += `💡 **Example**: If AAPL is at $200, buy $205 calls expiring in 30 days\n`;
  } else if (message.includes('put')) {
    response += `🔻 **Put Options Strategy**:\n`;
    response += `• **Bearish outlook**: Buy puts when you expect downward price movement\n`;
    response += `• **Strike selection**: Buy slightly out-of-the-money (OTM) for leverage\n`;
    response += `• **Timing**: 30-45 days to expiration for optimal theta decay balance\n`;
    response += `• **Risk management**: Set stop losses at 50% of premium paid\n\n`;
    response += `💡 **Example**: If AAPL is at $200, buy $195 puts expiring in 30 days\n`;
  } else {
    response += `🎯 **Complete Options Strategy**:\n\n`;
    response += `**Bullish Strategies**:\n`;
    response += `• **Buy Calls**: Simple directional play\n`;
    response += `• **Bull Call Spread**: Limited risk, limited reward\n`;
    response += `• **Cash-Secured Puts**: Generate income while waiting to buy\n\n`;
    response += `**Bearish Strategies**:\n`;
    response += `• **Buy Puts**: Simple directional play\n`;
    response += `• **Bear Put Spread**: Limited risk, limited reward\n`;
    response += `• **Covered Calls**: Generate income on existing positions\n\n`;
    response += `**Neutral Strategies**:\n`;
    response += `• **Iron Condor**: Profit from low volatility\n`;
    response += `• **Straddle**: Profit from high volatility\n`;
  }
  
  response += `\n💡 **What's your market outlook? I can suggest specific options strategies!**`;
  
  return response;
}

// Market analysis
function getMarketAnalysis(message) {
  let response = `🌍 **Market Analysis & Outlook**\n\n`;
  
  response += `📊 **Current Market Conditions**:\n`;
  response += `• **Trend**: Monitor major indices (SPY, QQQ, DIA) for direction\n`;
  response += `• **VIX**: Volatility index shows market fear/greed levels\n`;
  response += `• **Volume**: Confirm moves with above-average trading volume\n`;
  response += `• **Sector Rotation**: Watch which sectors are leading/lagging\n\n`;
  
  response += `🔍 **Key Factors to Watch**:\n`;
  response += `• **Fed Policy**: Interest rate decisions impact all markets\n`;
  response += `• **Economic Data**: GDP, inflation, employment reports\n`;
  response += `• **Earnings Season**: Quarterly results drive individual stocks\n`;
  response += `• **Geopolitical Events**: Can create volatility spikes\n\n`;
  
  response += `📈 **Trading Opportunities**:\n`;
  response += `• **High VIX (>25)**: Consider buying quality dips\n`;
  response += `• **Low VIX (<15)**: Look for premium selling opportunities\n`;
  response += `• **Trend Days**: Strong moves in one direction all day\n`;
  response += `• **Reversal Days**: Large moves that reverse intraday\n\n`;
  
  response += `💡 **Want specific analysis on SPY, QQQ, or individual sectors?**`;
  
  return response;
}

// General trading advice
function getGeneralTradingAdvice(message) {
  let response = `👋 **Hey! I'm Rolo, your trading assistant.**\n\n`;
  
  response += `🎯 **I can help you with**:\n`;
  response += `• **Stock Analysis**: Real-time data on any ticker (AAPL, TSLA, SPY, etc.)\n`;
  response += `• **Options Strategies**: Calls, puts, spreads, and complex trades\n`;
  response += `• **Market Analysis**: SPY, QQQ, VIX, sector rotation\n`;
  response += `• **Trading Plays**: Momentum, earnings, income strategies\n`;
  response += `• **Risk Management**: Position sizing, stop losses, portfolio protection\n\n`;
  
  response += `💡 **Try asking me**:\n`;
  response += `• "What's AAPL looking like today?"\n`;
  response += `• "Best call options for tomorrow?"\n`;
  response += `• "Should I buy or sell SPY?"\n`;
  response += `• "What are good trading plays this week?"\n\n`;
  
  response += `🎯 **What's on your mind? Ask me about any stock, strategy, or market question!**`;
  
  return response;
}
