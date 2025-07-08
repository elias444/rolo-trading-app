// netlify/functions/stock-data.js - LIVE ALPHA VANTAGE PRICING RESTORED
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

    const API_KEY = process.env.ALPHA_VANTAGE_API_KEY || 'MAQEUTLGYYXC1HF1';
    
    console.log('=== LIVE STOCK DATA REQUEST ===');
    console.log('Symbol:', symbol);
    console.log('API Key exists:', !!API_KEY);
    console.log('Using key:', API_KEY.substring(0, 8) + '...');

    // 🚀 REAL-TIME Alpha Vantage API with premium entitlement
    const url = `https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${symbol}&entitlement=realtime&apikey=${API_KEY}`;
    
    console.log('Fetching LIVE data from Alpha Vantage...');
    
    const response = await fetch(url);
    const data = await response.json();
    
    console.log('API Response received:', Object.keys(data));
    
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
          details: data['Note'],
          symbol: symbol
        })
      };
    }

    const quote = data['Global Quote'];
    if (!quote || !quote['01. symbol']) {
      console.log('No quote data found for', symbol);
      return {
        statusCode: 404,
        headers,
        body: JSON.stringify({ 
          error: `No real-time data available for symbol: ${symbol}`,
          symbol: symbol
        })
      };
    }

    // 📊 EXTRACT LIVE STOCK DATA
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
      source: 'Alpha Vantage Premium'
    };

    console.log('=== LIVE STOCK DATA SUCCESS ===');
    console.log(`${stockInfo.symbol}: $${stockInfo.price} (${stockInfo.changePercent}%)`);
    console.log(`Volume: ${stockInfo.volume}M | High/Low: $${stockInfo.high}/$${stockInfo.low}`);

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(stockInfo)
    };

  } catch (error) {
    console.error('Stock data error:', error);
    
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: `Stock data failed: ${error.message}`,
        symbol: event.queryStringParameters?.symbol?.toUpperCase() || 'UNKNOWN',
        isLive: false,
        suggestion: 'Check network connection and API key'
      })
    };
  }
};
