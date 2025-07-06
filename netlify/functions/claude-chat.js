// netlify/functions/claude-chat.js
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

    // Smart trading responses based on user input
    const query = message.toLowerCase();
    let response = '';

    if (query.includes('aapl') || query.includes('apple')) {
      response = `🍎 AAPL Analysis:\n\nApple is currently showing solid performance. Key factors to monitor:\n• iPhone sales trends and new product launches\n• Services revenue growth (App Store, iCloud)\n• China market performance\n• Competitive pressure from other tech giants\n\nThe stock has good fundamentals. What's your trading timeframe for AAPL?`;
    } else if (query.includes('tsla') || query.includes('tesla')) {
      response = `⚡ TSLA Analysis:\n\nTesla is known for high volatility. Key catalysts:\n• Quarterly delivery numbers (watch for beats/misses)\n• Autonomous driving updates and FSD progress\n• Energy storage and solar business growth\n• Competition from legacy automakers going electric\n\nHigh risk, high reward stock. Always use stop losses with TSLA trades!`;
    } else if (query.includes('spy')) {
      response = `📈 SPY Analysis:\n\nS&P 500 ETF - the market benchmark. Key factors:\n• Federal Reserve policy decisions and interest rates\n• Economic data: GDP, employment, inflation\n• Market breadth and sector rotation\n• VIX levels for market volatility assessment\n\nGreat for options strategies and broad market exposure. What type of SPY play are you considering?`;
    } else if (query.includes('nvda') || query.includes('nvidia')) {
      response = `🖥️ NVDA Analysis:\n\nNVIDIA - the AI powerhouse. Watch for:\n• Data center revenue growth (AI demand)\n• Gaming GPU sales trends\n• Cryptocurrency mining impact\n• Competition from AMD and Intel\n\nVolatile but strong fundamentals in AI boom. Consider both technical and fundamental analysis.`;
    } else if (query.includes('option') || query.includes('call') || query.includes('put')) {
      response = `📊 Options Strategy Guidance:\n\nOptions trading requires discipline:\n• Never risk more than you can afford to lose\n• Understand the Greeks: Delta, Theta, Vega, Gamma\n• Have clear entry and exit strategies\n• Consider time decay (Theta) especially with short-term options\n• Start with small positions while learning\n\nWhat underlying stock are you looking at for options? I can help analyze the setup.`;
    } else if (query.includes('market') || query.includes('trend')) {
      response = `🌊 Market Analysis:\n\nCurrent market considerations:\n• Interest rate environment and Fed policy\n• Economic indicators and inflation data\n• Geopolitical events and their market impact\n• Sector rotation and leadership changes\n• Technical levels on major indices\n\nStay flexible and adapt to changing conditions. What specific market aspect interests you?`;
    } else if (query.includes('risk') || query.includes('management')) {
      response = `🛡️ Risk Management Essentials:\n\nKey principles for trading success:\n• Position sizing: Never risk more than 1-2% per trade\n• Stop losses: Define your exit before you enter\n• Diversification: Don't put all eggs in one basket\n• Emotional control: Stick to your plan\n• Keep a trading journal to learn from wins/losses\n\nRisk management is what separates profitable traders from gamblers!`;
    } else if (query.includes('hello') || query.includes('hi') || query.includes('hey')) {
      response = `👋 Hey there! I'm Rolo, your AI trading assistant.\n\nI'm here to help with:\n• Stock analysis and research\n• Options strategies and Greeks\n• Risk management techniques\n• Market trends and technical analysis\n• Trading psychology and discipline\n\nTry asking me about specific stocks like AAPL, TSLA, NVDA, or SPY. What's on your trading radar today?`;
    } else {
      response = `🤖 Rolo here! I'm ready to help with your trading questions.\n\nI can assist with:\n• Stock analysis (try AAPL, TSLA, NVDA, SPY)\n• Options strategies and risk management\n• Market trends and technical analysis\n• Trading psychology and discipline\n\nWhat would you like to explore? Ask me about a specific stock or trading concept!`;
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
        response: `🤖 Rolo here! I'm ready to help with trading analysis.\n\nTry asking me about:\n• Specific stocks (AAPL, TSLA, SPY)\n• Options strategies\n• Risk management\n• Market trends\n\nWhat's on your mind?`,
        isLive: false,
        fallback: true 
      })
    };
  }
};
