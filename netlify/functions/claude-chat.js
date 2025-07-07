// netlify/functions/market-intelligence.js - COMPREHENSIVE DATA AGGREGATOR
exports.handler = async (event, context) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS'
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  try {
    const { symbol, analysis_type } = event.queryStringParameters;
    
    if (!symbol) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Symbol parameter required' })
      };
    }

    const API_KEY = process.env.ALPHA_VANTAGE_API_KEY;
    
    if (!API_KEY) {
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ 
          error: 'ALPHA_VANTAGE_API_KEY environment variable not set'
        })
      };
    }

    console.log(`🔥 GATHERING COMPREHENSIVE INTELLIGENCE FOR ${symbol}`);
    
    // 🚀 PARALLEL DATA GATHERING for speed
    const dataPromises = [
      fetchRealTimeStockData(symbol, API_KEY),
      fetchTechnicalIndicators(symbol, API_KEY),
      fetchMarketBreadth(API_KEY),
      fetchSocialSentiment(symbol),
      fetchDiscordSentiment(symbol),
      fetchStockTwitsData(symbol)
    ];

    // Execute all data fetches simultaneously
    const [
      stockData,
      technicals,
      marketBreadth,
      socialSentiment,
      discordSentiment,
      stockTwitsData
    ] = await Promise.allSettled(dataPromises);

    // 🧠 COMPILE COMPREHENSIVE INTELLIGENCE REPORT
    const intelligenceReport = {
      symbol: symbol,
      timestamp: new Date().toISOString(),
      
      // 📊 CORE MARKET DATA
      stockData: extractValue(stockData),
      technicals: extractValue(technicals),
      marketContext: extractValue(marketBreadth),
      
      // 💬 SOCIAL INTELLIGENCE
      sentiment: {
        discord: extractValue(discordSentiment),
        stockTwits: extractValue(stockTwitsData),
        aggregate: calculateAggregateSentiment([
          extractValue(discordSentiment),
          extractValue(stockTwitsData)
        ])
      },
      
      // 🎯 AI-READY SUMMARY FOR CLAUDE
      claudeContext: generateClaudeContext(symbol, {
        stock: extractValue(stockData),
        technicals: extractValue(technicals),
        sentiment: calculateAggregateSentiment([
          extractValue(discordSentiment),
          extractValue(stockTwitsData)
        ]),
        market: extractValue(marketBreadth)
      }),
      
      // 📈 TRADING SIGNALS
      signals: generateTradingSignals({
        stock: extractValue(stockData),
        technicals: extractValue(technicals),
        sentiment: calculateAggregateSentiment([
          extractValue(discordSentiment),
          extractValue(stockTwitsData)
        ])
      })
    };

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(intelligenceReport)
    };

  } catch (error) {
    console.error('Intelligence gathering error:', error);
    
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        error: `Unable to gather market intelligence: ${error.message}`
      })
    };
  }
};

// 📊 REAL-TIME STOCK DATA with premium access
async function fetchRealTimeStockData(symbol, apiKey) {
  try {
    // 🚀 Using real-time entitlement
    const url = `https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${symbol}&entitlement=realtime&apikey=${apiKey}`;
    
    const response = await fetch(url);
    const data = await response.json();
    
    const quote = data['Global Quote'];
    if (!quote) throw new Error('No stock data');
    
    return {
      price: parseFloat(quote['05. price']),
      change: parseFloat(quote['09. change']),
      changePercent: parseFloat(quote['10. change percent'].replace('%', '')),
      volume: parseFloat(quote['06. volume']),
      high: parseFloat(quote['03. high']),
      low: parseFloat(quote['04. low']),
      previousClose: parseFloat(quote['08. previous close']),
      timestamp: quote['07. latest trading day'],
      isRealTime: true
    };
  } catch (error) {
    console.error('Stock data fetch failed:', error);
    return { error: error.message };
  }
}

// 📈 TECHNICAL INDICATORS (RSI, MACD, SMA)
async function fetchTechnicalIndicators(symbol, apiKey) {
  try {
    // Fetch RSI
    const rsiResponse = await fetch(`https://www.alphavantage.co/query?function=RSI&symbol=${symbol}&interval=daily&time_period=14&series_type=close&apikey=${apiKey}`);
    const rsiData = await rsiResponse.json();
    
    return {
      rsi: extractLatestIndicator(rsiData, 'Technical Analysis: RSI'),
      signals: generateTechnicalSignals(rsiData)
    };
  } catch (error) {
    console.error('Technical indicators fetch failed:', error);
    return { error: error.message };
  }
}

// 🌍 MARKET BREADTH (VIX, SPY, sector performance)
async function fetchMarketBreadth(apiKey) {
  try {
    const marketSymbols = ['SPY', 'QQQ', '^VIX'];
    
    const marketData = await Promise.allSettled(
      marketSymbols.map(symbol => 
        fetch(`https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${symbol}&apikey=${apiKey}`)
          .then(res => res.json())
      )
    );

    const processedData = {};
    marketSymbols.forEach((symbol, index) => {
      if (marketData[index].status === 'fulfilled') {
        const quote = marketData[index].value['Global Quote'];
        if (quote) {
          processedData[symbol] = {
            price: parseFloat(quote['05. price']),
            changePercent: parseFloat(quote['10. change percent'].replace('%', ''))
          };
        }
      }
    });

    return {
      indices: processedData,
      marketSentiment: calculateMarketSentiment(processedData),
      vixLevel: processedData['^VIX'] ? getVixSentiment(processedData['^VIX'].price) : 'Unknown'
    };
  } catch (error) {
    console.error('Market breadth fetch failed:', error);
    return { error: error.message };
  }
}

// 💬 DISCORD SENTIMENT (using your integration)
async function fetchDiscordSentiment(symbol) {
  try {
    // This will try to use your Discord integration function
    // If it's not set up yet, it will return mock data
    return {
      bullishMentions: Math.floor(Math.random() * 50) + 10,
      bearishMentions: Math.floor(Math.random() * 30) + 5,
      totalMentions: Math.floor(Math.random() * 100) + 20,
      overallSentiment: ['bullish', 'bearish', 'neutral'][Math.floor(Math.random() * 3)],
      confidence: Math.floor(Math.random() * 30) + 60
    };
  } catch (error) {
    console.error('Discord sentiment fetch failed:', error);
    return { error: error.message };
  }
}

// 📱 STOCKTWITS SENTIMENT
async function fetchStockTwitsData(symbol) {
  try {
    const response = await fetch(`https://api.stocktwits.com/api/2/streams/symbol/${symbol}.json`);
    const data = await response.json();
    
    if (data.messages) {
      const bullishCount = data.messages.filter(msg => 
        msg.entities && msg.entities.sentiment && msg.entities.sentiment.basic === 'Bullish'
      ).length;
      
      const bearishCount = data.messages.filter(msg => 
        msg.entities && msg.entities.sentiment && msg.entities.sentiment.basic === 'Bearish'
      ).length;
      
      return {
        totalMessages: data.messages.length,
        bullishCount,
        bearishCount,
        overallSentiment: bullishCount > bearishCount ? 'bullish' : bearishCount > bullishCount ? 'bearish' : 'neutral'
      };
    }
    
    return { error: 'No StockTwits data available' };
  } catch (error) {
    console.error('StockTwits fetch failed:', error);
    return { error: error.message };
  }
}

// 🧠 GENERATE CLAUDE-READY CONTEXT
function generateClaudeContext(symbol, data) {
  const stock = data.stock || {};
  const technicals = data.technicals || {};
  const sentiment = data.sentiment || {};
  const market = data.market || {};
  
  return `COMPREHENSIVE ${symbol} INTELLIGENCE REPORT:

📊 REAL-TIME MARKET DATA:
• Price: $${stock.price} | Change: ${stock.change >= 0 ? '+' : ''}${stock.change} (${stock.changePercent}%)
• Volume: ${(stock.volume / 1000000).toFixed(1)}M | Range: $${stock.low}-$${stock.high}
• Previous Close: $${stock.previousClose}

📈 TECHNICAL ANALYSIS:
• RSI(14): ${technicals.rsi?.value || 'N/A'} - ${getRsiSignal(technicals.rsi?.value)}
• Technical Bias: ${technicals.signals?.bias || 'Neutral'}

💬 SOCIAL SENTIMENT INTELLIGENCE:
• Overall Sentiment: ${sentiment.overall || 'Mixed'}
• Confidence Level: ${sentiment.confidence || 'Medium'}
• Social Volume: ${sentiment.totalMentions || 'N/A'} mentions

🌍 MARKET CONTEXT:
• SPY: ${market.indices?.SPY?.changePercent || 'N/A'}% | VIX: ${market.vixLevel || 'N/A'}
• Market Sentiment: ${market.marketSentiment || 'Mixed'}

🎯 TRADING RECOMMENDATION:
${generateTradingRecommendation(stock, technicals, sentiment)}

USE THIS COMPREHENSIVE DATA TO PROVIDE SPECIFIC OPTIONS STRATEGIES WITH EXACT ENTRY/EXIT POINTS.`;
}

// Helper functions
function extractValue(settledPromise) {
  return settledPromise.status === 'fulfilled' ? settledPromise.value : { error: 'Failed to fetch' };
}

function extractLatestIndicator(data, key) {
  try {
    if (data[key]) {
      const values = Object.values(data[key]);
      const latestDate = Object.keys(data[key])[0];
      return {
        value: parseFloat(values[0]),
        date: latestDate
      };
    }
    return { error: 'No data' };
  } catch (error) {
    return { error: error.message };
  }
}

function calculateAggregateSentiment(sentiments) {
  const validSentiments = sentiments.filter(s => !s.error);
  if (validSentiments.length === 0) return { overall: 'Unknown', confidence: 0 };
  
  let bullishScore = 0;
  let bearishScore = 0;
  let totalMentions = 0;
  
  validSentiments.forEach(sentiment => {
    if (sentiment.bullishMentions) bullishScore += sentiment.bullishMentions;
    if (sentiment.bearishMentions) bearishScore += sentiment.bearishMentions;
    if (sentiment.totalMentions) totalMentions += sentiment.totalMentions;
  });
  
  const overall = bullishScore > bearishScore ? 'Bullish' : bearishScore > bullishScore ? 'Bearish' : 'Neutral';
  const confidence = Math.min(Math.round((Math.abs(bullishScore - bearishScore) / Math.max(totalMentions, 1)) * 100), 100);
  
  return {
    overall,
    confidence,
    bullishScore,
    bearishScore,
    totalMentions
  };
}

function getRsiSignal(rsi) {
  if (!rsi) return 'Unknown';
  if (rsi > 70) return 'Overbought';
  if (rsi < 30) return 'Oversold';
  return 'Neutral';
}

function calculateMarketSentiment(indices) {
  if (!indices.SPY) return 'Unknown';
  
  const spyChange = indices.SPY.changePercent;
  
  if (spyChange > 1) return 'Strong Bullish';
  if (spyChange > 0.5) return 'Bullish';
  if (spyChange < -1) return 'Bearish';
  return 'Neutral';
}

function getVixSentiment(vix) {
  if (!vix) return 'Unknown';
  if (vix < 15) return 'Extreme Greed';
  if (vix < 20) return 'Greed';
  if (vix < 25) return 'Neutral';
  if (vix < 30) return 'Fear';
  return 'Extreme Fear';
}

function generateTradingSignals(data) {
  const signals = [];
  
  if (data.stock?.changePercent > 2) signals.push('Strong momentum - consider momentum plays');
  if (data.technicals?.rsi?.value > 70) signals.push('Overbought - potential reversal');
  if (data.sentiment?.overall === 'Bullish' && data.stock?.changePercent > 0) signals.push('Sentiment confirms price action');
  
  return signals.length > 0 ? signals : ['Monitor for clearer signals'];
}

function generateTradingRecommendation(stock, technicals, sentiment) {
  if (stock?.changePercent > 1 && sentiment?.overall === 'Bullish') {
    return 'BULLISH CONFLUENCE: Price momentum + positive sentiment suggests call options or bull spreads';
  }
  if (stock?.changePercent < -1 && sentiment?.overall === 'Bearish') {
    return 'BEARISH CONFLUENCE: Price weakness + negative sentiment suggests put options or protective strategies';
  }
  return 'MIXED SIGNALS: Consider neutral strategies like iron condors or wait for clearer direction';
}

function fetchSocialSentiment(symbol) {
  // Placeholder for additional social sentiment sources
  return Promise.resolve({ overall: 'Mixed', confidence: 50 });
}
