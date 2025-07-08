// netlify/functions/options-data.js - PREMIUM OPTIONS DATA
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
          error: 'ALPHA_VANTAGE_API_KEY environment variable not set'
        })
      };
    }

    console.log(`🔍 Fetching options data for ${symbol}`);

    // 📊 PREMIUM OPTIONS ENDPOINT - Test multiple possible endpoints
    const optionsEndpoints = [
      `https://www.alphavantage.co/query?function=OPTION_CHAIN&symbol=${symbol}&apikey=${API_KEY}`,
      `https://www.alphavantage.co/query?function=REALTIME_OPTIONS&symbol=${symbol}&apikey=${API_KEY}`,
      `https://www.alphavantage.co/query?function=OPTIONS&symbol=${symbol}&apikey=${API_KEY}`
    ];

    let optionsData = null;
    let workingEndpoint = null;

    // Try each endpoint until one works
    for (let i = 0; i < optionsEndpoints.length; i++) {
      try {
        console.log(`Testing endpoint ${i + 1}: ${optionsEndpoints[i].split('&apikey=')[0]}`);
        
        const response = await fetch(optionsEndpoints[i]);
        const data = await response.json();
        
        // Check if this endpoint has real options data
        if (!data['Error Message'] && !data['Note'] && Object.keys(data).length > 2) {
          console.log(`✅ Found working options endpoint: ${i + 1}`);
          optionsData = data;
          workingEndpoint = i + 1;
          break;
        } else {
          console.log(`❌ Endpoint ${i + 1} failed:`, data['Error Message'] || data['Note'] || 'No data');
        }
        
        // Add delay between requests to avoid rate limiting
        if (i < optionsEndpoints.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 200));
        }
        
      } catch (error) {
        console.log(`❌ Endpoint ${i + 1} error:`, error.message);
      }
    }

    // If no options endpoint worked, return estimated options data
    if (!optionsData) {
      console.log('⚠️ No options endpoints available, generating estimated data');
      
      // Get stock price for estimates
      const stockUrl = `https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${symbol}&apikey=${API_KEY}`;
      const stockResponse = await fetch(stockUrl);
      const stockData = await stockResponse.json();
      
      const quote = stockData['Global Quote'];
      if (!quote) {
        return {
          statusCode: 404,
          headers,
          body: JSON.stringify({ 
            error: 'No options data available and unable to get stock price for estimates',
            symbol: symbol
          })
        };
      }

      const stockPrice = parseFloat(quote['05. price']);
      
      // Generate estimated options data based on stock price
      const estimatedOptions = generateEstimatedOptions(symbol, stockPrice);
      
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          symbol: symbol.toUpperCase(),
          stockPrice: stockPrice.toFixed(2),
          isEstimated: true,
          message: 'Options prices are estimated based on stock price and typical volatility',
          options: estimatedOptions,
          timestamp: new Date().toISOString()
        })
      };
    }

    // If we got real options data, format and return it
    console.log('✅ Returning real options data');
    
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        symbol: symbol.toUpperCase(),
        isEstimated: false,
        source: `Alpha Vantage Premium Endpoint ${workingEndpoint}`,
        options: optionsData,
        timestamp: new Date().toISOString()
      })
    };

  } catch (error) {
    console.error('❌ Options data error:', error);
    
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: `Options data failed: ${error.message}`,
        symbol: event.queryStringParameters?.symbol?.toUpperCase() || 'UNKNOWN'
      })
    };
  }
};

// 📊 HELPER FUNCTION: Generate estimated options data
function generateEstimatedOptions(symbol, stockPrice) {
  const nearExpiry = new Date();
  nearExpiry.setDate(nearExpiry.getDate() + 14); // 2 weeks
  
  const monthlyExpiry = new Date();
  monthlyExpiry.setMonth(monthlyExpiry.getMonth() + 1); // 1 month
  
  // Generate strikes around current price
  const strikes = [];
  const priceRound = Math.round(stockPrice);
  
  for (let i = -10; i <= 10; i += 5) {
    strikes.push(priceRound + i);
  }
  
  const estimatedChain = {
    calls: [],
    puts: []
  };
  
  strikes.forEach(strike => {
    const isITM_Call = strike < stockPrice;
    const isITM_Put = strike > stockPrice;
    
    // Simple Black-Scholes inspired estimation
    const intrinsicCall = Math.max(0, stockPrice - strike);
    const intrinsicPut = Math.max(0, strike - stockPrice);
    
    const timeValue = Math.abs(stockPrice - strike) * 0.02; // Rough estimate
    
    // Calls
    estimatedChain.calls.push({
      strike: strike,
      expiry: nearExpiry.toISOString().split('T')[0],
      bid: Math.max(0.01, (intrinsicCall + timeValue) * 0.95).toFixed(2),
      ask: (intrinsicCall + timeValue * 1.1).toFixed(2),
      volume: Math.floor(Math.random() * 1000),
      openInterest: Math.floor(Math.random() * 5000),
      isITM: isITM_Call
    });
    
    // Puts  
    estimatedChain.puts.push({
      strike: strike,
      expiry: nearExpiry.toISOString().split('T')[0],
      bid: Math.max(0.01, (intrinsicPut + timeValue) * 0.95).toFixed(2),
      ask: (intrinsicPut + timeValue * 1.1).toFixed(2),
      volume: Math.floor(Math.random() * 1000),
      openInterest: Math.floor(Math.random() * 5000),
      isITM: isITM_Put
    });
  });
  
  return estimatedChain;
}
