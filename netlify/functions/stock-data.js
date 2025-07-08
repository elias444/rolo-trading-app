// netlify/functions/stock-data.js
// CLEAN VERSION - NO MOCK DATA ANYWHERE
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
    const { symbol } = event.queryStringParameters || {};
    
    if (!symbol) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ 
          error: 'Stock symbol parameter required' 
        })
      };
    }

    // Get API key from environment variables
    const API_KEY = process.env.ALPHA_VANTAGE_API_KEY;
    
    if (!API_KEY) {
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ 
          error: 'Alpha Vantage API key not configured in Netlify environment variables',
          suggestion: 'Add ALPHA_VANTAGE_API_KEY to your Netlify site settings'
        })
      };
    }

    console.log(`Fetching real data for ${symbol} using Alpha Vantage API...`);
    
    // Fetch real stock data from Alpha Vantage
    const alphaUrl = `https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${symbol}&apikey=${API_KEY}`;
    const response = await fetch(alphaUrl);
    
    if (!response.ok) {
      throw new Error(`Alpha Vantage API error: HTTP ${response.status}`);
    }
    
    const data = await response.json();
    
    // Check for API errors
    if (data.Note) {
      return {
        statusCode: 429,
        headers,
        body: JSON.stringify({ 
          error: 'API rate limit exceeded. Please try again in a moment.',
          note: data.Note
        })
      };
    }
    
    if (data.Information) {
      return {
        statusCode: 429,
        headers,
        body: JSON.stringify({ 
          error: 'API rate limit or invalid request.',
          information: data.Information
        })
      };
    }
    
    if (data['Error Message']) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ 
          error: `Invalid stock symbol: ${symbol}`,
          message: data['Error Message']
        })
      };
    }

    // Extract real quote data
    const quote = data['Global Quote'];
    
    if (!quote || Object.keys(quote).length === 0) {
      return {
        statusCode: 404,
        headers,
        body: JSON.stringify({ 
          error: `No data available for symbol: ${symbol}`,
          suggestion: 'Please check if the symbol is valid and markets are open'
        })
      };
    }
    
    // Return ONLY real data
    const stockInfo = {
      symbol: quote['01. symbol'],
      price: parseFloat(quote['05. price']).toFixed(2),
      change: parseFloat(quote['09. change']).toFixed(2),
      changePercent: parseFloat(quote['10. change percent'].replace('%', '')).toFixed(2),
      volume: (parseFloat(quote['06. volume']) / 1000000).toFixed(1) + 'M',
      high: parseFloat(quote['03. high']).toFixed(2),
      low: parseFloat(quote['04. low']).toFixed(2),
      open: parseFloat(quote['02. open']).toFixed(2),
      prevClose: parseFloat(quote['08. previous close']).toFixed(2),
      lastRefreshed: quote['07. latest trading day'],
      source: 'Alpha Vantage',
      isLive: true,
      isReal: true
    };

    console.log(`✅ Real data retrieved for ${symbol}: $${stockInfo.price}`);

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(stockInfo)
    };

  } catch (error) {
    console.error('Stock API Error:', error);
    
    // Return error - NO MOCK DATA fallback
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        error: `Failed to fetch real stock data: ${error.message}`,
        isReal: false,
        suggestion: 'Please check your API key and try again later'
      })
    };
  }
};
