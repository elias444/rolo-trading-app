// netlify/functions/market-dashboard.js
// MARKET DASHBOARD - NASDAQ, DOW JONES, FUTURES DATA

exports.handler = async (event, context) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, OPTIONS'
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  try {
    console.log('🌍 Loading market dashboard data...');
    
    const API_KEY = 'MAQEUTLGYYXC1HF1';
    
    // Market indices and futures symbols
    const symbols = {
      indices: {
        'SPY': 'S&P 500',
        'QQQ': 'NASDAQ', 
        'DIA': 'DOW JONES',
        'VIX': 'VIX'
      },
      futures: {
        'ES=F': 'ES (S&P FUTURES)',
        'NQ=F': 'NQ (NASDAQ FUTURES)'
      }
    };
    
    // Load all market data
    const [indicesData, futuresData] = await Promise.all([
      loadMarketIndices(symbols.indices, API_KEY),
      loadFuturesData(symbols.futures, API_KEY)
    ]);
    
    const marketData = {
      indices: indicesData,
      futures: futuresData,
      timestamp: new Date().toISOString(),
      source: 'Alpha Vantage Real-Time'
    };
    
    console.log('✅ Market dashboard data loaded successfully');
    
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(marketData)
    };

  } catch (error) {
    console.error('❌ Market dashboard error:', error);
    
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: 'Failed to load market data',
        details: error.message,
        timestamp: new Date().toISOString()
      })
    };
  }
};

// Load market indices data
async function loadMarketIndices(indices, apiKey) {
  const results = {};
  
  for (const [symbol, name] of Object.entries(indices)) {
    try {
      console.log(`📊 Loading ${name} (${symbol})...`);
      const data = await getQuoteData(symbol, apiKey);
      results[symbol] = { ...data, name };
    } catch (error) {
      console.error(`❌ Error loading ${symbol}:`, error.message);
      results[symbol] = {
        name,
        error: error.message,
        symbol
      };
    }
  }
  
  return results;
}

// Load futures data
async function loadFuturesData(futures, apiKey) {
  const results = {};
  
  for (const [symbol, name] of Object.entries(futures)) {
    try {
      console.log(`📈 Loading ${name} (${symbol})...`);
      // For futures, we'll use ETF proxies since direct futures data might not be available
      const proxySymbol = symbol === 'ES=F' ? 'SPY' : 'QQQ';
      const data = await getQuoteData(proxySymbol, apiKey);
      results[symbol] = { 
        ...data, 
        name,
        isFuture: true,
        note: `Based on ${proxySymbol} proxy` 
      };
    } catch (error) {
      console.error(`❌ Error loading futures ${symbol}:`, error.message);
      results[symbol] = {
        name,
        error: error.message,
        symbol,
        isFuture: true
      };
    }
  }
  
  return results;
}

// Get quote data from Alpha Vantage
async function getQuoteData(symbol, apiKey) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10000);
  
  try {
    const url = `https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${symbol}&entitlement=realtime&apikey=${apiKey}`;
    
    const response = await fetch(url, { signal: controller.signal });
    clearTimeout(timeout);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
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
      throw new Error(`No quote data available for ${symbol}`);
    }

    return {
      symbol: symbol.toUpperCase(),
      price: parseFloat(quote['05. price']).toFixed(2),
      change: parseFloat(quote['09. change']).toFixed(2),
      changePercent: quote['10. change percent'],
      volume: parseInt(quote['06. volume']).toLocaleString(),
      high: parseFloat(quote['03. high']).toFixed(2),
      low: parseFloat(quote['04. low']).toFixed(2),
      open: parseFloat(quote['02. open']).toFixed(2),
      previousClose: parseFloat(quote['08. previous close']).toFixed(2),
      lastUpdated: quote['07. latest trading day'],
      isRealTime: true
    };

  } catch (error) {
    clearTimeout(timeout);
    throw error;
  }
}
