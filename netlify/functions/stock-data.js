// netlify/functions/stock-data.js - DEBUG VERSION
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

    // Get API key from environment variables
    const API_KEY = process.env.ALPHA_VANTAGE_API_KEY;
    
    console.log('=== DEBUG INFO ===');
    console.log('API Key exists:', !!API_KEY);
    console.log('API Key length:', API_KEY ? API_KEY.length : 0);
    console.log('API Key first 4 chars:', API_KEY ? API_KEY.substring(0, 4) : 'NONE');
    console.log('Symbol requested:', symbol);
    
    if (!API_KEY) {
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ 
          error: 'ALPHA_VANTAGE_API_KEY environment variable not set in Netlify',
          debug: 'Check Netlify Site Settings → Environment Variables',
          variableName: 'ALPHA_VANTAGE_API_KEY'
        })
      };
    }

    // Use Alpha Vantage API
    const url = `https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${symbol}&apikey=${API_KEY}`;
    
    console.log('Making API request to Alpha Vantage...');
    
    const response = await fetch(url);
    const data = await response.json();
    
    console.log('API Response received:', Object.keys(data));
    
    // Debug: Log the response
    if (data['Error Message']) {
      console.log('Alpha Vantage Error:', data['Error Message']);
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ 
          error: `Alpha Vantage Error: ${data['Error Message']}`,
          debug: 'Invalid symbol or API issue',
          symbol: symbol
        })
      };
    }
    
    if (data['Note']) {
      console.log('Alpha Vantage Note:', data['Note']);
      return {
        statusCode: 429,
        headers,
        body: JSON.stringify({ 
          error: 'API rate limit reached',
          details: data['Note'],
          debug: 'Your premium plan may have limits or key might be basic tier'
        })
      };
    }

    const quote = data['Global Quote'];
    if (!quote || !quote['01. symbol']) {
      console.log('No quote data found:', data);
      return {
        statusCode: 404,
        headers,
        body: JSON.stringify({ 
          error: `No data available for symbol: ${symbol}`,
          debug: 'Verify symbol is correct',
          rawResponse: data
        })
      };
    }

    // Format stock data
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
      lastRefreshed: quote['07. latest trading day'],
      debug: 'SUCCESS - Premium Alpha Vantage data loaded'
    };

    console.log('Success! Stock data formatted for:', symbol);

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(stockInfo)
    };

  } catch (error) {
    console.error('Function Error:', error);
    
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        error: `Function error: ${error.message}`,
        debug: 'Check function logs in Netlify',
        stack: error.stack
      })
    };
  }
};
