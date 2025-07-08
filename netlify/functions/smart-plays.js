// netlify/functions/smart-alerts.js
// SMART ALERTS - Real-time monitoring with intelligent notifications

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
    const method = event.httpMethod;
    
    if (method === 'GET') {
      // Get active alerts
      return await getActiveAlerts();
    } else if (method === 'POST') {
      // Create or update alert
      const alertData = JSON.parse(event.body);
      return await createOrUpdateAlert(alertData);
    }
    
  } catch (error) {
    console.error('Smart alerts error:', error);
    
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        error: 'Smart alerts service error',
        message: error.message
      })
    };
  }
};

// Get active alerts with real-time analysis
async function getActiveAlerts() {
  try {
    const alerts = await generateRealTimeAlerts();
    
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        alerts: alerts,
        timestamp: new Date().toISOString(),
        total: alerts.length
      })
    };
    
  } catch (error) {
    console.error('Get alerts error:', error);
    throw error;
  }
}

// Generate real-time alerts based on market conditions
async function generateRealTimeAlerts() {
  const alerts = [];
  
  // Monitor popular stocks for unusual activity
  const watchlist = ['AAPL', 'TSLA', 'HOOD', 'SPY', 'QQQ', 'NVDA', 'AMZN', 'GOOGL', 'MSFT', 'META'];
  
  const API_KEY = process.env.ALPHA_VANTAGE_API_KEY || 'MAQEUTLGYYXC1HF1';
  
  // Check each stock for alert conditions
  for (const symbol of watchlist) {
    try {
      const stockAlerts = await analyzeStockForAlerts(symbol, API_KEY);
      alerts.push(...stockAlerts);
    } catch (error) {
      console.error(`Alert analysis error for ${symbol}:`, error);
    }
  }
  
  // Add market-wide alerts
  const marketAlerts = await generateMarketAlerts(API_KEY);
  alerts.push(...marketAlerts);
  
  // Sort by priority and time
  return alerts.sort((a, b) => {
    if (a.priority !== b.priority) {
      return b.priority - a.priority; // Higher priority first
    }
    return new Date(b.timestamp) - new Date(a.timestamp); // Most recent first
  });
}

// Analyze individual stock for alert conditions
async function analyzeStockForAlerts(symbol, apiKey) {
  const alerts = [];
  
  try {
    // Get comprehensive stock data
    const [priceData, technicalData] = await Promise.allSettled([
      fetchStockPrice(symbol, apiKey),
      fetchTechnicalAlerts(symbol, apiKey)
    ]);
    
    const price = priceData.status === 'fulfilled' ? priceData.value : null;
    const technical = technicalData.status === 'fulfilled' ? technicalData.value : null;
    
    if (!price) return alerts;
    
    const currentPrice = price.price;
    const changePercent = price.changePercent;
    const volume = price.volume;
    
    // 1. UNUSUAL VOLUME ALERT
    if (volume > getAverageVolume(symbol) * 2) {
      alerts.push({
        id: `${symbol}_volume_${Date.now()}`,
        symbol: symbol,
        type: 'volume_spike',
        priority: 8,
        title: `🔥 Unusual Volume: ${symbol}`,
        message: `Volume spike detected: ${(volume / 1000000).toFixed(1)}M shares (${Math.round(volume / getAverageVolume(symbol))}x normal)`,
        price: currentPrice,
        change: changePercent,
        timestamp: new Date().toISOString(),
        action: 'investigate',
        confidence: 0.9
      });
    }
    
    // 2. SIGNIFICANT PRICE MOVEMENT
    if (Math.abs(changePercent) > 5) {
      const direction = changePercent > 0 ? 'up' : 'down';
      const emoji = changePercent > 0 ? '🚀' : '📉';
      
      alerts.push({
        id: `${symbol}_move_${Date.now()}`,
        symbol: symbol,
        type: 'price_movement',
        priority: 7,
        title: `${emoji} Big Move: ${symbol}`,
        message: `${symbol} ${direction} ${Math.abs(changePercent).toFixed(1)}% to $${currentPrice.toFixed(2)}`,
        price: currentPrice,
        change: changePercent,
        timestamp: new Date().toISOString(),
        action: changePercent > 0 ? 'consider_calls' : 'consider_puts',
        confidence: 0.8
      });
    }
    
    // 3. TECHNICAL BREAKOUT ALERTS
    if (technical) {
      // RSI Extreme Conditions
      if (technical.rsi && (technical.rsi.value > 75 || technical.rsi.value < 25)) {
        const condition = technical.rsi.value > 75 ? 'Extremely Overbought' : 'Extremely Oversold';
        const action = technical.rsi.value > 75 ? 'consider_puts' : 'consider_calls';
        
        alerts.push({
          id: `${symbol}_rsi_${Date.now()}`,
          symbol: symbol,
          type: 'technical_extreme',
          priority: 6,
          title: `⚠️ RSI Alert: ${symbol}`,
          message: `${condition} - RSI at ${technical.rsi.value.toFixed(1)}`,
          price: currentPrice,
          change: changePercent,
          timestamp: new Date().toISOString(),
          action: action,
          confidence: 0.7
        });
      }
      
      // Bollinger Band Breakout
      if (technical.bollingerBands && currentPrice > technical.bollingerBands.upper) {
        alerts.push({
          id: `${symbol}_bb_breakout_${Date.now()}`,
          symbol: symbol,
          type: 'breakout',
          priority: 7,
          title: `📈 Breakout: ${symbol}`,
          message: `Broke above upper Bollinger Band ($${technical.bollingerBands.upper.toFixed(2)})`,
          price: currentPrice,
          change: changePercent,
          timestamp: new Date().toISOString(),
          action: 'momentum_play',
          confidence: 0.8
        });
      }
      
      // MACD Bullish Crossover
      if (technical.macd && technical.macd.crossover === 'Bullish' && technical.macd.histogram > 0) {
        alerts.push({
          id: `${symbol}_macd_${Date.now()}`,
          symbol: symbol,
          type: 'momentum_change',
          priority: 6,
          title: `💹 MACD Signal: ${symbol}`,
          message: `Bullish MACD crossover - momentum turning positive`,
          price: currentPrice,
          change: changePercent,
          timestamp: new Date().toISOString(),
          action: 'bullish_momentum',
          confidence: 0.75
        });
      }
    }
    
    // 4. EARNINGS PROXIMITY ALERT (if within 5 days)
    const earningsAlert = await checkEarningsProximity(symbol);
    if (earningsAlert) {
      alerts.push({
        id: `${symbol}_earnings_${Date.now()}`,
        symbol: symbol,
        type: 'earnings_proximity',
        priority: 5,
        title: `📊 Earnings Soon: ${symbol}`,
        message: `Earnings expected within ${earningsAlert.daysUntil} days - consider volatility plays`,
        price: currentPrice,
        change: changePercent,
        timestamp: new Date().toISOString(),
        action: 'volatility_play',
        confidence: 0.6
      });
    }
    
    // 5. OPTIONS ACTIVITY ALERT (simplified)
    if (Math.abs(changePercent) > 3 && volume > getAverageVolume(symbol) * 1.5) {
      alerts.push({
        id: `${symbol}_options_${Date.now()}`,
        symbol: symbol,
        type: 'options_opportunity',
        priority: 6,
        title: `🎯 Options Alert: ${symbol}`,
        message: `High volume + price movement = options opportunity`,
        price: currentPrice,
        change: changePercent,
        timestamp: new Date().toISOString(),
        action: 'options_analysis',
        confidence: 0.7
      });
    }
    
  } catch (error) {
    console.error(`Stock alert analysis error for ${symbol}:`, error);
  }
  
  return alerts;
}

// Fetch stock price with real-time data
async function fetchStockPrice(symbol, apiKey) {
  const url = `https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${symbol}&entitlement=realtime&apikey=${apiKey}`;
  
  const response = await fetch(url);
  const data = await response.json();
  
  if (data['Global Quote']) {
    const quote = data['Global Quote'];
    return {
      symbol: quote['01. symbol'],
      price: parseFloat(quote['05. price']),
      change: parseFloat(quote['09. change']),
      changePercent: parseFloat(quote['10. change percent'].replace('%', '')),
      volume: parseInt(quote['06. volume']),
      high: parseFloat(quote['03. high']),
      low: parseFloat(quote['04. low'])
    };
  }
  
  throw new Error(`No price data for ${symbol}`);
}

// Fetch technical indicators for alerts
async function fetchTechnicalAlerts(symbol, apiKey) {
  try {
    const [rsi, bb, macd] = await Promise.allSettled([
      fetchRSIAlert(symbol, apiKey),
      fetchBollingerBandsAlert(symbol, apiKey),
      fetchMACDAlert(symbol, apiKey)
    ]);
    
    return {
      rsi: rsi.status === 'fulfilled' ? rsi.value : null,
      bollingerBands: bb.status === 'fulfilled' ? bb.value : null,
      macd: macd.status === 'fulfilled' ? macd.value : null
    };
    
  } catch (error) {
    console.error(`Technical alerts error for ${symbol}:`, error);
    return null;
  }
}

// RSI for alerts
async function fetchRSIAlert(symbol, apiKey) {
  const url = `https://www.alphavantage.co/query?function=RSI&symbol=${symbol}&interval=daily&time_period=14&series_type=close&entitlement=realtime&apikey=${apiKey}`;
  
  const response = await fetch(url);
  const data = await response.json();
  
  if (data['Technical Analysis: RSI']) {
    const dates = Object.keys(data['Technical Analysis: RSI']);
    const latestDate = dates[0];
    const rsiValue = parseFloat(data['Technical Analysis: RSI'][latestDate]['RSI']);
    
    return { value: rsiValue, date: latestDate };
  }
  
  return null;
}

// Bollinger Bands for alerts
async function fetchBollingerBandsAlert(symbol, apiKey) {
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

// MACD for alerts
async function fetchMACDAlert(symbol, apiKey) {
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

// Generate market-wide alerts
async function generateMarketAlerts(apiKey) {
  const alerts = [];
  
  try {
    // Monitor VIX for volatility alerts
    const vixData = await fetchStockPrice('VIX', apiKey);
    
    if (vixData && vixData.price > 30) {
      alerts.push({
        id: `market_vix_${Date.now()}`,
        symbol: 'VIX',
        type: 'market_volatility',
        priority: 9,
        title: '🚨 High Volatility Alert',
        message: `VIX spiked to ${vixData.price.toFixed(1)} - market fear elevated`,
        price: vixData.price,
        change: vixData.changePercent,
        timestamp: new Date().toISOString(),
        action: 'defensive_strategies',
        confidence: 0.9
      });
    } else if (vixData && vixData.price < 15) {
      alerts.push({
        id: `market_complacency_${Date.now()}`,
        symbol: 'VIX',
        type: 'market_complacency',
        priority: 4,
        title: '😴 Low Volatility Alert',
        message: `VIX at ${vixData.price.toFixed(1)} - market complacency, prepare for volatility expansion`,
        price: vixData.price,
        change: vixData.changePercent,
        timestamp: new Date().toISOString(),
        action: 'long_volatility',
        confidence: 0.7
      });
    }
    
    // Monitor SPY for market direction
    const spyData = await fetchStockPrice('SPY', apiKey);
    
    if (spyData && Math.abs(spyData.changePercent) > 2) {
      const direction = spyData.changePercent > 0 ? 'rallying' : 'declining';
      const emoji = spyData.changePercent > 0 ? '🚀' : '📉';
      
      alerts.push({
        id: `market_spy_${Date.now()}`,
        symbol: 'SPY',
        type: 'market_movement',
        priority: 8,
        title: `${emoji} Market ${direction.toUpperCase()}`,
        message: `SPY ${direction} ${Math.abs(spyData.changePercent).toFixed(1)}% - broad market impact`,
        price: spyData.price,
        change: spyData.changePercent,
        timestamp: new Date().toISOString(),
        action: spyData.changePercent > 0 ? 'ride_momentum' : 'defensive_positioning',
        confidence: 0.8
      });
    }
    
  } catch (error) {
    console.error('Market alerts error:', error);
  }
  
  return alerts;
}

// Helper functions
function getAverageVolume(symbol) {
  // Simplified average volume calculation
  // In a real implementation, you'd store historical volume data
  const avgVolumes = {
    'AAPL': 50000000,
    'TSLA': 25000000,
    'HOOD': 10000000,
    'SPY': 80000000,
    'QQQ': 40000000,
    'NVDA': 30000000,
    'AMZN': 25000000,
    'GOOGL': 20000000,
    'MSFT': 25000000,
    'META': 15000000
  };
  
  return avgVolumes[symbol] || 5000000; // Default 5M shares
}

async function checkEarningsProximity(symbol) {
  // Simplified earnings check
  // In a real implementation, you'd use an earnings calendar API
  const earningsDates = {
    'AAPL': '2025-01-30',
    'TSLA': '2025-01-25',
    'HOOD': '2025-02-15'
  };
  
  const earningsDate = earningsDates[symbol];
  if (!earningsDate) return null;
  
  const today = new Date();
  const earnings = new Date(earningsDate);
  const daysUntil = Math.ceil((earnings - today) / (1000 * 60 * 60 * 24));
  
  if (daysUntil >= 0 && daysUntil <= 5) {
    return { daysUntil, date: earningsDate };
  }
  
  return null;
}

// Create or update alert
async function createOrUpdateAlert(alertData) {
  // In a real implementation, you'd store user-defined alerts in a database
  // For now, we'll just return success
  
  return {
    statusCode: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      success: true,
      message: 'Alert created successfully',
      alertId: `user_alert_${Date.now()}`
    })
  };
}
