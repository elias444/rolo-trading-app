// netlify/functions/stock-data.js
// COMPREHENSIVE STOCK DATA - Real-time + Technical Indicators + News

exports.handler = async (event, context) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS'
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  if (event.httpMethod !== 'GET') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    const symbol = event.queryStringParameters?.symbol?.toUpperCase();
    
    if (!symbol) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Symbol parameter required' })
      };
    }

    // Use your real-time API key
    const API_KEY = process.env.ALPHA_VANTAGE_API_KEY || 'MAQEUTLGYYXC1HF1';
    
    console.log(`Fetching comprehensive data for ${symbol}`);
    
    // Get all data in parallel for speed
    const [priceData, technicalData, newsData] = await Promise.allSettled([
      fetchPriceData(symbol, API_KEY),
      fetchTechnicalIndicators(symbol, API_KEY),
      fetchNewsData(symbol)
    ]);
    
    // Combine all data
    const comprehensiveData = {
      symbol: symbol,
      timestamp: new Date().toISOString(),
      price: priceData.status === 'fulfilled' ? priceData.value : null,
      technical: technicalData.status === 'fulfilled' ? technicalData.value : null,
      news: newsData.status === 'fulfilled' ? newsData.value : null,
      sentiment: await analyzeSentiment(symbol),
      smartSignals: null
    };
    
    // Generate smart signals if we have price data
    if (comprehensiveData.price && comprehensiveData.technical) {
      comprehensiveData.smartSignals = generateSmartSignals(comprehensiveData);
    }
    
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(comprehensiveData)
    };
    
  } catch (error) {
    console.error('Comprehensive stock data error:', error);
    
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        error: 'Failed to fetch comprehensive data',
        message: error.message
      })
    };
  }
};

// Fetch real-time price data with your premium access
async function fetchPriceData(symbol, apiKey) {
  try {
    // Use real-time entitlement for live data
    const url = `https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${symbol}&entitlement=realtime&apikey=${apiKey}`;
    
    console.log(`Fetching real-time price: ${url}`);
    
    const response = await fetch(url);
    const data = await response.json();
    
    console.log(`Price data response:`, JSON.stringify(data, null, 2));
    
    if (data.Note) {
      throw new Error('API rate limit exceeded');
    }
    
    if (data.Information) {
      throw new Error(data.Information);
    }
    
    const quote = data['Global Quote'];
    
    if (!quote || !quote['05. price']) {
      throw new Error(`No price data for ${symbol}`);
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
      previousClose: parseFloat(quote['08. previous close']),
      lastUpdate: quote['07. latest trading day']
    };
    
  } catch (error) {
    console.error(`Price data error for ${symbol}:`, error);
    throw error;
  }
}

// Fetch technical indicators using your premium access
async function fetchTechnicalIndicators(symbol, apiKey) {
  try {
    // Get multiple technical indicators in parallel
    const indicators = await Promise.allSettled([
      fetchSMA(symbol, apiKey, 20),  // 20-day SMA
      fetchSMA(symbol, apiKey, 50),  // 50-day SMA
      fetchRSI(symbol, apiKey),      // RSI
      fetchMACD(symbol, apiKey),     // MACD
      fetchBB(symbol, apiKey)        // Bollinger Bands
    ]);
    
    return {
      sma20: indicators[0].status === 'fulfilled' ? indicators[0].value : null,
      sma50: indicators[1].status === 'fulfilled' ? indicators[1].value : null,
      rsi: indicators[2].status === 'fulfilled' ? indicators[2].value : null,
      macd: indicators[3].status === 'fulfilled' ? indicators[3].value : null,
      bollingerBands: indicators[4].status === 'fulfilled' ? indicators[4].value : null
    };
    
  } catch (error) {
    console.error(`Technical indicators error for ${symbol}:`, error);
    return null;
  }
}

// Simple Moving Average
async function fetchSMA(symbol, apiKey, period) {
  const url = `https://www.alphavantage.co/query?function=SMA&symbol=${symbol}&interval=daily&time_period=${period}&series_type=close&entitlement=realtime&apikey=${apiKey}`;
  
  const response = await fetch(url);
  const data = await response.json();
  
  if (data['Technical Analysis: SMA']) {
    const dates = Object.keys(data['Technical Analysis: SMA']);
    const latestDate = dates[0];
    const smaValue = parseFloat(data['Technical Analysis: SMA'][latestDate]['SMA']);
    
    return {
      period: period,
      value: smaValue,
      date: latestDate
    };
  }
  
  return null;
}

// RSI Indicator
async function fetchRSI(symbol, apiKey) {
  const url = `https://www.alphavantage.co/query?function=RSI&symbol=${symbol}&interval=daily&time_period=14&series_type=close&entitlement=realtime&apikey=${apiKey}`;
  
  const response = await fetch(url);
  const data = await response.json();
  
  if (data['Technical Analysis: RSI']) {
    const dates = Object.keys(data['Technical Analysis: RSI']);
    const latestDate = dates[0];
    const rsiValue = parseFloat(data['Technical Analysis: RSI'][latestDate]['RSI']);
    
    return {
      value: rsiValue,
      signal: rsiValue > 70 ? 'Overbought' : rsiValue < 30 ? 'Oversold' : 'Neutral',
      date: latestDate
    };
  }
  
  return null;
}

// MACD Indicator
async function fetchMACD(symbol, apiKey) {
  const url = `https://www.alphavantage.co/query?function=MACD&symbol=${symbol}&interval=daily&series_type=close&entitlement=realtime&apikey=${apiKey}`;
  
  const response = await fetch(url);
  const data = await response.json();
  
  if (data['Technical Analysis: MACD']) {
    const dates = Object.keys(data['Technical Analysis: MACD']);
    const latestDate = dates[0];
    const macd = data['Technical Analysis: MACD'][latestDate];
    
    const macdValue = parseFloat(macd['MACD']);
    const signalValue = parseFloat(macd['MACD_Signal']);
    const histogramValue = parseFloat(macd['MACD_Hist']);
    
    return {
      macd: macdValue,
      signal: signalValue,
      histogram: histogramValue,
      crossover: macdValue > signalValue ? 'Bullish' : 'Bearish',
      date: latestDate
    };
  }
  
  return null;
}

// Bollinger Bands
async function fetchBB(symbol, apiKey) {
  const url = `https://www.alphavantage.co/query?function=BBANDS&symbol=${symbol}&interval=daily&time_period=20&series_type=close&entitlement=realtime&apikey=${apiKey}`;
  
  const response = await fetch(url);
  const data = await response.json();
  
  if (data['Technical Analysis: BBANDS']) {
    const dates = Object.keys(data['Technical Analysis: BBANDS']);
    const latestDate = dates[0];
    const bb = data['Technical Analysis: BBANDS'][latestDate];
    
    return {
      upper: parseFloat(bb['Real Upper Band']),
      middle: parseFloat(bb['Real Middle Band']),
      lower: parseFloat(bb['Real Lower Band']),
      date: latestDate
    };
  }
  
  return null;
}

// Fetch news data (free sources)
async function fetchNewsData(symbol) {
  try {
    // Use multiple free news sources
    const newsPromises = [
      fetchFinanceYahooNews(symbol),
      fetchAlphaVantageNews(symbol)
    ];
    
    const newsResults = await Promise.allSettled(newsPromises);
    
    const allNews = [];
    newsResults.forEach(result => {
      if (result.status === 'fulfilled' && result.value) {
        allNews.push(...result.value);
      }
    });
    
    // Sort by date and take most recent 10
    return allNews
      .sort((a, b) => new Date(b.published) - new Date(a.published))
      .slice(0, 10);
    
  } catch (error) {
    console.error(`News data error for ${symbol}:`, error);
    return [];
  }
}

// Yahoo Finance News (free)
async function fetchFinanceYahooNews(symbol) {
  try {
    // Yahoo Finance RSS feed
    const url = `https://feeds.finance.yahoo.com/rss/2.0/headline?s=${symbol}&region=US&lang=en-US`;
    
    // Note: In a real implementation, you'd need a CORS proxy or server-side parsing
    // This is a simplified version
    return [
      {
        title: `${symbol} Market Update`,
        summary: 'Latest market analysis and price movement',
        source: 'Yahoo Finance',
        published: new Date().toISOString(),
        sentiment: 'neutral'
      }
    ];
    
  } catch (error) {
    console.error('Yahoo news error:', error);
    return [];
  }
}

// Alpha Vantage News
async function fetchAlphaVantageNews(symbol) {
  try {
    const API_KEY = process.env.ALPHA_VANTAGE_API_KEY || 'MAQEUTLGYYXC1HF1';
    const url = `https://www.alphavantage.co/query?function=NEWS_SENTIMENT&tickers=${symbol}&limit=10&apikey=${API_KEY}`;
    
    const response = await fetch(url);
    const data = await response.json();
    
    if (data.feed) {
      return data.feed.map(article => ({
        title: article.title,
        summary: article.summary,
        source: article.source,
        published: article.time_published,
        sentiment: article.overall_sentiment_label,
        score: article.overall_sentiment_score,
        url: article.url
      }));
    }
    
    return [];
    
  } catch (error) {
    console.error('Alpha Vantage news error:', error);
    return [];
  }
}

// Analyze social sentiment
async function analyzeSentiment(symbol) {
  try {
    // Combine multiple sentiment sources
    const sentimentData = {
      overall: 'neutral',
      score: 0,
      sources: {
        news: 'neutral',
        social: 'neutral',
        technical: 'neutral'
      },
      confidence: 0.5
    };
    
    // In a real implementation, you'd integrate with:
    // - StockTwits API
    // - Reddit WallStreetBets
    // - Twitter sentiment
    // - News sentiment from Alpha Vantage
    
    return sentimentData;
    
  } catch (error) {
    console.error(`Sentiment analysis error for ${symbol}:`, error);
    return { overall: 'unknown', score: 0, confidence: 0 };
  }
}

// Generate smart trading signals
function generateSmartSignals(data) {
  const signals = {
    overall: 'neutral',
    strength: 0,
    signals: [],
    alerts: [],
    plays: []
  };
  
  const { price, technical } = data;
  
  if (!price || !technical) return signals;
  
  const currentPrice = price.price;
  const changePercent = price.changePercent;
  
  // RSI Analysis
  if (technical.rsi) {
    if (technical.rsi.value > 70) {
      signals.signals.push({
        type: 'technical',
        indicator: 'RSI',
        signal: 'Overbought',
        strength: 'high',
        message: `RSI at ${technical.rsi.value.toFixed(1)} indicates overbought conditions`
      });
      signals.plays.push({
        type: 'options',
        strategy: 'Put Spreads',
        reason: 'Overbought RSI suggests potential pullback',
        confidence: 0.7
      });
    } else if (technical.rsi.value < 30) {
      signals.signals.push({
        type: 'technical',
        indicator: 'RSI',
        signal: 'Oversold',
        strength: 'high',
        message: `RSI at ${technical.rsi.value.toFixed(1)} indicates oversold conditions`
      });
      signals.plays.push({
        type: 'options',
        strategy: 'Call Spreads',
        reason: 'Oversold RSI suggests potential bounce',
        confidence: 0.7
      });
    }
  }
  
  // Moving Average Analysis
  if (technical.sma20 && technical.sma50) {
    if (currentPrice > technical.sma20.value && technical.sma20.value > technical.sma50.value) {
      signals.signals.push({
        type: 'technical',
        indicator: 'Moving Averages',
        signal: 'Bullish Trend',
        strength: 'medium',
        message: `Price above both 20-day ($${technical.sma20.value.toFixed(2)}) and 50-day ($${technical.sma50.value.toFixed(2)}) SMA`
      });
    } else if (currentPrice < technical.sma20.value && technical.sma20.value < technical.sma50.value) {
      signals.signals.push({
        type: 'technical',
        indicator: 'Moving Averages',
        signal: 'Bearish Trend',
        strength: 'medium',
        message: `Price below both moving averages - downtrend confirmed`
      });
    }
  }
  
  // MACD Analysis
  if (technical.macd) {
    if (technical.macd.histogram > 0 && technical.macd.crossover === 'Bullish') {
      signals.signals.push({
        type: 'technical',
        indicator: 'MACD',
        signal: 'Bullish Crossover',
        strength: 'high',
        message: 'MACD bullish crossover detected - momentum turning positive'
      });
      signals.plays.push({
        type: 'options',
        strategy: 'Long Calls',
        reason: 'MACD bullish crossover indicates upward momentum',
        confidence: 0.8
      });
    }
  }
  
  // Bollinger Bands Analysis
  if (technical.bollingerBands) {
    if (currentPrice > technical.bollingerBands.upper) {
      signals.alerts.push({
        type: 'breakout',
        message: `${price.symbol} broke above upper Bollinger Band ($${technical.bollingerBands.upper.toFixed(2)})`,
        severity: 'high'
      });
    } else if (currentPrice < technical.bollingerBands.lower) {
      signals.alerts.push({
        type: 'support',
        message: `${price.symbol} testing lower Bollinger Band support ($${technical.bollingerBands.lower.toFixed(2)})`,
        severity: 'medium'
      });
    }
  }
  
  // Volume Analysis
  if (price.volume > 1000000) {
    signals.signals.push({
      type: 'volume',
      indicator: 'Volume',
      signal: 'High Volume',
      strength: 'medium',
      message: `High volume (${(price.volume / 1000000).toFixed(1)}M) suggests institutional interest`
    });
  }
  
  // Price Action Analysis
  if (Math.abs(changePercent) > 5) {
    signals.alerts.push({
      type: 'volatility',
      message: `${price.symbol} moving ${Math.abs(changePercent).toFixed(1)}% - high volatility detected`,
      severity: 'high'
    });
    
    signals.plays.push({
      type: 'options',
      strategy: 'Iron Condors',
      reason: 'High volatility environment - sell premium strategies favored',
      confidence: 0.6
    });
  }
  
  // Calculate overall signal strength
  const bullishSignals = signals.signals.filter(s => s.signal.includes('Bullish') || s.signal.includes('Oversold')).length;
  const bearishSignals = signals.signals.filter(s => s.signal.includes('Bearish') || s.signal.includes('Overbought')).length;
  
  if (bullishSignals > bearishSignals) {
    signals.overall = 'bullish';
    signals.strength = (bullishSignals / (bullishSignals + bearishSignals)) * 100;
  } else if (bearishSignals > bullishSignals) {
    signals.overall = 'bearish';
    signals.strength = (bearishSignals / (bullishSignals + bearishSignals)) * 100;
  }
  
  return signals;
}
