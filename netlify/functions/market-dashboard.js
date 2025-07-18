// netlify/functions/market-dashboard.js
// Detailed market data fetch with session detection.

exports.handler = async (event, context) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Content-Type': 'application/json'
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  const API_KEY = process.env.ALPHA_VANTAGE_API_KEY;
  if (!API_KEY) {
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: "API key not configured" })
    };
  }

  try {
    // Session detection
    const now = new Date();
    const estTime = new Date(now.toLocaleString("en-US", {timeZone: "America/New_York"}));
    const hour = estTime.getHours();
    const dayOfWeek = estTime.getDay();
    
    let session = 'CLOSED';
    if (dayOfWeek >= 1 && dayOfWeek <= 5) {
      if (hour >= 4 && hour < 9) session = 'PRE_MARKET';
      else if (hour >= 9 && hour < 16) session = 'OPEN';
      else if (hour >= 16 && hour <= 20) session = 'AFTER_HOURS';
      else session = 'FUTURES_OPEN';
    } else if (dayOfWeek === 0 && hour >= 18) {
      session = 'FUTURES_OPEN';
    }

    // Fetch indices (real-time proxies)
    const indicesSymbols = ['SPY', 'QQQ', 'DIA'];
    const indices = {};
    for (const sym of indicesSymbols) {
      const url = `https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${sym}&apikey=${API_KEY}`;
      const response = await fetch(url);
      const data = await response.json();
      indices[sym.toLowerCase()] = data['Global Quote'];
    }

    // Fetch futures
    const futuresSymbols = ['ES=F', 'NQ=F', 'YM=F', 'RTY=F'];
    const futures = {};
    for (const sym of futuresSymbols) {
      const url = `https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${sym}&apikey=${API_KEY}`;
      const response = await fetch(url);
      const data = await response.json();
      futures[sym.toLowerCase()] = data['Global Quote'];
    }

    // Fetch pre-market movers (top gainers in pre-market)
    let preMarketMovers = [];
    if (session === 'PRE_MARKET') {
      const moversUrl = `https://www.alphavantage.co/query?function=TOP_GAINERS_LOSERS&apikey=${API_KEY}`;
      const moversResponse = await fetch(moversUrl);
      const moversData = await moversResponse.json();
      preMarketMovers = moversData.top_gainers.slice(0, 4); // Top 4
    }

    // Fetch economic indicators
    const economicResponse = await fetch('/.netlify/functions/economic-indicators');
    const economicData = await economicResponse.json();

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        sp500: indices.spy,
        nasdaq: indices.qqq,
        dowJones: indices.dia,
        futures: futures,
        preMarketMovers,
        economic: economicData,
        session
      })
    };
  } catch (error) {
    console.error('Error in market-dashboard:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Market data error' })
    };
  }
};
