// netlify/functions/stock-data.js
// FIXED - REAL ALPHA VANTAGE DATA ONLY

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
      body: JSON.stringify({ error: 'Symbol parameter required' })
    };
  }

  try {
    console.log(`Fetching ${symbol} from Alpha Vantage...`);

    if (!process.env.ALPHA_VANTAGE_API_KEY) {
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ error: 'Alpha Vantage API key not configured' })
      };
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);
    
    const url = `https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${symbol}&apikey=${process.env.ALPHA_VANTAGE_API_KEY}`;
    const response = await fetch(url, { signal: controller.signal });
    
    clearTimeout(timeout);

    if (!response.ok) {
      throw new Error(`Alpha Vantage API error: ${response.status}`);
    }

    const data = await response.json();
    
    if (data['Error Message']) {
      return {
        statusCode: 404,
        headers,
        body: JSON.stringify({ error: `Symbol "${symbol}" not found` })
      };
    }

    if (data['Note']) {
      return {
        statusCode: 429,
        headers,
        body: JSON.stringify({ error: 'API rate limit reached. Please try again later.' })
      };
    }

    const quote = data['Global Quote'];
    if (!quote || !quote['05. price']) {
      return {
        statusCode: 404,
        headers,
        body: JSON.stringify({ error: `No data available for ${symbol}` })
      };
    }

    const price = parseFloat(quote['05. price']);
    const change = parseFloat(quote['09. change']);
    
    if (isNaN(price) || price <= 0) {
      return {
        statusCode: 404,
        headers,
        body: JSON.stringify({ error: `Invalid price data for ${symbol}` })
      };
    }

    const result = {
      symbol: symbol.toUpperCase(),
      price: price,
      change: change,
      changePercent: quote['10. change percent'],
      volume: parseInt(quote['06. volume']) || 0,
      open: parseFloat(quote['02. open']),
      high: parseFloat(quote['03. high']),
      low: parseFloat(quote['04. low']),
      previousClose: parseFloat(quote['08. previous close']),
      lastUpdated: quote['07. latest trading day'],
      source: 'Alpha Vantage',
      timestamp: new Date().toISOString()
    };

    console.log(`✅ ${symbol}: $${price}`);

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(result)
    };

  } catch (error) {
    console.error(`Stock data error for ${symbol}:`, error.message);
    
    if (error.name === 'AbortError') {
      return {
        statusCode: 408,
        headers,
        body: JSON.stringify({ 
          error: 'Request timeout',
          symbol: symbol 
        })
      };
    }

    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        error: 'Failed to fetch stock data',
        symbol: symbol,
        details: error.message
      })
    };
  }
};
