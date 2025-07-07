// netlify/functions/stock-data.js - PRODUCTION VERSION WITH PREMIUM ALPHA VANTAGE
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
    const { symbol } = event.queryStringParameters;
    
    if (!symbol) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Symbol parameter required' })
      };
    }

    // Get PREMIUM API key from environment variables
    const API_KEY = process.env.ALPHA_VANTAGE_API_KEY;
    
    if (!API_KEY) {
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ 
          error: 'Alpha Vantage API key not configured. Please set ALPHA_VANTAGE_API_KEY environment variable.' 
        })
      };
    }

    // Use PREMIUM Alpha Vantage endpoint for REAL-TIME data
    const url = `https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${symbol}&apikey=${API_KEY}`;
    
    console.log(`Fetching real-time data for ${symbol} with premium API`);
    
    const response = await fetch(url);
    const data = await response.json();
    
    // Handle API errors properly
    if (data['Error Message']) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ 
          error: `Alpha Vantage Error: ${data['Error Message']}`,
          symbol: symbol
        })
      };
    }
    
    if (data['Note']) {
      return {
        statusCode: 429,
        headers,
        body: JSON.stringify({ 
          error: 'API rate limit reached. Your premium plan may need upgrading.',
          details: data['Note']
        })
      };
    }

    const quote = data['Global Quote'];
    if (!quote || !quote['01. symbol']) {
      return {
        statusCode: 404,
        headers,
        body: JSON.stringify({ 
          error: `No real-time data available for symbol: ${symbol}. Verify symbol is correct.`,
          symbol: symbol
        })
      };
    }

    // Format real-time stock data
    const stockInfo = {
      symbol: quote['01. symbol'],
      price: parseFloat(quote['05. price']).toFixed(2),
      change: parseFloat(quote['09. change']).toFixed(2),
      changePercent: parseFloat(quote['10. change percent'].replace('%', '')).toFixed(2),
      volume: (parseFloat(quote['06. volume']) / 1000000).toFixed(1),
      high: parseFloat(quote['03. high']).toFixed(2),
      low: parseFloat(quote['04. low']).toFixed(2),
      open: parseFloat(quote['02. open']).toFixed(2),
      prevClose: parseFloat(quote['08. previous close']).toFixed(2),
      isLive: true,
      isPremium: true,
      timestamp: new Date().toISOString(),
      lastRefreshed: quote['07. latest trading day']
    };

    console.log(`Successfully fetched premium data for ${symbol}: $${stockInfo.price}`);

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(stockInfo)
    };

  } catch (error) {
    console.error('Premium Alpha Vantage API Error:', error);
    
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        error: `Unable to fetch premium stock data: ${error.message}`,
        troubleshooting: 'Check Alpha Vantage premium API status and your API key validity',
        isPremium: true
      })
    };
  }
};
