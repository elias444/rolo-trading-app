// netlify/functions/enhanced-rolo-chat.js
// Gemini-based chat function for conversational AI.

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

  const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

  if (!GEMINI_API_KEY) {
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: "Gemini API key not configured" })
    };
  }

  try {
    // Fetch real-time data for context (stock, market, analysis, plays, alerts)
    const stockResponse = await fetch(`${process.env.URL}/.netlify/functions/enhanced-stock-data?symbol=${context.selectedStock}`);
    const stockData = await stockResponse.json();

    const analysisResponse = await fetch(`${process.env.URL}/.netlify/functions/comprehensive-ai-analysis`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ symbol: context.selectedStock, type: 'analysis' }),
    });
    const analysisData = await analysisResponse.json();

    const playsResponse = await fetch(`${process.env.URL}/.netlify/functions/comprehensive-ai-analysis`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'smartplays' }),
    });
    const playsData = await playsResponse.json();

    const alertsResponse = await fetch(`${process.env.URL}/.netlify/functions/comprehensive-ai-analysis`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'alerts' }),
    });
    const alertsData = await alertsResponse.json();

    const marketResponse = await fetch(`${process.env.URL}/.netlify/functions/market-dashboard`);
    const marketData2 = await marketResponse.json();

    const newsResponse = await fetch(`${process.env.URL}/.netlify/functions/news-data`);
    const newsData = await newsResponse.json();

    const technicalResponse = await fetch(`${process.env.URL}/.netlify/functions/technical-indicators?symbol=${context.selectedStock}`);
    const technicalData = await technicalResponse.json();

    const optionsResponse = await fetch(`${process.env.URL}/.netlify/functions/options-data?symbol=${context.selectedStock}`);
    const optionsData = await optionsResponse.json();

    // Construct detailed prompt with all real data
    const prompt = `You are Rolo AI with full access to real-time data. Respond to: "${message}". Use this data: stock: ${JSON.stringify(stockData)}, analysis: ${JSON.stringify(analysisData)}, plays: ${JSON.stringify(playsData)}, alerts: ${JSON.stringify(alertsData)}, market: ${JSON.stringify(marketData2)}, news: ${JSON.stringify(newsData)}, technical: ${JSON.stringify(technicalData)}, options: ${JSON.stringify(optionsData)}. Market status: ${context.marketStatus}. Active tab: ${context.activeTab}. Provide accurate, current info without disclaimers about no access.`;

    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`;
    const geminiResponse = await fetch(geminiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }]
      })
    });
    const geminiData = await geminiResponse.json();
    const generatedResponse = geminiData.candidates[0].content.parts[0].text;

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
