// Clean Stock Data Function - ZERO Mock Data
exports.handler = async (event, context) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Content-Type': 'application/json'
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  try {
    const symbol = event.queryStringParameters?.symbol;
    
    if (!symbol) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Symbol parameter required' })
      };
    }

    // Get real stock data from Alpha Vantage ONLY
    const stockData = await getAlphaVantageData(symbol);
    
    if (!stockData) {
      return {
        statusCode: 404,
        headers,
        body: JSON.stringify({ 
          error: `Unable to find data for ${symbol}. Please verify the ticker symbol and try again.`,
          symbol: symbol
        })
      };
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        price: stockData,
        timestamp: new Date().toISOString(),
        source: 'Alpha Vantage Premium',
        isLive: !stockData.isDelayed
      })
    };

  } catch (error) {
    console.error('Stock data error:', error);
    
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        error: 'Unable to fetch stock data at this time. Please try again.',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      })
    };
  }
};

// Get Alpha Vantage stock data with premium access
async function getAlphaVantageData(symbol) {
  try {
    const API_KEY = process.env.ALPHA_VANTAGE_API_KEY || 'MAQEUTLGYYXC1HF1';
    
    // Try realtime data first (your premium access)
    let url = `https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${symbol}&entitlement=realtime&apikey=${API_KEY}`;
    
    let response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`Alpha Vantage API error: ${response.status}`);
    }
    
    let data = await response.json();
    let quote = data['Global Quote'];
    
    // If realtime fails, try delayed data
    if (!quote || Object.keys(quote).length === 0) {
      console.log(`Realtime data unavailable for ${symbol}, trying delayed...`);
      
      url = `https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${symbol}&entitlement=delayed&apikey=${API_KEY}`;
      response = await fetch(url);
      data = await response.json();
      quote = data['Global Quote'];
      
      if (!quote || Object.keys(quote).length === 0) {
        console.log(`No data available for ${symbol}`);
        return null;
      }
      
      return formatQuoteData(quote, true); // Mark as delayed
    }
    
    return formatQuoteData(quote, false); // Mark as realtime
    
  } catch (error) {
    console.error('Alpha Vantage error:', error);
    return null;
  }
}

// Format quote data consistently
function formatQuoteData(quote, isDelayed) {
  try {
    return {
      symbol: quote['01. symbol'],
      price: parseFloat(quote['05. price']),
      change: parseFloat(quote['09. change']),
      changePercent: parseFloat(quote['10. change percent'].replace('%', '')),
      volume: parseInt(quote['06. volume']) || 0,
      high: parseFloat(quote['03. high']),
      low: parseFloat(quote['04. low']),
      open: parseFloat(quote['02. open']),
      previousClose: parseFloat(quote['08. previous close']),
      isDelayed: isDelayed,
      lastUpdate: new Date().toISOString(),
      dataSource: isDelayed ? 'Alpha Vantage (15-min delayed)' : 'Alpha Vantage (Realtime)'
    };
  } catch (error) {
    console.error('Error formatting quote data:', error);
    return null;
  }
}
