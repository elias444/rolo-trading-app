// netlify/functions/stock-data.js - FIXED FOR CORRECT PRICES
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
    
    console.log('=== STOCK PRICE DEBUG ===');
    console.log('Requested symbol:', symbol);
    console.log('API Key exists:', !!API_KEY);
    console.log('API Key first 8 chars:', API_KEY ? API_KEY.substring(0, 8) + '...' : 'MISSING');

    if (!API_KEY) {
      console.log('❌ No Alpha Vantage API key found in environment variables');
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ 
          error: 'ALPHA_VANTAGE_API_KEY environment variable not set',
          symbol: symbol,
          isDemo: true
        })
      };
    }

    // 🚀 PREMIUM REAL-TIME ENDPOINT
    const realtimeUrl = `https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${symbol}&apikey=${API_KEY}`;
    console.log('Calling Alpha Vantage URL:', realtimeUrl.replace(API_KEY, 'HIDDEN_KEY'));

    const response = await fetch(realtimeUrl);
    const data = await response.json();
    
    console.log('Raw API Response:', JSON.stringify(data, null, 2));

    // Check for API errors
    if (data['Error Message']) {
      console.log('❌ API Error:', data['Error Message']);
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ 
          error: data['Error Message'],
          symbol: symbol,
          suggestion: 'Check if ticker symbol is valid'
        })
      };
    }

    if (data['Note']) {
      console.log('⚠️ API Rate Limited:', data['Note']);
      return {
        statusCode: 429,
        headers,
        body: JSON.stringify({ 
          error: 'API rate limited - please wait and try again',
          details: data['Note'],
          symbol: symbol
        })
      };
    }

    // Extract stock data from Global Quote
    const quote = data['Global Quote'];
    if (!quote) {
      console.log('❌ No Global Quote found in response');
      console.log('Available response keys:', Object.keys(data));
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ 
          error: 'No quote data found in API response',
          symbol: symbol,
          rawData: data
        })
      };
    }

    // 📊 PARSE REAL PRICE DATA
    const price = parseFloat(quote['05. price']);
    const change = parseFloat(quote['09. change']);
    const changePercent = quote['10. change percent']?.replace('%', '');
    const volume = parseInt(quote['06. volume']) / 1000000; // Convert to millions
    const high = parseFloat(quote['03. high']);
    const low = parseFloat(quote['04. low']);
    const open = parseFloat(quote['02. open']);

    console.log('=== PARSED PRICE DATA ===');
    console.log('Raw price from API:', quote['05. price']);
    console.log('Parsed price:', price);
    console.log('Change:', change);
    console.log('Change %:', changePercent);
    console.log('Volume (millions):', volume);

    // Validate the price data
    if (isNaN(price) || price <= 0) {
      console.log('❌ Invalid price data received');
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ 
          error: 'Invalid price data from API',
          receivedPrice: quote['05. price'],
          symbol: symbol
        })
      };
    }

    // 🎯 RETURN CORRECT PRICE DATA
    const result = {
      symbol: symbol.toUpperCase(),
      price: price.toFixed(2),
      change: change.toFixed(2),
      changePercent: parseFloat(changePercent).toFixed(2),
      volume: volume.toFixed(1),
      high: high.toFixed(2),
      low: low.toFixed(2),
      open: open.toFixed(2),
      timestamp: new Date().toISOString(),
      source: 'Alpha Vantage Premium',
      isLive: true,
      isDemo: false
    };

    console.log('=== FINAL RESULT ===');
    console.log('Returning to app:', JSON.stringify(result, null, 2));
    console.log('=== END DEBUG ===');

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(result)
    };

  } catch (error) {
    console.error('❌ Stock data error:', error);
    
    // Return error info but don't break the app
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: `Stock data failed: ${error.message}`,
        symbol: event.queryStringParameters?.symbol?.toUpperCase() || 'UNKNOWN',
        isDemo: true,
        suggestion: 'Check network connection and API key'
      })
    };
  }
};
