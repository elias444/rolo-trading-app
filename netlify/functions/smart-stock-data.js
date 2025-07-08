// netlify/functions/smart-stock-data.js
// SMART STOCK DATA - REAL-TIME ALPHA VANTAGE WITH TECHNICAL INDICATORS

exports.handler = async (event, context) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, OPTIONS'
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  const symbol = event.queryStringParameters?.symbol;
  const entitlement = event.queryStringParameters?.entitlement || 'realtime';
  
  if (!symbol) {
    return {
      statusCode: 400,
      headers,
      body: JSON.stringify({ 
        error: 'Symbol parameter is required'
      })
    };
  }

  try {
    console.log(`Fetching REAL-TIME data for ${symbol} from Alpha Vantage...`);
    
    // Your premium Alpha Vantage API key
    const API_KEY = 'MAQEUTLGYYXC1HF1';
    
    // Get real-time stock data
    const stockData = await getRealTimeStockData(symbol, API_KEY, entitlement);
    
    // Get technical indicators
    const technicalData = await getTechnicalIndicators(symbol, API_KEY, entitlement);
    
    // Combine all data
    const enrichedData = {
      ...stockData,
      ...technicalData,
      timestamp: new Date().toISOString(),
      source: 'Alpha Vantage Premium',
      entitlement: entitlement,
      isRealTime: entitlement === 'realtime'
    };

    console.log(`✅ Real-time data for ${symbol}: $${enrichedData.price}`);

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(enrichedData)
    };

  } catch (error) {
    console.error(`Smart stock data error for ${symbol}:`, error);
    
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: 'Failed to fetch real-time stock data',
        details: error.message,
        symbol: symbol,
        timestamp: new Date().toISOString()
      })
    };
  }
};

// Get real-time stock data from Alpha Vantage
async function getRealTimeStockData(symbol, apiKey, entitlement) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8000);
  
  try {
    const quoteUrl = `https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${symbol}&entitlement=${entitlement}&apikey=${apiKey}`;
    
    const response = await fetch(quoteUrl, { signal: controller.signal });
    clearTimeout(timeout);
    
    if (!response.ok) {
      throw new Error(`Alpha Vantage API error: ${response.status}`);
    }
    
    const data = await response.json();
    
    if (data['Error Message']) {
      throw new Error(data['Error Message']);
    }
    
    if (data['Note']) {
      throw new Error('API rate limit reached');
    }
    
    const quote = data['Global Quote'];
    if (!quote || !quote['05. price']) {
      throw new Error(`No price data available for ${symbol}`);
    }

    return {
      symbol: symbol.toUpperCase(),
      price: parseFloat(quote['05. price']),
      change: parseFloat(quote['09. change']),
      changePercent: quote['10. change percent'],
      volume: parseInt(quote['06. volume']) || 0,
      previousClose: parseFloat(quote['08. previous close']),
      open: parseFloat(quote['02. open']),
      high: parseFloat(quote['03. high']),
      low: parseFloat(quote['04. low']),
      lastUpdated: quote['07. latest trading day']
    };
    
  } catch (error) {
    if (error.name === 'AbortError') {
      throw new Error('Request timeout');
    }
    throw error;
  }
}

// Get technical indicators from Alpha Vantage
async function getTechnicalIndicators(symbol, apiKey, entitlement) {
  const indicators = {};
  
  try {
    // RSI (14-period)
    const rsiData = await fetchIndicator('RSI', symbol, apiKey, entitlement, {
      interval: 'daily',
      time_period: 14,
      series_type: 'close'
    });
    
    // MACD
    const macdData = await fetchIndicator('MACD', symbol, apiKey, entitlement, {
      interval: 'daily',
      series_type: 'close'
    });
    
    // SMA (20-period)
    const smaData = await fetchIndicator('SMA', symbol, apiKey, entitlement, {
      interval: 'daily',
      time_period: 20,
      series_type: 'close'
    });
    
    // EMA (12-period)
    const emaData = await fetchIndicator('EMA', symbol, apiKey, entitlement, {
      interval: 'daily',
      time_period: 12,
      series_type: 'close'
    });
    
    return {
      rsi: rsiData,
      macd: macdData,
      sma20: smaData,
      ema12: emaData
    };
    
  } catch (error) {
    console.log('Technical indicators error:', error.message);
    return {
      rsi: null,
      macd: null,
      sma20: null,
      ema12: null
    };
  }
}

// Fetch individual technical indicator
async function fetchIndicator(indicator, symbol, apiKey, entitlement, params) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 6000);
  
  try {
    const paramString = Object.entries(params)
      .map(([key, value]) => `${key}=${value}`)
      .join('&');
    
    const url = `https://www.alphavantage.co/query?function=${indicator}&symbol=${symbol}&${paramString}&entitlement=${entitlement}&apikey=${apiKey}`;
    
    const response = await fetch(url, { signal: controller.signal });
    clearTimeout(timeout);
    
    if (!response.ok) {
      throw new Error(`${indicator} API error: ${response.status}`);
    }
    
    const data = await response.json();
    
    if (data['Error Message'] || data['Note']) {
      throw new Error('Rate limit or error');
    }
    
    // Extract the latest value from the technical indicator data
    const technicalKey = `Technical Analysis: ${indicator}`;
    const indicatorData = data[technicalKey];
    
    if (!indicatorData) {
      throw new Error(`No ${indicator} data available`);
    }
    
    // Get the most recent date's value
    const dates = Object.keys(indicatorData).sort().reverse();
    const latestDate = dates[0];
    const latestData = indicatorData[latestDate];
    
    if (indicator === 'RSI') {
      return parseFloat(latestData.RSI);
    } else if (indicator === 'MACD') {
      return {
        macd: parseFloat(latestData.MACD),
        signal: parseFloat(latestData.MACD_Signal),
        histogram: parseFloat(latestData.MACD_Hist)
      };
    } else if (indicator === 'SMA') {
      return parseFloat(latestData.SMA);
    } else if (indicator === 'EMA') {
      return parseFloat(latestData.EMA);
    }
    
    return latestData;
    
  } catch (error) {
    if (error.name === 'AbortError') {
      throw new Error(`${indicator} request timeout`);
    }
    throw error;
  }
}
