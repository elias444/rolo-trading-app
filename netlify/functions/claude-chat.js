// netlify/functions/claude-chat.js - COMPLETE INTELLIGENT VERSION
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

    console.log('Processing message:', message);

    // Try to use real Claude API first if available
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
            max_tokens: 1200,
            messages: [{
              role: 'user',
              content: `You are Rolo, an expert trading assistant. You're intelligent, conversational, and provide specific actionable trading advice. You understand options, technical analysis, market psychology, and risk management. Respond to this trading question with detailed, practical analysis: ${message}`
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
      }
    }

    // Enhanced intelligent responses with real stock data
    const query = message.toLowerCase();
    let response = '';

    // Check for specific stock mentions with real data
    if (query.includes('aapl') || query.includes('apple')) {
      response = await getEnhancedStockAnalysis('AAPL', message);
    } else if (query.includes('tsla') || query.includes('tesla')) {
      response = await getEnhancedStockAnalysis('TSLA', message);
    } else if (query.includes('spy') || query.includes('s&p')) {
      response = await getEnhancedStockAnalysis('SPY', message);
    } else if (query.includes('hood') || query.includes('robinhood')) {
      response = await getEnhancedStockAnalysis('HOOD', message);
    } else if (query.includes('nvda') || query.includes('nvidia')) {
      response = await getEnhancedStockAnalysis('NVDA', message);
    } else if (query.includes('meta') || query.includes('facebook')) {
      response = await getEnhancedStockAnalysis('META', message);
    } else if (query.includes('googl') || query.includes('google')) {
      response = await getEnhancedStockAnalysis('GOOGL', message);
    } else if (query.includes('msft') || query.includes('microsoft')) {
      response = await getEnhancedStockAnalysis('MSFT', message);
    } else if (query.includes('qqq') || query.includes('nasdaq')) {
      response = await getEnhancedStockAnalysis('QQQ', message);
    } else if (query.includes('dia') || query.includes('dow')) {
      response = await getEnhancedStockAnalysis('DIA', message);
    } else if (query.includes('vix') || query.includes('volatility')) {
      response = await getEnhancedStockAnalysis('VIX', message);
    } else if (query.includes('play') || query.includes('tomorrow') || query.includes('best') || query.includes('strategy')) {
      response = await getSmartTradingPlays(message);
    } else if (query.includes('option') || query.includes('call') || query.includes('put') || query.includes('spread')) {
      response = await getOptionsStrategy(message);
    } else if (query.includes('market') || query.includes('trend') || query.includes('sentiment')) {
      response = await getMarketAnalysis(message);
    } else if (query.includes('risk') || query.includes('management') || query.includes('stop')) {
      response = getRiskManagementAdvice(message);
    } else if (query.includes('technical') || query.includes('chart') || query.includes('support') || query.includes('resistance')) {
      response = getTechnicalAnalysis(message);
    } else {
      response = getIntelligentResponse(message);
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ 
        response: response,
        isLive: false,
        source: 'Enhanced Rolo AI'
      })
    };

  } catch (error) {
    console.error('Chat function error:', error);
    
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        error: 'Sorry, I encountered an error processing your request. Please try again.',
        details: error.message
      })
    };
  }
};

// Enhanced stock analysis with real Alpha Vantage data
async function getEnhancedStockAnalysis(symbol, message) {
  try {
    const ALPHA_VANTAGE_API_KEY = process.env.ALPHA_VANTAGE_API_KEY;
    
    if (!ALPHA_VANTAGE_API_KEY) {
      return getStaticStockAnalysis(symbol, message);
    }

    // Get real-time data from Alpha Vantage
    const response = await fetch(`https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${symbol}&apikey=${ALPHA_VANTAGE_API_KEY}`);
    
    if (response.ok) {
      const data = await response.json();
      const quote = data['Global Quote'];
      
      if (quote && quote['05. price']) {
        const price = parseFloat(quote['05. price']);
        const change = parseFloat(quote['09. change']);
        const changePercent = quote['10. change percent'];
        const volume = parseInt(quote['06. volume']);
        const high = parseFloat(quote['03. high']);
        const low = parseFloat(quote['04. low']);
        const open = parseFloat(quote['02. open']);
        const prevClose = parseFloat(quote['08. previous close']);
        
        return generateIntelligentAnalysis(symbol, {
          price, change, changePercent, volume, high, low, open, prevClose
        }, message);
      }
    }
  } catch (error) {
    console.error('Real-time data error:', error);
  }
  
  return getStaticStockAnalysis(symbol, message);
}

// Generate intelligent analysis with real data
function generateIntelligentAnalysis(symbol, data, message) {
  const { price, change, changePercent, volume, high, low, open, prevClose } = data;
  const changePercNum = parseFloat(changePercent.replace('%', ''));
  const volumeM = volume / 1000000;
  
  let analysis = `📊 **${symbol} Live Analysis** (Real-time Alpha Vantage)\n\n`;
  
  // Price action analysis
  analysis += `💰 **Current Price**: $${price.toFixed(2)}\n`;
  analysis += `📈 **Today's Move**: ${change >= 0 ? '+' : ''}$${change.toFixed(2)} (${changePercent})\n`;
  analysis += `📊 **Range**: $${low.toFixed(2)} - $${high.toFixed(2)} | Open: $${open.toFixed(2)}\n`;
  analysis += `📦 **Volume**: ${volumeM.toFixed(1)}M shares\n\n`;
  
  // Intelligent momentum analysis
  if (Math.abs(changePercNum) > 3) {
    analysis += `🔥 **Strong Momentum**: ${Math.abs(changePercNum).toFixed(1)}% ${change > 0 ? 'rally' : 'selloff'} with ${volumeM.toFixed(1)}M volume suggests significant interest.\n\n`;
    
    if (change > 0) {
      analysis += `**Bullish Signals**:\n`;
      analysis += `• Strong buying pressure above $${prevClose.toFixed(2)}\n`;
      analysis += `• Watch for continuation above $${(price * 1.01).toFixed(2)}\n`;
      analysis += `• Potential resistance at $${(price * 1.03).toFixed(2)}\n\n`;
      
      analysis += `**Options Play**: Consider ${symbol} calls with strikes around $${(price * 1.02).toFixed(2)} expiring in 2-3 weeks\n`;
    } else {
      analysis += `**Bearish Signals**:\n`;
      analysis += `• Heavy selling pressure below $${prevClose.toFixed(2)}\n`;
      analysis += `• Watch for breakdown below $${(price * 0.99).toFixed(2)}\n`;
      analysis += `• Potential support at $${(price * 0.97).toFixed(2)}\n\n`;
      
      analysis += `**Options Play**: Consider ${symbol} puts with strikes around $${(price * 0.98).toFixed(2)} expiring in 2-3 weeks\n`;
    }
  } else if (Math.abs(changePercNum) > 1) {
    analysis += `📊 **Moderate Movement**: ${Math.abs(changePercNum).toFixed(1)}% ${change > 0 ? 'gain' : 'loss'} shows ${change > 0 ? 'bullish' : 'bearish'} sentiment.\n\n`;
    
    analysis += `**Key Levels**:\n`;
    analysis += `• Support: $${(price * 0.98).toFixed(2)}\n`;
    analysis += `• Resistance: $${(price * 1.02).toFixed(2)}\n`;
    analysis += `• Breakout level: $${(price * (change > 0 ? 1.03 : 0.97)).toFixed(2)}\n\n`;
  } else {
    analysis += `😴 **Consolidation**: ${Math.abs(changePercNum).toFixed(1)}% move suggests range-bound trading.\n\n`;
    
    analysis += `**Range Play Strategy**:\n`;
    analysis += `• Buy support: $${low.toFixed(2)} area\n`;
    analysis += `• Sell resistance: $${high.toFixed(2)} area\n`;
    analysis += `• Breakout watch: Above $${high.toFixed(2)} or below $${low.toFixed(2)}\n\n`;
  }
  
  // Volume analysis
  if (volumeM > 50) {
    analysis += `🚨 **High Volume Alert**: ${volumeM.toFixed(1)}M shares traded confirms this move. Institutional interest likely.\n`;
  } else if (volumeM < 5) {
    analysis += `⚠️ **Low Volume**: ${volumeM.toFixed(1)}M shares - price moves may lack conviction.\n`;
  }
  
  // Context-based advice
  if (message.includes('option') || message.includes('call') || message.includes('put')) {
    analysis += `\n🎯 **Options Strategy**:\n`;
    if (Math.abs(changePercNum) > 2) {
      analysis += `• High volatility suggests premium selling (iron condors, covered calls)\n`;
      analysis += `• If trend continues: ${change > 0 ? 'Bull call spreads' : 'Bear put spreads'}\n`;
    } else {
      analysis += `• Low volatility suggests premium buying (long calls/puts)\n`;
      analysis += `• Consider straddles if expecting volatility expansion\n`;
    }
  }
  
  if (message.includes('risk') || message.includes('stop')) {
    analysis += `\n🛡️ **Risk Management**:\n`;
    analysis += `• Stop loss: $${(price * (change > 0 ? 0.95 : 1.05)).toFixed(2)} (${Math.abs(change > 0 ? 5 : -5)}%)\n`;
    analysis += `• Position size: Max 2-3% of portfolio\n`;
    analysis += `• Time stop: Exit if no movement in 5-7 days\n`;
  }
  
  analysis += `\n💡 **What specific strategy are you considering? I can help with entry/exit points and position sizing!**`;
  
  return analysis;
}

// Smart trading plays with market analysis
async function getSmartTradingPlays(message) {
  let response = `🎯 **Smart Trading Plays - Market Analysis**\n\n`;
  
  // Try to get VIX data for market context
  try {
    const ALPHA_VANTAGE_API_KEY = process.env.ALPHA_VANTAGE_API_KEY;
    if (ALPHA_VANTAGE_API_KEY) {
      const vixResponse = await fetch(`https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=VIX&apikey=${ALPHA_VANTAGE_API_KEY}`);
      
      if (vixResponse.ok) {
        const vixData = await vixResponse.json();
        const vixQuote = vixData['Global Quote'];
        
        if (vixQuote && vixQuote['05. price']) {
          const vixPrice = parseFloat(vixQuote['05. price']);
          
          response += `📊 **Current VIX**: ${vixPrice.toFixed(1)} - `;
          
          if (vixPrice > 30) {
            response += `**High Fear** (Premium Selling Environment)\n\n`;
            response += `**🔥 High VIX Plays**:\n`;
            response += `• **Iron Condors**: Sell premium on SPY, QQQ (7-14 DTE)\n`;
            response += `• **Cash-Secured Puts**: Buy quality stocks at discount\n`;
            response += `• **Covered Calls**: Generate income on existing positions\n`;
            response += `• **Contrarian Longs**: Buy oversold quality names\n\n`;
          } else if (vixPrice < 15) {
            response += `**Low Fear** (Premium Buying Environment)\n\n`;
            response += `**🎯 Low VIX Plays**:\n`;
            response += `• **Long Straddles**: Buy volatility before events\n`;
            response += `• **Protective Puts**: Hedge existing positions\n`;
            response += `• **VIX Calls**: Direct volatility play\n`;
            response += `• **Momentum Breakouts**: Ride trends with tight stops\n\n`;
          } else {
            response += `**Neutral** (Balanced Environment)\n\n`;
            response += `**⚖️ Balanced Plays**:\n`;
            response += `• **Earnings Straddles**: Play upcoming announcements\n`;
            response += `• **Technical Breakouts**: Support/resistance plays\n`;
            response += `• **Sector Rotation**: Follow momentum shifts\n`;
            response += `• **Swing Trades**: 3-7 day holds on quality setups\n\n`;
          }
        }
      }
    }
  } catch (error) {
    console.error('VIX data error:', error);
  }
  
  // General market plays
  response += `**🚀 Universal Plays for Tomorrow**:\n\n`;
  
  response += `**1. Momentum Continuation**\n`;
  response += `• Scan for stocks >3% with volume >2x average\n`;
  response += `• Buy calls on breakouts above resistance\n`;
  response += `• Risk: 2% of portfolio per trade\n\n`;
  
  response += `**2. Mean Reversion**\n`;
  response += `• Find oversold quality names (RSI <30)\n`;
  response += `• Buy near support with tight stops\n`;
  response += `• Target: Previous highs or key resistance\n\n`;
  
  response += `**3. News-Based Plays**\n`;
  response += `• Monitor earnings announcements\n`;
  response += `• FDA approvals, product launches\n`;
  response += `• Fed policy and economic data\n\n`;
  
  response += `**4. Options Flow Following**\n`;
  response += `• Watch for unusual call/put activity\n`;
  response += `• Follow smart money into liquid names\n`;
  response += `• Risk: Match time frame to option expiry\n\n`;
  
  if (message.includes('risk') || message.includes('conservative')) {
    response += `**🛡️ Conservative Approach**:\n`;
    response += `• Position size: 1-2% max per trade\n`;
    response += `• Stop losses: 5-7% for stocks, 50% for options\n`;
    response += `• Diversify across sectors and time frames\n`;
    response += `• Take profits at 10-15% for swing trades\n\n`;
  }
  
  response += `💡 **Which type of play interests you most? I can provide specific tickers and entry strategies!**`;
  
  return response;
}

// Advanced options strategy
async function getOptionsStrategy(message) {
  let response = `📈 **Advanced Options Strategy Guide**\n\n`;
  
  if (message.includes('call') && !message.includes('put')) {
    response += `🚀 **Call Options Strategy**:\n\n`;
    response += `**When to Buy Calls**:\n`;
    response += `• Stock breaking above resistance with volume\n`;
    response += `• Bullish earnings expectations\n`;
    response += `• Overall market uptrend (SPY rising)\n`;
    response += `• Low VIX environment (cheap premium)\n\n`;
    
    response += `**Strike Selection**:\n`;
    response += `• **ATM**: Balanced risk/reward\n`;
    response += `• **OTM**: Higher leverage, higher risk\n`;
    response += `• **ITM**: Lower leverage, higher probability\n\n`;
    
    response += `**Timing & Expiry**:\n`;
    response += `• **30-45 DTE**: Optimal theta decay balance\n`;
    response += `• **Weekly**: High risk, high reward\n`;
    response += `• **LEAPS**: Long-term bullish thesis\n\n`;
    
    response += `**Exit Strategy**:\n`;
    response += `• Take profits at 50-100% gain\n`;
    response += `• Stop loss at 50% of premium paid\n`;
    response += `• Don't hold to expiration\n\n`;
    
  } else if (message.includes('put') && !message.includes('call')) {
    response += `🔻 **Put Options Strategy**:\n\n`;
    response += `**When to Buy Puts**:\n`;
    response += `• Stock breaking below support with volume\n`;
    response += `• Bearish earnings expectations\n`;
    response += `• Overall market downtrend (SPY falling)\n`;
    response += `• High VIX environment (directional move expected)\n\n`;
    
    response += `**Protective Puts**:\n`;
    response += `• Insurance for existing long positions\n`;
    response += `• Strike 5-10% below current price\n`;
    response += `• Cost: 1-2% of position value\n\n`;
    
    response += `**Speculative Puts**:\n`;
    response += `• Betting on downward price movement\n`;
    response += `• Use tight stops (50% of premium)\n`;
    response += `• Target quick profits (20-50%)\n\n`;
    
  } else if (message.includes('spread')) {
    response += `🎯 **Options Spreads Strategy**:\n\n`;
    response += `**Bull Call Spread**:\n`;
    response += `• Buy lower strike call, sell higher strike\n`;
    response += `• Limited risk, limited reward\n`;
    response += `• Best in mildly bullish markets\n\n`;
    
    response += `**Bear Put Spread**:\n`;
    response += `• Buy higher strike put, sell lower strike\n`;
    response += `• Profitable in mild downtrends\n`;
    response += `• Less capital required than long puts\n\n`;
    
    response += `**Iron Condor**:\n`;
    response += `• Sell both call and put spreads\n`;
    response += `• Profit from low volatility\n`;
    response += `• High VIX environment ideal\n\n`;
    
  } else {
    response += `**🎯 Complete Options Playbook**:\n\n`;
    response += `**Basic Strategies**:\n`;
    response += `• **Long Calls**: Bullish, limited risk\n`;
    response += `• **Long Puts**: Bearish, limited risk\n`;
    response += `• **Covered Calls**: Income on existing shares\n`;
    response += `• **Cash-Secured Puts**: Get paid to wait\n\n`;
    
    response += `**Advanced Strategies**:\n`;
    response += `• **Straddles**: Play volatility expansion\n`;
    response += `• **Strangles**: Cheaper volatility play\n`;
    response += `• **Iron Condors**: Premium selling in range\n`;
    response += `• **Butterflies**: Precision plays\n\n`;
    
    response += `**Greeks to Watch**:\n`;
    response += `• **Delta**: Price sensitivity (0.30-0.70 ideal)\n`;
    response += `• **Theta**: Time decay (enemy of long options)\n`;
    response += `• **Vega**: Volatility sensitivity\n`;
    response += `• **Gamma**: Acceleration factor\n\n`;
  }
  
  response += `**⚠️ Risk Management Rules**:\n`;
  response += `• Never risk more than 2-3% on single trade\n`;
  response += `• Set stop losses before entering\n`;
  response += `• Take profits at 50-100% gains\n`;
  response += `• Don't fight the trend\n`;
  response += `• Size positions inversely to risk\n\n`;
  
  response += `💡 **What specific options strategy are you considering? I can help with strike selection and timing!**`;
  
  return response;
}

// Market analysis with real context
async function getMarketAnalysis(message) {
  let response = `🌍 **Market Analysis & Strategic Outlook**\n\n`;
  
  // Try to get real market data
  try {
    const ALPHA_VANTAGE_API_KEY = process.env.ALPHA_VANTAGE_API_KEY;
    if (ALPHA_VANTAGE_API_KEY) {
      const spyResponse = await fetch(`https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=SPY&apikey=${ALPHA_VANTAGE_API_KEY}`);
      
      if (spyResponse.ok) {
        const spyData = await spyResponse.json();
        const spyQuote = spyData['Global Quote'];
        
        if (spyQuote && spyQuote['05. price']) {
          const spyPrice = parseFloat(spyQuote['05. price']);
          const spyChange = parseFloat(spyQuote['09. change']);
          const spyChangePercent = parseFloat(spyQuote['10. change percent'].replace('%', ''));
          
          response += `📊 **S&P 500 (SPY)**: $${spyPrice.toFixed(2)} (${spyChange >= 0 ? '+' : ''}${spyChangePercent.toFixed(2)}%)\n\n`;
          
          if (spyChangePercent > 1) {
            response += `**🟢 Strong Bullish Session**:\n`;
            response += `• Risk-on sentiment dominant\n`;
            response += `• Growth stocks likely outperforming\n`;
            response += `• Consider momentum plays\n\n`;
          } else if (spyChangePercent < -1) {
            response += `**🔴 Bearish Pressure**:\n`;
            response += `• Risk-off sentiment\n`;
            response += `• Defensive sectors may outperform\n`;
            response += `• Consider hedging strategies\n\n`;
          } else {
            response += `**🟡 Consolidation Mode**:\n`;
            response += `• Sideways market action\n`;
            response += `• Range-bound trading likely\n`;
            response += `• Premium selling opportunities\n\n`;
          }
        }
      }
    }
  } catch (error) {
    console.error('Market data error:', error);
  }
  
  response += `**🔍 Key Market Factors**:\n\n`;
  response += `**Macro Environment**:\n`;
  response += `• Federal Reserve policy and interest rates\n`;
  response += `• Inflation data and economic indicators\n`;
  response += `• Geopolitical events and trade relations\n`;
  response += `• Currency movements (DXY impact)\n\n`;
  
  response += `**Technical Analysis**:\n`;
  response += `• SPY key levels: Support/resistance zones\n`;
  response += `• VIX levels: Market fear/greed gauge\n`;
  response += `• Sector rotation: Leadership changes\n`;
  response += `• Volume patterns: Institutional activity\n\n`;
  
  response += `**Earnings Season Impact**:\n`;
  response += `• Guidance revisions affect sectors\n`;
  response += `• Beat/miss rates influence sentiment\n`;
  response += `• Forward PE ratios and valuations\n`;
  response += `• Margin pressure from costs\n\n`;
  
  response += `**🎯 Trading Implications**:\n`;
  response += `• **High VIX (>25)**: Sell premium, buy quality dips\n`;
  response += `• **Low VIX (<15)**: Buy volatility, hedge positions\n`;
  response += `• **Trending Markets**: Follow momentum\n`;
  response += `• **Choppy Markets**: Range trading strategies\n\n`;
  
  response += `**💡 Current Market Regime Assessment**:\n`;
  response += `Based on volatility, trend, and sentiment indicators:\n`;
  response += `• Focus on liquid, high-volume names\n`;
  response += `• Adjust position sizing to market conditions\n`;
  response += `• Keep stops tight in uncertain environments\n`;
  response += `• Watch for sector rotation opportunities\n\n`;
  
  response += `**What specific market aspect interests you most? Sector analysis, volatility plays, or macro trends?**`;
  
  return response;
}

// Risk management advice
function getRiskManagementAdvice(message) {
  let response = `🛡️ **Professional Risk Management Strategy**\n\n`;
  
  response += `**Position Sizing Rules**:\n`;
  response += `• **Single Trade**: Never risk more than 2-3% of capital\n`;
  response += `• **Correlated Trades**: Max 5% combined exposure\n`;
  response += `• **High-Risk Plays**: Limit to 1% of portfolio\n`;
  response += `• **Conservative Base**: 70-80% in stable positions\n\n`;
  
  response += `**Stop Loss Strategy**:\n`;
  response += `• **Stocks**: 5-8% below entry for swings\n`;
  response += `• **Options**: 50% of premium paid\n`;
  response += `• **Breakout Plays**: Just below breakout level\n`;
  response += `• **Earnings Plays**: Exit day after announcement\n\n`;
  
  response += `**Portfolio Diversification**:\n`;
  response += `• **Sectors**: No more than 25% in single sector\n`;
  response += `• **Time Frames**: Mix of day, swing, and position trades\n`;
  response += `• **Strategies**: Balance momentum and mean reversion\n`;
  response += `• **Cash Management**: Keep 20-30% dry powder\n\n`;
  
  response += `**Risk/Reward Optimization**:\n`;
  response += `• **Minimum R:R**: 1:2 (risk $1 to make $2)\n`;
  response += `• **Win Rate**: Aim for 40-50% with good R:R\n`;
  response += `• **Scaling**: Add to winners, cut losers quickly\n`;
  response += `• **Profit Taking**: Systematic approach, not emotional\n\n`;
  
  response += `**Market Condition Adjustments**:\n`;
  response += `• **Bull Market**: Larger positions, momentum focus\n`;
  response += `• **Bear Market**: Smaller positions, defensive plays\n`;
  response += `• **High VIX**: Reduce leverage, sell premium\n`;
  response += `• **Low VIX**: Increase hedging, buy protection\n\n`;
  
  response += `**Psychology & Discipline**:\n`;
  response += `• **Plan Your Trade**: Entry, exit, and stop before entry\n`;
  response += `• **Trade Your Plan**: Stick to predetermined levels\n`;
  response += `• **Review & Adjust**: Weekly analysis of performance\n`;
  response += `• **Emotional Control**: Take breaks after big wins/losses\n\n`;
  
  response += `**💡 Which aspect of risk management do you want to focus on? Position sizing, stop losses, or portfolio balance?**`;
  
  return response;
}

// Technical analysis advice
function getTechnicalAnalysis(message) {
  let response = `📈 **Technical Analysis Framework**\n\n`;
  
  response += `**Key Support & Resistance**:\n`;
  response += `• **Previous Highs/Lows**: Natural turning points\n`;
  response += `• **Round Numbers**: $50, $100, $200 psychological levels\n`;
  response += `• **Moving Averages**: 20, 50, 200-day key levels\n`;
  response += `• **Volume Profile**: High volume areas create S/R\n\n`;
  
  response += `**Trend Analysis**:\n`;
  response += `• **Uptrend**: Higher highs, higher lows\n`;
  response += `• **Downtrend**: Lower highs, lower lows\n`;
  response += `• **Sideways**: Horizontal support/resistance\n`;
  response += `• **Trend Strength**: Volume confirms direction\n\n`;
  
  response += `**Momentum Indicators**:\n`;
  response += `• **RSI**: Overbought >70, Oversold <30\n`;
  response += `• **MACD**: Trend changes and momentum shifts\n`;
  response += `• **Volume**: Confirms or questions price moves\n`;
  response += `• **Price Action**: Candlestick patterns\n\n`;
  
  response += `**Chart Patterns**:\n`;
  response += `• **Breakouts**: Volume expansion above resistance\n`;
  response += `• **Flags/Pennants**: Continuation patterns\n`;
  response += `• **Head & Shoulders**: Reversal patterns\n`;
  response += `• **Triangles**: Consolidation before breakout\n\n`;
  
  response += `**Entry/Exit Signals**:\n`;
  response += `• **Breakout Entry**: Above resistance with volume\n`;
  response += `• **Pullback Entry**: Retest of broken level\n`;
  response += `• **Momentum Entry**: Strong follow-through\n`;
  response += `• **Exit Signals**: Divergence or pattern failure\n\n`;
  
  response += `**Risk Management with Technicals**:\n`;
  response += `• **Stop Below Support**: Clear invalidation level\n`;
  response += `• **Target at Resistance**: Measured move objectives\n`;
  response += `• **Position Size**: Based on stop distance\n`;
  response += `• **Multiple Timeframes**: Confirm on different charts\n\n`;
  
  response += `**💡 What specific technical setup are you analyzing? I can help with entry points and risk levels!**`;
  
  return response;
}

// Static stock analysis (fallback)
function getStaticStockAnalysis(symbol, message) {
  const stockData = {
    'AAPL': { name: 'Apple', sector: 'Technology', volatility: 'Medium', options: 'Very High' },
    'TSLA': { name: 'Tesla', sector: 'Electric Vehicles', volatility: 'Very High', options: 'Extremely High' },
    'SPY': { name: 'S&P 500 ETF', sector: 'Index', volatility: 'Low', options: 'Extremely High' },
    'HOOD': { name: 'Robinhood', sector: 'Fintech', volatility: 'High', options: 'High' },
    'NVDA': { name: 'NVIDIA', sector: 'Semiconductors', volatility: 'High', options: 'Very High' },
    'META': { name: 'Meta Platforms', sector: 'Social Media', volatility: 'Medium', options: 'High' },
    'GOOGL': { name: 'Alphabet', sector: 'Technology', volatility: 'Medium', options: 'High' },
    'MSFT': { name: 'Microsoft', sector: 'Technology', volatility: 'Low', options: 'High' },
    'QQQ': { name: 'NASDAQ-100 ETF', sector: 'Tech Index', volatility: 'Medium', options: 'Very High' },
    'DIA': { name: 'Dow Jones ETF', sector: 'Index', volatility: 'Low', options: 'Medium' },
    'VIX': { name: 'Volatility Index', sector: 'Volatility', volatility: 'Extreme', options: 'High' }
  };
  
  const stock = stockData[symbol] || { name: symbol, sector: 'Unknown', volatility: 'Medium', options: 'Medium' };
  
  let response = `📊 **${stock.name} (${symbol}) Analysis**\n\n`;
  response += `🏢 **Sector**: ${stock.sector}\n`;
  response += `📈 **Volatility**: ${stock.volatility}\n`;
  response += `⚡ **Options Activity**: ${stock.options}\n\n`;
  
  // Context-specific advice
  if (message.includes('strategy') || message.includes('play')) {
    response += `**Trading Strategy Considerations**:\n`;
    if (stock.volatility === 'Very High' || stock.volatility === 'Extreme') {
      response += `• High volatility = Premium selling opportunities\n`;
      response += `• Consider iron condors or covered calls\n`;
      response += `• Use tighter stops due to quick moves\n`;
    } else if (stock.volatility === 'Low') {
      response += `• Low volatility = Premium buying opportunities\n`;
      response += `• Consider long straddles or strangles\n`;
      response += `• Good for conservative strategies\n`;
    }
  }
  
  if (message.includes('option')) {
    response += `**Options Strategy**:\n`;
    response += `• Liquidity: ${stock.options} (affects spreads)\n`;
    response += `• IV Rank: Check before entering\n`;
    response += `• Consider ${stock.volatility === 'High' ? 'selling' : 'buying'} premium\n`;
  }
  
  response += `\n💡 **Want real-time analysis? I can provide live data and specific entry/exit levels!**`;
  
  return response;
}

// General intelligent response
function getIntelligentResponse(message) {
  let response = `👋 **Hey! I'm Rolo, your professional trading assistant.**\n\n`;
  
  response += `🧠 **I provide intelligent analysis on**:\n`;
  response += `• **Live Stock Data**: Real-time prices from Alpha Vantage\n`;
  response += `• **Options Strategies**: Calls, puts, spreads, complex trades\n`;
  response += `• **Technical Analysis**: Support, resistance, momentum\n`;
  response += `• **Risk Management**: Position sizing, stops, portfolio balance\n`;
  response += `• **Market Analysis**: VIX, trends, sector rotation\n`;
  response += `• **Trading Psychology**: Discipline and emotional control\n\n`;
  
  response += `🎯 **Try asking me**:\n`;
  response += `• "Analyze AAPL with real-time data"\n`;
  response += `• "What are the best options plays today?"\n`;
  response += `• "Give me a SPY trading strategy"\n`;
  response += `• "How should I manage risk on this trade?"\n`;
  response += `• "What's the market telling us right now?"\n\n`;
  
  response += `💪 **I'm different from generic AI because**:\n`;
  response += `• I use real market data, not outdated information\n`;
  response += `• I provide specific entry/exit levels\n`;
  response += `• I understand options Greeks and risk management\n`;
  response += `• I adapt strategies to current market conditions\n`;
  response += `• I give actionable advice, not just theory\n\n`;
  
  response += `🚀 **What's your trading question? I'm here to help you make better decisions!**`;
  
  return response;
}
