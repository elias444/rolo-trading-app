// netlify/functions/stock-data.js - REAL DATA ONLY
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

    const API_KEY = 'MAQEUTLGYYXC1HF1';
    const url = `https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${symbol}&apikey=${API_KEY}`;
    
    const response = await fetch(url);
    const data = await response.json();
    
    if (data['Error Message']) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: data['Error Message'] })
      };
    }
    
    if (data['Note']) {
      return {
        statusCode: 429,
        headers,
        body: JSON.stringify({ error: 'API rate limit reached. Please try again in a moment.' })
      };
    }

    const quote = data['Global Quote'];
    if (!quote || !quote['01. symbol']) {
      return {
        statusCode: 404,
        headers,
        body: JSON.stringify({ error: `No data found for symbol: ${symbol}` })
      };
    }

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
      timestamp: new Date().toISOString()
    };

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(stockInfo)
    };

  } catch (error) {
    console.error('Stock API Error:', error);
    
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        error: `Unable to fetch real stock data: ${error.message}`,
        troubleshooting: 'Check Alpha Vantage API status and rate limits'
      })
    };
  }
};
