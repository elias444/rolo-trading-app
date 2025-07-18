// netlify/functions/realtime-alerts.js
// Calls comprehensive-ai-analysis for alerts type, filters valid high-confidence alerts, returns empty if none.

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

  try {
    const response = await fetch('/.netlify/functions/comprehensive-ai-analysis', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'alerts' }),
    });
    
    if (response.ok) {
      const data = await response.json();
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          alerts: data.analysis.alerts || [],
          marketSession: data.marketData.session,
          timestamp: data.timestamp,
          dataQuality: data.dataQuality
        })
      };
    } else {
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ error: 'Alerts generation error' })
      };
    }
  } catch (error) {
    console.error('Error in realtime-alerts:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Alerts error', alerts: [] })
    };
  }
};
