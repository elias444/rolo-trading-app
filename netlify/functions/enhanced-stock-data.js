// netlify/functions/enhanced-stock-data.js
// FULL ALPHA VANTAGE INTEGRATION - Extended Hours, Sentiment, Technical Indicators

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
    const params = event.queryStringParameters || {};
    const functionType = params.function || 'GLOBAL_QUOTE';
    const symbol = params.symbol?.toUpperCase();
    const extendedHours = params.extended_hours !== 'false'; // Default to true
    
    // Use your real Alpha Vantage API key
    const API_KEY = process.env.ALPHA_VANTAGE_API_KEY || 'MAQEUTLGYYXC1HF1';
    
    console.log(`Enhanced stock data request: ${functionType} for ${symbol}`);
    
    let result;
    
    switch (functionType) {
      case 'GLOBAL_QUOTE':
        result = await getEnhancedQuote(symbol, API_KEY, extendedHours);
        break;
      case 'NEWS_SENTIMENT':
        result = await getNewsSentiment(params.tickers || symbol, API_KEY);
        break;
      case 'MARKET_STATUS':
        result = await getMarketStatus(API_KEY);
        break;
      case 'SYMBOL_SEARCH':
        result = await getSymbolSearch(params.keywords, API_KEY);
        break;
      case 'TIME_SERIES_INTRADAY':
        result = await getIntradayData(symbol, API_KEY, params.interval || '5min', extendedHours);
        break;
      default:
        throw new Error(`Unsupported function: ${functionType}`);
    }
    
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(result)
    };
    
  } catch (error) {
    console.error('Enhanced stock data error:', error);
    
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        error: 'Enhanced stock data service error',
        message: error.message
      })
    };
  }
};

// Get enhanced quote with extended hours and technical analysis
async function getEnhancedQuote(symbol, apiKey, extendedHours) {
  try {
    if (!symbol) {
      throw new Error('Symbol parameter required');
    }
    
    console.log(`Fetching enhanced quote for ${symbol}, extended_hours: ${extendedHours}`);
    
    // Get basic quote first
    const [quoteData, technicalData, sentimentData, intradayData] = await Promise.allSettled([
      fetchBasicQuote(symbol, apiKey),
      fetchTechnicalIndicators(symbol, apiKey),
      fetchStockSentiment(symbol, apiKey),
      extendedHours ? fetchExtendedHoursData(symbol, apiKey) : Promise.resolve(null)
    ]);
    
    const quote = quoteData.status === 'fulfilled' ? quoteData.value : null;
    const technical = technicalData.status === 'fulfilled' ? technicalData.value : null;
    const sentiment = sentimentData.status === 'fulfilled' ? sentimentData.value : null;
    const extendedData = intradayData.status === 'fulfilled' ? intradayData.value : null;
    
    if (!quote) {
      throw new Error(`No quote data available for ${symbol}`);
    }
    
    // Combine all data
    const enhancedQuote = {
      symbol: symbol,
      timestamp: new Date().toISOString(),
      price: quote,
      technical: technical,
      sentiment: sentiment,
      extendedHours: extendedData,
      smartSignals: null
    };
    
    // Generate smart signals if we have sufficient data
    if (quote && technical) {
      enhancedQuote.smartSignals = generateSmartSignals(enhancedQuote);
    }
    
    return enhancedQuote;
    
  } catch (error) {
    console.error(`Enhanced quote error for ${symbol}:`, error);
    throw error;
  }
}

// Fetch basic quote with real-time entitlement
async function fetchBasicQuote(symbol, apiKey) {
  try {
    // Use your real-time entitlement
    const url = `https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${symbol}&entitlement=realtime&apikey=${apiKey}`;
    
    console.log(`Fetching quote: ${url}`);
    
    const response = await fetch(url);
    const data = await response.json();
    
    console.log(`Quote response for ${symbol}:`, JSON.stringify(data, null, 2));
    
    if (data.Note) {
      throw new Error('API rate limit exceeded');
    }
    
    if (data.Information) {
      throw new Error(data.Information);
    }
    
    const quote = data['Global Quote'];
    
    if (!quote || !quote['05. price']) {
      throw new Error(`No quote data for ${symbol}`);
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
    console.error(`Basic quote error for ${symbol}:`, error);
    throw error;
  }
}

// Fetch extended hours data using intraday API
async function fetchExtendedHoursData(symbol, apiKey) {
  try {
    // Get 5-minute intraday data with extended hours
    const url = `https://www.alphavantage.co/query?function=TIME_SERIES_INTRADAY&symbol=${symbol}&interval=5min&extended_hours=true&entitlement=realtime&outputsize=compact&apikey=${apiKey}`;
    
    console.log(`Fetching extended hours data: ${url}`);
    
    const response = await fetch(url);
    const data = await response.json();
    
    if (data['Time Series (5min)']) {
      const timeSeries = data['Time Series (5min)'];
      const timestamps = Object.keys(timeSeries).sort().reverse(); // Most recent first
      
      // Get the most recent data point
      if (timestamps.length > 0) {
        const latestTime = timestamps[0];
        const latestData = timeSeries[latestTime];
        
        // Check if this is outside regular market hours (9:30 AM - 4:00 PM ET)
        const timeOnly = latestTime.split(' ')[1];
        const hour = parseInt(timeOnly.split(':')[0]);
        const minute = parseInt(timeOnly.split(':')[1]);
        const timeInMinutes = hour * 60 + minute;
        
        const marketOpen = 9 * 60 + 30; // 9:30 AM
        const marketClose = 16 * 60; // 4:00 PM
        
        const isExtendedHours = timeInMinutes < marketOpen || timeInMinutes >= marketClose;
        
        return {
          isExtendedHours: isExtendedHours,
          lastUpdate: latestTime,
          price: parseFloat(latestData['4. close']),
          volume: parseInt(latestData['5. volume']),
          high: parseFloat(latestData['2. high']),
          low: parseFloat(latestData['3. low']),
          open: parseFloat(latestData['1. open'])
        };
      }
    }
    
    return null;
    
  } catch (error) {
    console.error(`Extended hours data error for ${symbol}:`, error);
    return null;
  }
}

// Fetch technical indicators
async function fetchTechnicalIndicators(symbol, apiKey) {
  try {
    // Get multiple technical indicators in parallel
    const indicators = await Promise.allSettled([
      fetchRSI(symbol, apiKey),
      fetchMACD(symbol, apiKey),
      fetchBollingerBands(symbol, apiKey),
      fetchSMA(symbol, apiKey, 20),
      fetchSMA(symbol, apiKey, 50)
    ]);
    
    return {
      rsi: indicators[0].status === 'fulfilled' ? indicators[0].value : null,
      macd: indicators[1].status === 'fulfilled' ? indicators[1].value : null,
      bollingerBands: indicators[2].status === 'fulfilled' ? indicators[2].value : null,
      sma20: indicators[3].status === 'fulfilled' ? indicators[3].value : null,
      sma50: indicators[4].status === 'fulfilled' ? indicators[4].value : null
    };
    
  } catch (error) {
    console.error(`Technical indicators error for ${symbol}:`, error);
    return null;
  }
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
async function fetchBollingerBands(symbol, apiKey) {
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

// Fetch stock-specific sentiment using Alpha Vantage NEWS_SENTIMENT
async function fetchStockSentiment(symbol, apiKey) {
  try {
    const url = `https://www.alphavantage.co/query?function=NEWS_SENTIMENT&tickers=${symbol}&limit=20&apikey=${apiKey}`;
    
    console.log(`Fetching sentiment for ${symbol}: ${url}`);
    
    const response = await fetch(url);
    const data = await response.json();
    
    if (data.feed && data.feed.length > 0) {
      // Calculate overall sentiment from recent news
      const recentNews = data.feed.slice(0, 10);
      const avgScore = recentNews.reduce((sum, article) => sum + parseFloat(article.overall_sentiment_score), 0) / recentNews.length;
      
      const bullishCount = recentNews.filter(article => article.overall_sentiment_label === 'Bullish').length;
      const bearishCount = recentNews.filter(article => article.overall_sentiment_label === 'Bearish').length;
      
      let overall = 'neutral';
      if (avgScore > 0.15) overall = 'bullish';
      else if (avgScore < -0.15) overall = 'bearish';
      
      return {
        overall: overall,
        score: avgScore,
        newsCount: recentNews.length,
        bullishCount: bullishCount,
        bearishCount: bearishCount,
        recentHeadlines: recentNews.slice(0, 3).map(article => ({
          title: article.title,
          sentiment: article.overall_sentiment_label,
          score: article.overall_sentiment_score,
          source: article.source,
          time: article.time_published
        }))
      };
    }
    
    return null;
    
  } catch (error) {
    console.error(`Sentiment fetch error for ${symbol}:`, error);
    return null;
  }
}

// Get news sentiment for multiple tickers
async function getNewsSentiment(tickers, apiKey) {
  try {
    const url = `https://www.alphavantage.co/query?function=NEWS_SENTIMENT&tickers=${tickers}&limit=50&apikey=${apiKey}`;
    
    console.log(`Fetching news sentiment: ${url}`);
    
    const response = await fetch(url);
    const data = await response.json();
    
    return data;
    
  } catch (error) {
    console.error('News sentiment error:', error);
    throw error;
  }
}

// Get market status
async function getMarketStatus(apiKey) {
  try {
    const url = `https://www.alphavantage.co/query?function=MARKET_STATUS&apikey=${apiKey}`;
    
    console.log(`Fetching market status: ${url}`);
    
    const response = await fetch(url);
    const data = await response.json();
    
    return data;
    
  } catch (error) {
    console.error('Market status error:', error);
    throw error;
  }
}

// Symbol search
async function getSymbolSearch(keywords, apiKey) {
  try {
    if (!keywords) {
      throw new Error('Keywords parameter required');
    }
    
    const url = `https://www.alphavantage.co/query?function=SYMBOL_SEARCH&keywords=${encodeURIComponent(keywords)}&apikey=${apiKey}`;
    
    console.log(`Symbol search: ${url}`);
    
    const response = await fetch(url);
    const data = await response.json();
    
    return data;
    
  } catch (error) {
    console.error('Symbol search error:', error);
    throw error;
  }
}

// Get intraday data with extended hours
async function getIntradayData(symbol, apiKey, interval, extendedHours) {
  try {
    const extendedParam = extendedHours ? 'true' : 'false';
    const url = `https://www.alphavantage.co/query?function=TIME_SERIES_INTRADAY&symbol=${symbol}&interval=${interval}&extended_hours=${extendedParam}&entitlement=realtime&outputsize=compact&apikey=${apiKey}`;
    
    console.log(`Fetching intraday data: ${url}`);
    
    const response = await fetch(url);
    const data = await response.json();
    
    return data;
    
  } catch (error) {
    console.error('Intraday data error:', error);
    throw error;
  }
}

// Generate smart signals from all available data
function generateSmartSignals(enhancedData) {
  const signals = {
    overall: 'neutral',
    strength: 0,
    signals: [],
    alerts: [],
    plays: []
  };
  
  const { price, technical, sentiment, extendedHours } = enhancedData;
  
  if (!price || !technical) return signals;
  
  const currentPrice = price.price;
  const changePercent = price.changePercent;
  
  // RSI Analysis
  if (technical.rsi) {
    if (technical.rsi.value > 75) {
      signals.signals.push({
        type: 'technical',
        indicator: 'RSI',
        signal: 'Extremely Overbought',
        strength: 'high',
        message: `RSI at ${technical.rsi.value.toFixed(1)} - extreme overbought conditions`
      });
      signals.plays.push({
        type: 'options',
        strategy: 'Put Spreads',
        reason: 'Extreme RSI overbought suggests pullback',
        confidence: 0.8
      });
    } else if (technical.rsi.value < 25) {
      signals.signals.push({
        type: 'technical',
        indicator: 'RSI',
        signal: 'Extremely Oversold',
        strength: 'high',
        message: `RSI at ${technical.rsi.value.toFixed(1)} - extreme oversold conditions`
      });
      signals.plays.push({
        type: 'options',
        strategy: 'Call Spreads',
        reason: 'Extreme RSI oversold suggests bounce',
        confidence: 0.8
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
        message: 'MACD bullish crossover with positive histogram'
      });
    }
  }
  
  // Sentiment Analysis
  if (sentiment) {
    if (sentiment.overall === 'bullish' && sentiment.score > 0.2) {
      signals.signals.push({
        type: 'sentiment',
        indicator: 'News Sentiment',
        signal: 'Strong Bullish News',
        strength: 'high',
        message: `Strong positive sentiment (${(sentiment.score * 100).toFixed(1)}%) from ${sentiment.newsCount} articles`
      });
    } else if (sentiment.overall === 'bearish' && sentiment.score < -0.2) {
      signals.signals.push({
        type: 'sentiment',
        indicator: 'News Sentiment',
        signal: 'Strong Bearish News',
        strength: 'high',
        message: `Strong negative sentiment (${(sentiment.score * 100).toFixed(1)}%) from ${sentiment.newsCount} articles`
      });
    }
  }
  
  // Extended Hours Analysis
  if (extendedHours && extendedHours.isExtendedHours) {
    signals.signals.push({
      type: 'timing',
      indicator: 'Extended Hours',
      signal: 'After Hours Activity',
      strength: 'medium',
      message: `Trading outside regular hours - potential news catalyst`
    });
  }
  
  // Volume Analysis
  if (price.volume > 5000000) { // High volume threshold
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
  }
  
  // Calculate overall signal strength
  const bullishSignals = signals.signals.filter(s => 
    s.signal.includes('Bullish') || s.signal.includes('Oversold') || s.signal.includes('Strong Bullish')
  ).length;
  const bearishSignals = signals.signals.filter(s => 
    s.signal.includes('Bearish') || s.signal.includes('Overbought') || s.signal.includes('Strong Bearish')
  ).length;
  
  if (bullishSignals > bearishSignals) {
    signals.overall = 'bullish';
    signals.strength = (bullishSignals / (bullishSignals + bearishSignals)) * 100;
  } else if (bearishSignals > bullishSignals) {
    signals.overall = 'bearish';
    signals.strength = (bearishSignals / (bullishSignals + bearishSignals)) * 100;
  }
  
  return signals;
}
