// netlify/functions/gemini-chat.js
const { GoogleGenerativeAI } = require("@google/generative-ai");

exports.handler = async (event, context) => {
    const headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Content-Type': 'application/json'
    };

    // Handle OPTIONS preflight request
    if (event.httpMethod === 'OPTIONS') {
        return { statusCode: 200, headers, body: '' };
    }

    if (event.httpMethod !== 'POST') {
        return {
            statusCode: 405,
            headers,
            body: JSON.stringify({ error: 'Method Not Allowed', message: 'Only POST requests are allowed.' })
        };
    }

    try {
        const { message, history } = JSON.parse(event.body || '{}');

        if (!message) {
            return {
                statusCode: 400,
                headers,
                body: JSON.stringify({ error: 'Bad Request', message: 'Message content is required.' })
            };
        }

        // IMPORTANT: Get your Gemini API key from environment variables
        // You will set this in Netlify settings later.
        const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

        if (!GEMINI_API_KEY) {
            console.error("GEMINI_API_KEY is not set in environment variables.");
            return {
                statusCode: 500,
                headers,
                body: JSON.stringify({
                    error: 'Server Configuration Error',
                    message: 'Gemini API Key is not configured. Please set GEMINI_API_KEY in Netlify environment variables.'
                })
            };
        }

        const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
        const model = genAI.getGenerativeModel({ model: "gemini-pro" }); // Using gemini-pro for general chat

        // Start a chat session with provided history
        const chat = model.startChat({
            history: history || [], // Use provided history, or an empty array if none
            generationConfig: {
                maxOutputTokens: 2000, // Adjust as needed
            },
        });

        // Send the new message
        const result = await chat.sendMessage(message);
        const response = await result.response;
        const text = response.text();

        console.log("Gemini response:", text);

        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({
                response: text,
                source: 'Gemini AI',
                timestamp: new Date().toISOString()
            })
        };

    } catch (error) {
        console.error('Error in gemini-chat function:', error);

        // Check for common API errors to give more specific feedback
        let errorMessage = 'An unexpected error occurred.';
        if (error.response && error.response.status) {
            if (error.response.status === 429) {
                errorMessage = 'Gemini API rate limit exceeded. Please try again in a moment.';
            } else if (error.response.status === 403) {
                errorMessage = 'Gemini API access denied. Check your API key and project settings.';
            } else {
                errorMessage = `Gemini API error: ${error.response.status} - ${error.message}`;
            }
        } else if (error.message.includes('API key')) {
             errorMessage = 'Invalid or expired Gemini API key. Please check your Netlify environment variables.';
        } else {
            errorMessage = `An unexpected error occurred: ${error.message}`;
        }


        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({
                error: 'AI Communication Error',
                message: errorMessage,
                details: error.message // Include error details for debugging
            })
        };
    }
};
