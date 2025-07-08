// netlify/functions/stock-data.js
// CLEAN STOCK DATA FUNCTION - ALPHA VANTAGE ONLY, NO MOCK DATA

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
        error: 'Symbol parameter is required',
        example: '?symbol=AAPL'
      })
    };
  }

  try {
    console.log(`Fetching stock data for ${symbol}...`);
    
    // Check if Alpha Vantage API key exists
    if (!process.env.ALPHA_VANTAGE_API_KEY) {
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({
          error: 'Alpha Vantage API key not configured',
          symbol: symbol,
          timestamp: new Date().toISOString()
        })
      };
    }

    // Get real data from Alpha Vantage - NO MOCK DATA
    const alphaData = await getAlphaVantageData(symbol);
    
    if (alphaData) {
      console.log(`✅ Successfully fetched ${symbol}: $${alphaData.price}`);
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify(alphaData)
      };
    } else {
      // No fallback to mock data - return clear error
      return {
        statusCode: 404,
        headers,
        body: JSON.stringify({
          error: `No data available for ${symbol}`,
          message: 'This ticker may not exist or may not be supported',
          symbol: symbol,
          timestamp: new Date().toISOString()
        })
      };
    }

  } catch (error) {
    console.error(`Stock data error for ${symbol}:`, error);
    
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: 'Failed to fetch stock data',
        message: error.message,
        symbol: symbol,
        timestamp: new Date().toISOString()
      })
    };
  }
};

// Alpha Vantage API function - REAL DATA ONLY
async function getAlphaVantageData(symbol) {
  try {
    const apiKey = process.env.ALPHA_VANTAGE_API_KEY;
    
    console.log(`Calling Alpha Vantage for ${symbol}...`);
    
    // Get quote data with timeout
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000); // 8 second timeout
    
    const quoteUrl = `https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${symbol}&apikey=${apiKey}`;
    const quoteResponse = await fetch(quoteUrl, { signal: controller.signal });
    
    clearTimeout(timeout);
    
    if (!quoteResponse.ok) {
      throw new Error(`Alpha Vantage API error: HTTP ${quoteResponse.status}`);
    }
    
    const quoteData = await quoteResponse.json();
    
    // Check for API errors
    if (quoteData['Error Message']) {
      console.log('Alpha Vantage error:', quoteData['Error Message']);
      return null;
    }
    
    if (quoteData['Note']) {
      console.log('Alpha Vantage rate limit:', quoteData['Note']);
      return null;
    }
    
    const quote = quoteData['Global Quote'];
    if (!quote || !quote['05. price']) {
      console.log('No quote data received from Alpha Vantage');
      return null;
    }

    // Parse real data - NO MOCK VALUES
    const price = parseFloat(quote['05. price']);
    const change = parseFloat(quote['09. change']);
    const changePercent = quote['10. change percent'].replace('%', '');
    const volume = parseInt(quote['06. volume']);
    
    // Validate data quality
    if (isNaN(price) || price <= 0) {
      console.log('Invalid price data received:', quote['05. price']);
      return null;
    }

    // Return structured real data
    const result = {
      symbol: symbol.toUpperCase(),
      price: price,
      change: change,
      changePercent: changePercent + '%',
      volume: volume,
      previousClose: parseFloat(quote['08. previous close']),
      open: parseFloat(quote['02. open']),
      high: parseFloat(quote['03. high']),
      low: parseFloat(quote['04. low']),
      source: 'Alpha Vantage',
      timestamp: new Date().toISOString(),
      lastUpdated: quote['07. latest trading day'],
      isRealTime: true
    };
    
    console.log(`Alpha Vantage data for ${symbol}:`, result);
    return result;

  } catch (error) {
    if (error.name === 'AbortError') {
      console.log('Alpha Vantage request timed out for', symbol);
    } else {
      console.error('Alpha Vantage fetch error:', error);
    }
    return null;
  }
}
