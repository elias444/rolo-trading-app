// netlify/functions/gemini-chat.js
const { GoogleGenerativeAI } = require('@google/generative-ai');

exports.handler = async (event, context) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS'
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    const { message, history } = JSON.parse(event.body || '{}');

    if (!message) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Message is required' })
      };
    }

    const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

    if (!GEMINI_API_KEY) {
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({
          error: 'Gemini API key not configured',
          setup: 'Add GEMINI_API_KEY to Netlify environment variables'
        })
      };
    }

    const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-pro" });

    // Prepare chat history if provided
    const chatHistory = history ? history.map(msg => ({
      role: msg.type === 'user' ? 'user' : 'model',
      parts: [{ text: msg.content }]
    })) : [];

    const chat = model.startChat({
      history: chatHistory,
      generationConfig: {
        maxOutputTokens: 2000,
      },
    });

    const result = await chat.sendMessage(message);
    const response = await result.response;
    const text = response.text();

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        response: text,
        source: 'Gemini AI'
      })
    };

  } catch (error) {
    console.error('Gemini chat function error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: 'Sorry, I encountered an error. Please try again.',
        details: error.message
      })
    };
  }
};
