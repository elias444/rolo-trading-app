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

    const ALPACA_API_KEY = process.env.ALPACA_API_KEY;
    const ALPACA_SECRET_KEY = process.env.ALPACA_SECRET_KEY;

    if (!ALPACA_API_KEY || !ALPACA_SECRET_KEY) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ 
          error: 'Alpaca keys not found',
          fallback: true
        })
      };
    }

    // Get stock data from Alpaca
    const response = await fetch(`https://paper-api.alpaca.markets/v2/stocks/${symbol}/bars/latest`, {
      headers: {
        'APCA-API-KEY-ID': ALPACA_API_KEY,
        'APCA-API-SECRET-KEY': ALPACA_SECRET_KEY
      }
    });

    if (!response.ok) {
      throw new Error('Alpaca API failed');
    }

    const data = await response.json();
    const bar = data.bar;
    
    // Format exactly like your existing app expects
    const stockInfo = {
      symbol: symbol,
      price: bar.c.toFixed(2),
      change: (bar.c - bar.pc).toFixed(2),
      changePercent: (((bar.c - bar.pc) / bar.pc) * 100).toFixed(2),
      volume: (bar.v / 1000000).toFixed(1),
      high: bar.h.toFixed(2),
      low: bar.l.toFixed(2),
      open: bar.o.toFixed(2),
      prevClose: bar.pc.toFixed(2),
      isLive: true,
      source: 'alpaca',
      timestamp: new Date().toISOString()
    };

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(stockInfo)
    };

  } catch (error) {
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        error: 'Alpaca data failed',
        fallback: true
      })
    };
  }
};
