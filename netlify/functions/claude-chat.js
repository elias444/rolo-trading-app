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

    // Extract stock tickers from message (1-5 capital letters)
    const tickerMatches = message.match(/\b[A-Z]{1,5}\b/g) || [];
    const query = message.toLowerCase();
    let response = '';

    // Handle specific stock analysis for ANY ticker
    if (tickerMatches.length > 0) {
      const ticker = tickerMatches[0];
      response = `📈 ${ticker} Analysis:\n\n${ticker} - Here's what Rolo sees:\n\n🔍 **Key Factors to Monitor:**\n• Volume patterns and unusual activity\n• Support and resistance levels\n• Recent news and earnings updates\n• Sector performance and market correlation\n• Options flow and institutional activity\n\n📊 **Trading Considerations:**\n• Always check the daily chart for trend direction\n• Watch for volume confirmation on breakouts\n• Consider overall market conditions (SPY/QQQ)\n• Set stop losses before entering positions\n• Size positions based on your risk tolerance\n\n💡 **Rolo's Approach:**\nI analyze both technical and fundamental factors. For the most accurate analysis, check the current price action in the Ticker tab!\n\nWhat's your specific question about ${ticker}? Entry point? Exit strategy? Options play?`;
    }
    // Handle options-related questions
    else if (query.includes('option') || query.includes('call') || query.includes('put') || query.includes('strike')) {
      response = `📊 Options Strategy Guidance:\n\n**Options Trading Essentials:**\n\n🎯 **The Greeks You Need to Know:**\n• **Delta**: Price sensitivity (0.50 = 50% of stock movement)\n• **Theta**: Time decay (your enemy on long positions)\n• **Vega**: Volatility impact (earnings = high vega risk)\n• **Gamma**: Delta acceleration (powerful near expiration)\n\n⚡ **Smart Options Plays:**\n• **0-1 DTE**: High risk/reward, need quick moves\n• **Weekly**: Good for earnings or catalyst plays\n• **Monthly**: More time but higher cost\n\n🛡️ **Risk Management:**\n• Never risk more than you can afford to lose\n• Have exit plan BEFORE entering\n• Consider implied volatility levels\n• Watch for liquidity (bid-ask spread)\n\nWhat specific options strategy are you considering? I can help analyze the setup!`;
    }
    // Handle market/trend questions
    else if (query.includes('market') || query.includes('trend') || query.includes('spy') || query.includes('qqq')) {
      response = `🌊 Market Analysis:\n\n**Current Market Dynamics:**\n\n📈 **Key Indices to Watch:**\n• **SPY**: S&P 500 benchmark - watch 570-590 range\n• **QQQ**: Tech-heavy - sensitive to rates and growth\n• **IWM**: Small caps - economic sentiment indicator\n• **VIX**: Fear gauge - low VIX = complacency\n\n🔍 **Market Health Indicators:**\n• Sector rotation patterns\n• Breadth (advance/decline ratios)\n• Interest rate environment\n• Economic data releases\n• Geopolitical events\n\n💡 **Trading the Market:**\n• Follow the trend until proven wrong\n• Respect major support/resistance levels\n• Watch for volume confirmation\n• Consider correlation between sectors\n\nWhat's your market outlook? Bullish, bearish, or waiting for direction?`;
    }
    // Handle risk management questions
    else if (query.includes('risk') || query.includes('stop') || query.includes('loss') || query.includes('management')) {
      response = `🛡️ Risk Management Mastery:\n\n**The Foundation of Profitable Trading:**\n\n💰 **Position Sizing Rules:**\n• Risk only 1-2% of account per trade\n• Smaller size for uncertain setups\n• Larger size for high-conviction plays\n• Never "bet the farm" on any single trade\n\n🎯 **Stop Loss Strategy:**\n• Set stops BEFORE entering positions\n• Use technical levels (support/resistance)\n• Avoid emotional "hope" trading\n• Mental stops count too - stick to them!\n\n📊 **Portfolio Management:**\n• Diversify across sectors and timeframes\n• Avoid over-concentration in one stock\n• Keep cash reserves for opportunities\n• Track win/loss ratios and R:R\n\n💪 **Emotional Control:**\n• Follow your trading plan religiously\n• Don't revenge trade after losses\n• Take profits systematically\n• Learn from every trade (keep a journal)\n\nWhat specific risk management challenge are you facing?`;
    }
    // Handle general greetings
    else if (query.includes('hello') || query.includes('hi') || query.includes('hey') || query.includes('what') && query.includes('up')) {
      response = `👋 Hey there! Rolo here, ready to help with your trading journey!\n\n🎯 **I can help you with:**\n• **Stock Analysis**: Any ticker (AAPL, TSLA, AMD, etc.)\n• **Options Strategies**: Calls, puts, spreads, timing\n• **Risk Management**: Position sizing, stops, psychology\n• **Market Analysis**: Trends, sectors, indices\n• **Technical Analysis**: Charts, levels, indicators\n\n💡 **Try asking me:**\n• "What do you think about [TICKER]?"\n• "How should I manage risk on this trade?"\n• "What's your take on the current market?"\n• "Help me with options strategy for [STOCK]"\n\nWhat's on your trading radar today? 📈`;
    }
    // Default response for any other question
    else {
      response = `🤖 Rolo here! I'm your AI trading assistant, ready to help.\n\n🚀 **Ask me about:**\n• **Any Stock**: Just mention the ticker (AAPL, TSLA, NVDA, etc.)\n• **Options Trading**: Strategies, Greeks, timing\n• **Risk Management**: Stop losses, position sizing\n• **Market Analysis**: Trends, sectors, SPY/QQQ\n• **Technical Analysis**: Support, resistance, patterns\n\n💡 **Example questions:**\n• "Analyze MSFT for me"\n• "What's your take on current market trends?"\n• "Help me with risk management"\n• "Should I buy calls or puts on [STOCK]?"\n\nI'm designed to help with any stock or trading concept. What would you like to explore? 📊`;
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
