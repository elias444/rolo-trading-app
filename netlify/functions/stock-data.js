// netlify/functions/stock-data.js - REAL-TIME VERSION
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

    const API_KEY = process.env.ALPHA_VANTAGE_API_KEY;
    
    if (!API_KEY) {
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ 
          error: 'ALPHA_VANTAGE_API_KEY environment variable not set in Netlify'
        })
      };
    }

    // REAL-TIME Alpha Vantage API with entitlement=realtime
    const url = `https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${symbol}&entitlement=realtime&apikey=${API_KEY}`;
    
    console.log(`Fetching REAL-TIME data for ${symbol}`);
    
    const response = await fetch(url);
    const data = await response.json();
    
    if (data['Error Message']) {
      console.log('Alpha Vantage Error:', data['Error Message']);
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
      console.log('Alpha Vantage Rate Limit:', data['Note']);
      return {
        statusCode: 429,
        headers,
        body: JSON.stringify({ 
          error: 'API rate limit reached',
          details: data['Note']
        })
      };
    }

    const quote = data['Global Quote'];
    if (!quote || !quote['01. symbol']) {
      console.log('No quote data found');
      return {
        statusCode: 404,
        headers,
        body: JSON.stringify({ 
          error: `No real-time data available for symbol: ${symbol}`,
          symbol: symbol
        })
      };
    }

    // Format REAL-TIME stock data
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
      isRealTime: true, // NEW: Indicates real-time data
      timestamp: new Date().toISOString(),
      lastRefreshed: quote['07. latest trading day'],
      dataSource: 'Alpha Vantage Real-Time'
    };

    console.log(`✅ REAL-TIME data loaded for ${symbol}: $${stockInfo.price}`);

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(stockInfo)
    };

  } catch (error) {
    console.error('Real-time API Error:', error);
    
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        error: `Unable to fetch real-time data: ${error.message}`,
        troubleshooting: 'Check Alpha Vantage real-time entitlements'
      })
    };
  }
};
