// netlify/functions/enhanced-rolo-chat.js (updated for Grok API)
exports.handler = async (event) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Content-Type': 'application/json'
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  const body = JSON.parse(event.body);
  const { message, context } = body;

  const GROK_API_KEY = process.env.GROK_API_KEY;

  if (!GROK_API_KEY) {
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: "Grok API key not configured" })
    };
  }

  try {
    // Fetch real-time data for context (stock, market, analysis, plays, alerts)
    const stockResponse = await fetch(`/.netlify/functions/enhanced-stock-data?symbol=${context.selectedStock}`);
    const stockData = await stockResponse.json();

    const analysisResponse = await fetch('/.netlify/functions/comprehensive-ai-analysis', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ symbol: context.selectedStock, type: 'analysis' }),
    });
    const analysisData = await analysisResponse.json();

    const playsResponse = await fetch('/.netlify/functions/comprehensive-ai-analysis', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'smartplays' }),
    });
    const playsData = await playsResponse.json();

    const alertsResponse = await fetch('/.netlify/functions/comprehensive-ai-analysis', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'alerts' }),
    });
    const alertsData = await alertsResponse.json();

    const marketResponse = await fetch('/.netlify/functions/market-dashboard');
    const marketData2 = await marketResponse.json();

    const newsResponse = await fetch('/.netlify/functions/news-data');
    const newsData = await newsResponse.json();

    const technicalResponse = await fetch(`/.netlify/functions/technical-indicators?symbol=${context.selectedStock}`);
    const technicalData = await technicalResponse.json();

    const optionsResponse = await fetch(`/.netlify/functions/options-data?symbol=${context.selectedStock}`);
    const optionsData = await optionsResponse.json();

    // Construct detailed prompt with all real data
    const prompt = `You are Rolo AI with full access to real-time data. Respond to: "${message}". Use this data: stock: ${JSON.stringify(stockData)}, analysis: ${JSON.stringify(analysisData)}, plays: ${JSON.stringify(playsData)}, alerts: ${JSON.stringify(alertsData)}, market: ${JSON.stringify(marketData2)}, news: ${JSON.stringify(newsData)}, technical: ${JSON.stringify(technicalData)}, options: ${JSON.stringify(optionsData)}. Market status: ${context.marketStatus}. Active tab: ${context.activeTab}. Provide accurate, current info without disclaimers about no access.`;

    const grokUrl = `https://api.grok.xai/v1/chat/completions`;
    const grokResponse = await fetch(grokUrl, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${GROK_API_KEY}`
      },
      body: JSON.stringify({
        model: "grok-beta",
        messages: [{ role: "user", content: prompt }]
      })
    });
    const grokData = await grokResponse.json();
    const generatedResponse = grokData.choices[0].message.content;

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ response: generatedResponse })
    };
  } catch (error) {
    console.error('Error in enhanced-rolo-chat:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Chat error' })
    };
  }
};
