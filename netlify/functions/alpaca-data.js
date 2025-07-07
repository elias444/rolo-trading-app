// netlify/functions/alpaca-data.js - REAL ALPACA INTEGRATION
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
    // Get Alpaca credentials from environment variables
    const ALPACA_API_KEY = process.env.ALPACA_API_KEY;
    const ALPACA_SECRET_KEY = process.env.ALPACA_SECRET_KEY;
    const ALPACA_BASE_URL = process.env.ALPACA_BASE_URL || 'https://paper-api.alpaca.markets';

    if (!ALPACA_API_KEY || !ALPACA_SECRET_KEY) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ 
          error: 'Alpaca API credentials not configured. Please set ALPACA_API_KEY and ALPACA_SECRET_KEY environment variables.' 
        })
      };
    }

    // Example: Get account info
    const response = await fetch(`${ALPACA_BASE_URL}/v2/account`, {
      headers: {
        'APCA-API-KEY-ID': ALPACA_API_KEY,
        'APCA-API-SECRET-KEY': ALPACA_SECRET_KEY
      }
    });

    if (!response.ok) {
      throw new Error(`Alpaca API error: ${response.status}`);
    }

    const accountData = await response.json();

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ 
        account: accountData,
        message: 'Alpaca integration working!',
        isLive: true
      })
    };

  } catch (error) {
    console.error('Alpaca API Error:', error);
    
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        error: `Alpaca connection failed: ${error.message}`,
        fallback: false 
      })
    };
  }
};
