// netlify/functions/market-conditions.js - LIVE MARKET DATA
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
    const FMP_API_KEY = process.env.FMP_API_KEY;
    
    if (!FMP_API_KEY) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'FMP API key not configured' })
      };
    }

    // Get market indices
    const indicesResponse = await fetch(
      `https://financialmodelingprep.com/api/v3/quote/^GSPC,^IXIC,^DJI,^VIX?apikey=${FMP_API_KEY}`
    );
    const indices = await indicesResponse.json();

    // Get sector performance
    const sectorsResponse = await fetch(
      `https://financialmodelingprep.com/api/v3/sector-performance?apikey=${FMP_API_KEY}`
    );
    const sectors = await sectorsResponse.json();

    // Get market news
    const newsResponse = await fetch(
      `https://financialmodelingprep.com/api/v3/stock_news?limit=10&apikey=${FMP_API_KEY}`
    );
    const news = await newsResponse.json();

    // Get economic calendar (today)
    const today = new Date().toISOString().split('T')[0];
    const calendarResponse = await fetch(
      `https://financialmodelingprep.com/api/v3/economic_calendar?from=${today}&to=${today}&apikey=${FMP_API_KEY}`
    );
    const calendar = await calendarResponse.json();

    // Format market conditions
    const marketConditions = {
      timestamp: new Date().toISOString(),
      indices: {
        sp500: indices.find(i => i.symbol === '^GSPC'),
        nasdaq: indices.find(i => i.symbol === '^IXIC'),
        dow: indices.find(i => i.symbol === '^DJI'),
        vix: indices.find(i => i.symbol === '^VIX')
      },
      sectors: sectors.slice(0, 5), // Top 5 sectors
      news: news.slice(0, 5), // Latest 5 news
      calendar: calendar.slice(0, 3), // Today's events
      sentiment: {
        fearGreed: calculateFearGreed(indices.find(i => i.symbol === '^VIX')),
        marketTrend: calculateMarketTrend(indices)
      }
    };

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(marketConditions)
    };

  } catch (error) {
    console.error('Market Conditions Error:', error);
    
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        error: `Unable to fetch market conditions: ${error.message}`
      })
    };
  }
};

// Helper functions
function calculateFearGreed(vix) {
  if (!vix) return 'Unknown';
  const vixValue = parseFloat(vix.price);
  
  if (vixValue < 15) return 'Extreme Greed';
  if (vixValue < 20) return 'Greed';
  if (vixValue < 25) return 'Neutral';
  if (vixValue < 30) return 'Fear';
  return 'Extreme Fear';
}

function calculateMarketTrend(indices) {
  const sp500 = indices.find(i => i.symbol === '^GSPC');
  if (!sp500) return 'Unknown';
  
  const change = parseFloat(sp500.changesPercentage);
  
  if (change > 1) return 'Strong Bullish';
  if (change > 0.5) return 'Bullish';
  if (change > -0.5) return 'Neutral';
  if (change > -1) return 'Bearish';
  return 'Strong Bearish';
}