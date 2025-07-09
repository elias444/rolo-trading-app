// netlify/functions/stock-data.js
// CLEAN VERSION - ZERO MOCK DATA - ALPHA VANTAGE REAL-TIME ONLY

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
  
  if (!symbol) {
    return {
      statusCode: 400,
      headers,
      body: JSON.stringify({ 
        error: 'Symbol parameter is required',
        timestamp: new Date().toISOString()
      })
    };
  }

  try {
    console.log(`🎯 Fetching real-time data for ${symbol} from Alpha Vantage...`);
    
    // Your premium Alpha Vantage API key
    const API_KEY = 'MAQEUTLGYYXC1HF1';
    
    // Real-time API call with entitlement
    const stockData = await getRealTimeStockData(symbol, API_KEY);
    
    console.log(`✅ Success: ${symbol} = $${stockData.price}`);

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(stockData)
    };

  } catch (error) {
    console.error(`❌ Error for ${symbol}:`, error.message);
    
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: `Could not find data for ${symbol}. Please verify the ticker symbol.`,
        symbol: symbol,
        timestamp: new Date().toISOString(),
        details: error.message
      })
    };
  }
};

// Get real-time stock data from Alpha Vantage (NO MOCK DATA)
async function getRealTimeStockData(symbol, apiKey) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8000);
  
  try {
    // Real-time entitlement URL
    const url = `https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${symbol}&entitlement=realtime&apikey=${apiKey}`;
    
    console.log(`📡 Calling Alpha Vantage for ${symbol}...`);
    
    const response = await fetch(url, { signal: controller.signal });
    clearTimeout(timeout);
    
    if (!response.ok) {
      throw new Error(`Alpha Vantage API error: ${response.status}`);
    }
    
    const data = await response.json();
    
    if (data['Error Message']) {
      throw new Error(`Invalid ticker symbol: ${symbol}`);
    }
    
    if (data['Note']) {
      throw new Error('API rate limit reached - please try again in a moment');
    }
    
    const quote = data['Global Quote'];
    if (!quote || !quote['05. price']) {
      throw new Error(`No price data available for ${symbol}`);
    }

    // Return real data only - NO MOCK/FAKE DATA
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
      isRealTime: true
    };

  } catch (error) {
    clearTimeout(timeout);
    throw error;
  }
}
