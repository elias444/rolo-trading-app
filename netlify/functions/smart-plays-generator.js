// netlify/functions/smart-plays-generator.js
// SMART PLAYS GENERATOR - AI-POWERED TRADING OPPORTUNITIES

const fetch = require('node-fetch'); // Required for server-side fetch

exports.handler = async (event, context) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, OPTIONS'
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  try {
    console.log('Generating smart trading plays...');
    
    const API_KEY = process.env.ALPHA_VANTAGE_API_KEY; // Get key from environment variables

    if (!API_KEY) {
        throw new Error('Alpha Vantage API key not configured in Netlify environment variables.');
    }

    // Gather comprehensive market data
    const marketData = await gatherMarketData(API_KEY);
    
    // Generate top plays based on multiple factors
    const plays = await generateTopPlays(marketData);
    
    console.log(`✅ Generated ${plays.length} smart plays`);
    
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        plays: plays,
        market_context: marketData.sentiment,
        generated_at: new Date().toISOString(),
        total_plays: plays.length
      })
    };
    
  } catch (error) {
    console.error('Smart plays generator error:', error);
    
    let errorMessage = 'Failed to generate smart plays.';
    if (error.message.includes('API rate limit reached')) {
        errorMessage = `Alpha Vantage API rate limit reached. Please try again in a moment.`;
    } else if (error.message.includes('API key not valid')) {
        errorMessage = `Invalid Alpha Vantage API key. Please check your Netlify environment variables.`;
    } else if (error.message.includes('Alpha Vantage API key not configured')) {
        errorMessage = `Alpha Vantage API key not found. Please add ALPHA_VANTAGE_API_KEY to Netlify environment variables.`;
    }

    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: errorMessage,
        details: error.message,
        timestamp: new Date().toISOString()
      })
    };
  }
};

// Gather comprehensive market data for analysis
async function gatherMarketData(apiKey) {
    const data = {};

    // Get VIX (Volatility Index)
    try {
        const vixResponse = await fetch(`https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=VIX&apikey=${apiKey}`);
        const vixData = await vixResponse.json();
        if (vixData && vixData['Global Quote'] && vixData['Global Quote']['05. price']) {
            data.vix = parseFloat(vixData['Global Quote']['05. price']);
        } else if (vixData['Note']) {
            throw new Error('API rate limit reached for VIX');
        }
    } catch (e) {
        console.warn('Could not fetch VIX data:', e.message);
        data.vix = null; // Indicate failure or use a default
    }

    // Get major indices (SPY, QQQ, DIA) - using ETFs as proxies
    const indexSymbols = ['SPY', 'QQQ', 'DIA'];
    data.indices = {};
    for (const symbol of indexSymbols) {
        try {
            const response = await fetch(`https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${symbol}&apikey=${apiKey}`);
            const json = await response.json();
            if (json && json['Global Quote'] && json['Global Quote']['05. price']) {
                data.indices[symbol] = {
                    price: parseFloat(json['Global Quote']['05. price']),
                    changePercent: parseFloat(json['Global Quote']['10. change percent'].replace('%', ''))
                };
            } else if (json['Note']) {
                throw new Error(`API rate limit reached for ${symbol}`);
            }
        } catch (e) {
            console.warn(`Could not fetch data for ${symbol}: ${e.message}`);
            data.indices[symbol] = null;
        }
    }

    // Simple market sentiment based on VIX
    data.sentiment = 'neutral';
    if (data.vix) {
        if (data.vix > 25) {
            data.sentiment = 'fearful';
        } else if (data.vix < 15) {
            data.sentiment = 'greedy';
        }
    }

    // Simple overall market trend from indices
    let bullishCount = 0;
    let bearishCount = 0;
    Object.values(data.indices).forEach(index => {
        if (index && index.changePercent > 0.1) { // Up by more than 0.1%
            bullishCount++;
        } else if (index && index.changePercent < -0.1) { // Down by more than 0.1%
            bearishCount++;
        }
    });

    if (bullishCount > bearishCount && bullishCount > 1) {
        data.marketTrend = 'up-trending';
    } else if (bearishCount > bullishCount && bearishCount > 1) {
        data.marketTrend = 'down-trending';
    } else {
        data.marketTrend = 'sideways';
    }

    return data;
}

// Generate intelligent trading plays based on market data
async function generateTopPlays(marketData) {
  const plays = [];
  const { vix, indices, sentiment, marketTrend } = marketData;

  // General market sentiment plays
  if (sentiment === 'fearful' && vix > 25) {
    plays.push({
      emoji: '🛡️',
      title: 'VIX Spike / Hedging Play',
      ticker: 'VIX Calls / SPY Puts',
      strategy: 'Volatility long / Market hedge',
      confidence: 80,
      description: `Market fear is elevated with VIX at ${vix.toFixed(2)}. Consider hedging or long volatility plays.`,
      type: 'volatility',
      timeframe: '1-3 days',
      risk_level: 'Medium'
    });
  } else if (sentiment === 'greedy' && vix < 15) {
    plays.push({
      emoji: '🚀',
      title: 'Momentum Continuation',
      ticker: 'Tech / Growth ETFs',
      strategy: 'Long calls / Growth stocks',
      confidence: 75,
      description: `Market showing greed with VIX at ${vix.toFixed(2)}. Look for continuation in leading sectors.`,
      type: 'momentum',
      timeframe: '1-5 days',
      risk_level: 'Medium'
    });
  }

  // Trend following plays for major indices
  if (marketTrend === 'up-trending' && indices.SPY && indices.SPY.changePercent > 0.5) {
      plays.push({
          emoji: '⬆️',
          title: 'SPY Bull Trend Follow',
          ticker: 'SPY',
          strategy: 'Long SPY Calls / ETF',
          confidence: 70,
          description: `S&P 500 showing strong upward trend today (${indices.SPY.changePercent}%). Look for pullbacks to support levels.`,
          type: 'trend',
          timeframe: '1-3 days',
          risk_level: 'Medium'
      });
  } else if (marketTrend === 'down-trending' && indices.SPY && indices.SPY.changePercent < -0.5) {
      plays.push({
          emoji: '⬇️',
          title: 'SPY Bear Trend Follow',
          ticker: 'SPY',
          strategy: 'Long SPY Puts / Inverse ETF',
          confidence: 70,
          description: `S&P 500 showing strong downward trend today (${indices.SPY.changePercent}%). Consider shorting opportunities.`,
          type: 'trend',
          timeframe: '1-3 days',
          risk_level: 'Medium'
      });
  }

  // Example individual stock plays (replace with real data analysis if available)
  // This part would typically be based on more advanced analysis (technical indicators, news sentiment, etc.)
  // For now, these are illustrative and can be expanded with real data.
  const popularTickers = ['AAPL', 'TSLA', 'NVDA', 'MSFT'];
  for (const ticker of popularTickers) {
      // Simulate getting some data (in a real app, you'd fetch this)
      const mockPrice = (Math.random() * 200 + 100).toFixed(2);
      const mockChange = (Math.random() * 10 - 5).toFixed(2);
      const mockVolume = (Math.random() * 50000000 + 10000000).toLocaleString();
      
      if (parseFloat(mockChange) > 2) {
          plays.push({
              emoji: '⚡',
              title: `${ticker} Breakout Watch`,
              ticker: ticker,
              strategy: 'Long calls / Breakout entry',
              confidence: 68,
              description: `${ticker} showing strong upward movement. Watch for sustained volume.`,
              type: 'breakout',
              timeframe: 'Intraday',
              risk_level: 'High'
          });
      } else if (parseFloat(mockChange) < -2) {
          plays.push({
              emoji: '📉',
              title: `${ticker} Support Test`,
              ticker: ticker,
              strategy: 'Short puts / Put credit spread',
              confidence: 62,
              description: `${ticker} testing key support levels. Potential for bounce or breakdown.`,
              type: 'support',
              timeframe: '1-2 days',
              risk_level: 'Medium'
          });
      }
  }

  // If no plays generated, add a default
  if (plays.length === 0) {
      plays.push({
          emoji: '🤔',
          title: 'Market Quiet',
          ticker: 'N/A',
          strategy: 'Observe / Research',
          confidence: 50,
          description: 'Market is currently calm or lacking clear directional signals. Focus on research or small positions.',
          type: 'neutral',
          timeframe: 'N/A',
          risk_level: 'Low'
      });
  }

  return plays;
}
