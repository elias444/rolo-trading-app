// netlify/functions/enhanced-rolo-chat.js
// ADD THIS AS A NEW FILE - makes Rolo AI smarter and more conversational
// Works alongside your existing claude-chat.js as an upgrade

const { GoogleGenerativeAI } = require("@google/generative-ai");
const fetch = require('node-fetch'); // Required for server-side fetch

exports.handler = async (event, context) => {
    const headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Content-Type': 'application/json'
    };

    if (event.httpMethod === 'OPTIONS') {
        return { statusCode: 200, headers, body: '' };
    }

    try {
        const { message, context: userContext } = JSON.parse(event.body || '{}');
        
        if (!message) {
            return {
                statusCode: 400,
                headers,
                body: JSON.stringify({ error: 'Message is required' })
            };
        }

        const API_KEY = process.env.GEMINI_API_KEY; // Use the environment variable

        if (!API_KEY) {
            return {
                statusCode: 500,
                headers,
                body: JSON.stringify({ error: 'Gemini API key not configured in Netlify environment variables.' })
            };
        }

        const genAI = new GoogleGenerativeAI(API_KEY);
        const model = genAI.getGenerativeModel({ model: "gemini-pro" });

        // Build the prompt for the AI
        let prompt = `You are Rolo AI, a highly intelligent and helpful trading assistant. You are designed to provide accurate, concise, and professional responses related to stock markets, trading, and finance. You can analyze tickers, explain strategies, and provide market insights.
        
        Current market context (if available, otherwise state 'Current market context not available'):
        ${userContext || 'No specific market context provided. I will use general knowledge.'}
        
        User's question: "${message}"
        
        Provide a detailed and helpful response. If the user asks about a specific stock, briefly mention its current status (e.g., 'AAPL is currently trading around $XXX'). Keep responses professional and do not give financial advice.`;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();

        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({ 
                response: text,
                source: 'enhanced-rolo-ai',
                timestamp: new Date().toISOString()
            })
        };

    } catch (error) {
        console.error('Enhanced Rolo chat error:', error);
        // Provide a more user-friendly error message for the frontend
        let userErrorMessage = 'Enhanced chat temporarily unavailable. Please try again in a moment.';
        if (error.message.includes('API key not valid')) {
            userErrorMessage = 'Error: Gemini API key is invalid or expired. Please check your Netlify environment variables.';
        } else if (error.message.includes('quota')) {
            userErrorMessage = 'Error: Gemini API quota exceeded. Please try again later or check your API usage.';
        }
        
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({ 
                error: userErrorMessage,
                details: error.message // For developer debugging
            })
        };
    }
};
