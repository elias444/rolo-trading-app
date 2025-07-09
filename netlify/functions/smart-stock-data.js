// netlify/functions/smart-stock-data.js
// REAL-TIME ALPHA VANTAGE STOCK DATA WITH TECHNICAL INDICATORS

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

  const symbol = event.queryStringParameters?.symbol;
  const entitlement = event.queryStringParameters?.entitlement || 'realtime'; // Default to 'realtime'
  
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
    
    // Your premium Alpha Vantage API key from Netlify environment variables
    const API_KEY = process.env.ALPHA_VANTAGE_API_KEY;

    if (!API_KEY) {
        throw new Error('Alpha Vantage API key not configured in Netlify environment variables.');
    }
    
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
    
    let errorMessage = `Failed to fetch data for ${symbol}.`;
    if (error.message.includes('API rate limit reached')) {
        errorMessage = `Alpha Vantage API rate limit reached. Please try again in a moment.`;
    } else if (error.message.includes('API key not valid')) {
        errorMessage = `Invalid Alpha Vantage API key. Please check your Netlify environment variables.`;
    } else if (error.message.includes('No quote data')) {
        errorMessage = `Could not find data for ticker ${symbol}. Please check the symbol.`;
    } else if (error.message.includes('Alpha Vantage API key not configured')) {
        errorMessage = `Alpha Vantage API key not found. Please add ALPHA_VANTAGE_API_KEY to Netlify environment variables.`;
    }
    
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        error: errorMessage,
        details: error.message // Include full error for debugging
      })
    };
  }
};

async function getRealTimeStockData(symbol, apiKey, entitlement) {
  // Use GLOBAL_QUOTE for real-time data
  const quoteUrl = `https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${symbol}&entitlement=${entitlement}&apikey=${apiKey}`;
  
  // Implement a timeout for the fetch request
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10000); // 10 second timeout

  console.log(`Calling Alpha Vantage Global Quote for ${symbol}. URL (partial): ${quoteUrl.replace(apiKey, 'API_KEY')}`);
    
  const response = await fetch(quoteUrl, { signal: controller.signal });
  clearTimeout(timeout); // Clear the timeout if the fetch completes in time
  
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
    throw new Error(`No quote data available for ${symbol}`);
  }

  return {
    symbol: symbol.toUpperCase(),
    price: parseFloat(quote['05. price']).toFixed(2),
    change: parseFloat(quote['09. change']).toFixed(2),
    changePercent: quote['10. change percent'],
    volume: parseInt(quote['06. volume']).toLocaleString(), // Format with commas
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
}
