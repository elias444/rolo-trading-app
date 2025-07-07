// netlify/functions/claude-chat.js - CURRENT CONTEXT VERSION
exports.handler = async (event, context) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS'
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
    const { message } = JSON.parse(event.body);
    
    if (!message) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Message required' })
      };
    }

    const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
    
    if (!ANTHROPIC_API_KEY) {
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ 
          error: 'Claude API key not configured. Please add ANTHROPIC_API_KEY to environment variables.'
        })
      };
    }

    console.log(`Processing Claude request: ${message.substring(0, 50)}...`);
    
    // Get current date and context
    const currentDate = new Date();
    const currentDateString = currentDate.toLocaleDateString('en-US', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
    const currentTimeString = currentDate.toLocaleTimeString('en-US');
    
    // Calculate next Friday and next month expirations
    const nextFriday = getNextFriday(currentDate);
    const nextMonthExpiry = getNextMonthExpiry(currentDate);
    const thirdFriday = getThirdFriday(currentDate);
    
    // Enhanced system prompt with current context
    const enhancedSystemPrompt = `You are Rolo, a professional options trading AI assistant with access to real-time market data. 

CURRENT CONTEXT:
- Today's Date: ${currentDateString}
- Current Time: ${currentTimeString}
- Market Status: ${getMarketStatus(currentDate)}

CRITICAL: Always use CURRENT 2025 dates for options strategies:
- Next Weekly Expiry: ${nextFriday}
- Next Monthly Expiry: ${nextMonthExpiry}
- Third Friday: ${thirdFriday}

NEVER reference dates from 2023 or earlier years. Always provide strategies with:
- Current market conditions and 2025 expiration dates
- Real-time price levels and recent market context
- Current volatility environment and market sentiment
- Specific strike prices based on current stock prices
- Exact entry prices, exit targets, and stop losses
- Professional risk management with current market conditions
- Today's trading session context

Focus on actionable strategies for TODAY'S market, not historical data.`;

    // Set timeout for API call
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000);

    try {
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': ANTHROPIC_API_KEY,
          'anthropic-version': '2023-06-01'
        },
        signal: controller.signal,
        body: JSON.stringify({
          model: 'claude-3-5-sonnet-20241022',
          max_tokens: 1500,
          system: enhancedSystemPrompt,
          messages: [{
            role: 'user',
            content: message
          }]
        })
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Claude API error:', response.status, errorText);
        
        return {
          statusCode: 500,
          headers,
          body: JSON.stringify({ 
            error: `Claude API error: ${response.status} - ${errorText.substring(0, 200)}`
          })
        };
      }

      const data = await response.json();
      console.log('Claude API success! Response length:', data.content[0].text.length);
      
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ 
          response: data.content[0].text,
          isLive: true,
          source: 'claude_api_current_context',
          currentDate: currentDateString,
          timestamp: new Date().toISOString()
        })
      };

    } catch (fetchError) {
      clearTimeout(timeoutId);
      
      if (fetchError.name === 'AbortError') {
        console.log('Claude API call timed out after 8 seconds');
        return {
          statusCode: 408,
          headers,
          body: JSON.stringify({ 
            error: 'Claude API response too slow. Try a shorter question or try again.',
            timeout: true
          })
        };
      }
      
      throw fetchError;
    }

  } catch (error) {
    console.error('Function error:', error);
    
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        error: `Unable to connect to Claude AI: ${error.message}`,
        isLive: false,
        troubleshooting: 'Check Claude API key and try a shorter question'
      })
    };
  }
};

// Helper functions for current options dates
function getNextFriday(currentDate) {
  const date = new Date(currentDate);
  const daysUntilFriday = (5 - date.getDay() + 7) % 7;
  if (daysUntilFriday === 0 && date.getHours() >= 16) {
    // If it's Friday after market close, get next Friday
    date.setDate(date.getDate() + 7);
  } else {
    date.setDate(date.getDate() + daysUntilFriday);
  }
  return date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
}

function getNextMonthExpiry(currentDate) {
  const date = new Date(currentDate);
  const nextMonth = new Date(date.getFullYear(), date.getMonth() + 1, 1);
  const thirdFriday = getThirdFridayOfMonth(nextMonth);
  return thirdFriday.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
}

function getThirdFriday(currentDate) {
  const date = new Date(currentDate);
  const thirdFriday = getThirdFridayOfMonth(date);
  
  // If third Friday of current month has passed, get next month's
  if (thirdFriday < currentDate) {
    const nextMonth = new Date(date.getFullYear(), date.getMonth() + 1, 1);
    return getThirdFridayOfMonth(nextMonth).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
  }
  
  return thirdFriday.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
}

function getThirdFridayOfMonth(date) {
  const year = date.getFullYear();
  const month = date.getMonth();
  const firstDay = new Date(year, month, 1);
  const firstFriday = new Date(year, month, 1 + (5 - firstDay.getDay() + 7) % 7);
  return new Date(year, month, firstFriday.getDate() + 14);
}

function getMarketStatus(currentDate) {
  const hour = currentDate.getHours();
  const day = currentDate.getDay();
  
  // Weekend
  if (day === 0 || day === 6) return 'Market Closed (Weekend)';
  
  // Weekday hours (assuming ET)
  if (hour < 4) return 'Market Closed';
  if (hour >= 4 && hour < 9.5) return 'Pre-Market';
  if (hour >= 9.5 && hour < 16) return 'Market Open';
  if (hour >= 16 && hour < 20) return 'After Hours';
  return 'Market Closed';
}
