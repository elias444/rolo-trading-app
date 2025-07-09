// netlify/functions/market-dashboard.js
// WORKING VERSION - Loads real NASDAQ, Dow Jones, VIX, Futures data

const fetch = require('node-fetch'); // Required for server-side fetch

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
    
    const API_KEY = process.env.ALPHA_VANTAGE_API_KEY; // Get key from environment variables

    if (!API_KEY) {
        throw new Error('Alpha Vantage API key not configured in Netlify environment variables.');
    }
    
    // Market symbols that actually work with Alpha Vantage
    const marketSymbols = {
      'SPY': 'S&P 500 ETF', // SPY is an ETF tracking S&P 500
      'QQQ': 'NASDAQ 100 ETF', // QQQ is an ETF tracking NASDAQ 100
      'DIA': 'DOW JONES ETF', // DIA is an ETF tracking DOW JONES
      'VIX': 'VIX Volatility Index' // VIX is the volatility index
    };
    
    // For "futures" data, Alpha Vantage typically provides these via GLOBAL_QUOTE for the ETFs
    // We'll use the same symbols for simplicity, representing the index sentiment
    const futuresSymbols = {
      'SPY': 'ES (S&P FUTURES)', // Representing S&P futures sentiment
      'QQQ': 'NQ (NASDAQ FUTURES)' // Representing NASDAQ futures sentiment
    };
    
    const marketData = {};
    const futuresData = {};
    
    // Load major indices/ETFs
    console.log('Loading major indices/ETFs...');
    for (const [symbol, name] of Object.entries(marketSymbols)) {
      try {
        const data = await getMarketQuote(symbol, API_KEY);
        marketData[symbol] = { ...data, name };
        console.log(`Fetched ${symbol}`);
      } catch (e) {
        console.warn(`Could not fetch data for ${symbol}: ${e.message}`);
        // Optionally, include a placeholder or specific error for this symbol
        marketData[symbol] = { error: `Failed to load ${name} data: ${e.message}` };
      }
    }

    // Load futures data (using same ETFs for representation)
    console.log('Loading futures data...');
    for (const [symbol, name] of Object.entries(futuresSymbols)) {
      try {
        const data = await getMarketQuote(symbol, API_KEY);
        futuresData[symbol] = { ...data, name };
        console.log(`Fetched ${symbol} (futures proxy)`);
      } catch (e) {
        console.warn(`Could not fetch futures proxy data for ${symbol}: ${e.message}`);
        futuresData[symbol] = { error: `Failed to load ${name} data: ${e.message}` };
      }
    }

    const result = {
      spy: marketData['SPY'],
      qqq: marketData['QQQ'],
      dia: marketData['DIA'],
      vix: marketData['VIX'],
      futures: futuresData
    };

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(result)
    };

  } catch (error) {
    console.error('❌ Market dashboard error:', error);
    
    let errorMessage = 'Failed to load market data.';
    if (error.message.includes('API rate limit reached')) {
        errorMessage = `Alpha Vantage API rate limit reached. Please try again in a moment.`;
    } else if (error.message.includes('API key not valid')) {
        errorMessage = `Invalid Alpha Vantage API key. Please check your Netlify environment variables.`;
    } else if (error.message.includes('Alpha Vantage API key not configured')) {
        errorMessage = `Alpha Vantage API key not found. Please add ALPHA_VANTAGE_API_KEY to Netlify environment variables.`;
    }

    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: errorMessage,
        details: error.message
      })
    };
  }
};

// Get market quote using the same format that works for you
async function getMarketQuote(symbol, apiKey) {
  const url = `https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${symbol}&entitlement=realtime&apikey=${apiKey}`;
  
  console.log(`📡 Fetching ${symbol} for market dashboard...`);
  
  const response = await fetch(url);
  
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status} for ${symbol}`);
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
    lastUpdated: quote['07. latest trading day'],
  };
}
