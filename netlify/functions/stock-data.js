// netlify/functions/stock-data.js
// WORKING VERSION - Uses your real-time Alpha Vantage API properly

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
        error: 'Symbol parameter is required'
      })
    };
  }

  try {
    console.log(`Fetching data for ${symbol}...`);
    
    // Use environment variable or fallback to your working key
    const API_KEY = process.env.ALPHA_VANTAGE_API_KEY || 'MAQEUTLGYYXC1HF1';
    
    // THIS IS THE EXACT URL FORMAT THAT WORKS FOR YOU
    const url = `https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${symbol}&entitlement=realtime&apikey=${API_KEY}`;
    
    console.log(`Calling Alpha Vantage for ${symbol}...`);
    
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    
    // Check for API errors
    if (data['Error Message']) {
      return {
        statusCode: 404,
        headers,
        body: JSON.stringify({
          error: `Could not find data for ${symbol}. Please verify the ticker symbol.`
        })
      };
    }
    
    if (data['Note']) {
      return {
        statusCode: 429,
        headers,
        body: JSON.stringify({
          error: 'API rate limit reached. Please try again in a moment.'
        })
      };
    }
    
    const quote = data['Global Quote'];
    if (!quote || !quote['05. price']) {
      return {
        statusCode: 404,
        headers,
        body: JSON.stringify({
          error: `No price data available for ${symbol}.`
        })
      };
    }

    // Return the same data format your direct test gives you
    const stockData = {
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

    console.log(`Success: ${symbol} = $${stockData.price}`);

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(stockData)
    };

  } catch (error) {
    console.error(`Error for ${symbol}:`, error);
    
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: `Failed to fetch data for ${symbol}. Please try again.`,
        details: error.message
      })
    };
  }
};
