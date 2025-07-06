// netlify/functions/alpaca-data.js
exports.handler = async (event, context) => {
  // Handle CORS
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS'
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  // For now, return a placeholder since Alpaca needs more setup
  return {
    statusCode: 200,
    headers,
    body: JSON.stringify({ 
      message: 'Alpaca integration coming soon',
      fallback: true 
    })
  };
};