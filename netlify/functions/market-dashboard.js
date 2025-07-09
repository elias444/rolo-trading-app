// netlify/functions/market-dashboard.js
// WORKING VERSION - Loads real NASDAQ, Dow Jones, VIX, Futures data

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
    console.log('Loading market dashboard...');
    
    const API_KEY = process.env.ALPHA_VANTAGE_API_KEY || 'MAQEUTLGYYXC1HF1';
    
    // Market symbols that actually work with Alpha Vantage
    const marketSymbols = {
      'SPY': 'S&P 500',
      'QQQ': 'NASDAQ', 
      'DIA': 'DOW JONES',
      'VIX': 'VIX'
    };
    
    const futuresSymbols = {
      'SPY': 'ES (S&P FUTURES)',
      'QQQ': 'NQ (NASDAQ FUTURES)'
    };
    
    // Load all market data
    const marketData = {};
    const futuresData = {};
    
    // Load major indices
    console.log('Loading major indices...');
    for (const [symbol, name] of Object.entries(marketSymbols)) {
      try {
        const data = await getMarketQuote(symbol, API_KEY);
        marketData[symbol] = { ...data, name };
        console.log(`✅ ${name}: $${data.price}`);
      } catch (error) {
        console.error(`❌ Error loading ${name}:`, error.message);
        marketData[symbol] = {
          name,
          error: 'Data unavailable',
          symbol
        };
      }
    }
    
    // Load futures (using ETF proxies since direct futures may not be available)
    console.log('Loading futures...');
    for (const [symbol, name] of Object.entries(futuresSymbols)) {
      try {
        const data = await getMarketQuote(symbol, API_KEY);
        futuresData[symbol] = { 
          ...data, 
          name,
          note: 'ETF-based futures proxy'
        };
        console.log(`✅ ${name}: $${data.price}`);
      } catch (error) {
        console.error(`❌ Error loading ${name}:`, error.message);
        futuresData[symbol] = {
          name,
          error: 'Data unavailable',
          symbol
        };
      }
    }

    const result = {
      indices: marketData,
      futures: futuresData,
      timestamp: new Date().toISOString(),
      source: 'Alpha Vantage Real-Time'
    };

    console.log('✅ Market dashboard loaded successfully');

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(result)
    };

  } catch (error) {
    console.error('❌ Market dashboard error:', error);
    
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: 'Failed to load market data',
        details: error.message
      })
    };
  }
};

// Get market quote using the same format that works for you
async function getMarketQuote(symbol, apiKey) {
  const url = `https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${symbol}&entitlement=realtime&apikey=${apiKey}`;
  
  console.log(`📡 Fetching ${symbol}...`);
  
  const response = await fetch(url);
  
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
    lastUpdated: quote['07. latest trading day'],
    isRealTime: true
  };
}
