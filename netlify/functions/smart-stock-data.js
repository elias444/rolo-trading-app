// netlify/functions/smart-stock-data.js
// REAL-TIME ALPHA VANTAGE STOCK DATA WITH TECHNICAL INDICATORS

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
    console.log(`🎯 Fetching REAL-TIME data for ${symbol} from Alpha Vantage...`);
    
    // Your premium Alpha Vantage API key
    const API_KEY = 'MAQEUTLGYYXC1HF1';
    
    // Get real-time stock data
    const stockData = await getRealTimeStockData(symbol, API_KEY, entitlement);
    
    console.log(`✅ Real-time data for ${symbol}: $${stockData.price}`);

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(stockData)
    };

  } catch (error) {
    console.error(`❌ Smart stock data error for ${symbol}:`, error);
    
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
    
    console.log(`📡 Calling Alpha Vantage: ${quoteUrl.replace(apiKey, 'API_KEY')}`);
    
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
      price: parseFloat(quote['05. price']).toFixed(2),
      change: parseFloat(quote['09. change']).toFixed(2),
      changePercent: quote['10. change percent'],
      volume: parseInt(quote['06. volume']).toLocaleString(),
      high: parseFloat(quote['03. high']).toFixed(2),
      low: parseFloat(quote['04. low']).toFixed(2),
      open: parseFloat(quote['02. open']).toFixed(2),
      previousClose: parseFloat(quote['08. previous close']).toFixed(2),
      lastUpdated: quote['07. latest trading day'],
      timestamp: new Date().toISOString(),
      source: 'Alpha Vantage Real-Time',
      entitlement: entitlement,
      isRealTime: entitlement === 'realtime'
    };

  } catch (error) {
    clearTimeout(timeout);
    console.error(`❌ Error fetching data for ${symbol}:`, error);
    throw error;
  }
}
