// netlify/functions/stock-data.js
// ZERO MOCK DATA - ALPHA VANTAGE ONLY

exports.handler = async (event, context) => {
  // Handle CORS
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
    const symbol = event.queryStringParameters?.symbol?.toUpperCase();
    
    if (!symbol) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Symbol parameter required' })
      };
    }

    // Get API key from environment
    const API_KEY = process.env.ALPHA_VANTAGE_API_KEY || 'MAQEUTLGYYXC1HF1';
    
    // Fetch real data from Alpha Vantage
    const url = `https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${symbol}&apikey=${API_KEY}`;
    
    console.log(`Fetching: ${url}`);
    
    const response = await fetch(url);
    const data = await response.json();
    
    console.log('Alpha Vantage response:', JSON.stringify(data, null, 2));
    
    // Check for API errors
    if (data.Note) {
      return {
        statusCode: 429,
        headers,
        body: JSON.stringify({ 
          error: 'API rate limit exceeded',
          message: 'Please try again in a moment'
        })
      };
    }
    
    if (data.Information) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ 
          error: 'Invalid API call',
          message: data.Information
        })
      };
    }
    
    // Parse the Global Quote data
    const quote = data['Global Quote'];
    
    if (!quote) {
      return {
        statusCode: 404,
        headers,
        body: JSON.stringify({ 
          error: 'Symbol not found',
          message: `No data available for ${symbol}`
        })
      };
    }
    
    // Extract real data - NO MOCK DATA
    const stockData = {
      symbol: quote['01. symbol'],
      price: quote['05. price'],
      change: quote['09. change'],
      changePercent: quote['10. change percent'].replace('%', ''),
      volume: quote['06. volume'],
      high: quote['03. high'],
      low: quote['04. low'],
      open: quote['02. open'],
      previousClose: quote['08. previous close'],
      timestamp: new Date().toISOString()
    };
    
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(stockData)
    };
    
  } catch (error) {
    console.error('Stock data error:', error);
    
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        error: 'Internal server error',
        message: 'Unable to fetch stock data'
      })
    };
  }
};
