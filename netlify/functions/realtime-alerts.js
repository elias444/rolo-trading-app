// netlify/functions/realtime-alerts.js
// ADD THIS AS A NEW FILE - restores your real-time alerts functionality
// Monitors market for unusual activity and generates smart alerts

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
        const ALPHA_VANTAGE_API_KEY = process.env.ALPHA_VANTAGE_API_KEY;
        
        if (!ALPHA_VANTAGE_API_KEY) {
            return {
                statusCode: 400,
                headers,
                body: JSON.stringify({ error: 'Alpha Vantage API key not configured in Netlify environment variables.' })
            };
        }

        // Watchlist of stocks to monitor for alerts (can be expanded)
        const watchlist = ['SPY', 'QQQ', 'AAPL', 'TSLA', 'NVDA', 'MSFT'];
        const alerts = [];

        // Get current VIX level for market fear indicator
        let vixLevel = null;
        try {
            const vixResponse = await fetch(`https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=VIX&apikey=${ALPHA_VANTAGE_API_KEY}`);
            const vixData = await vixResponse.json();
            
            if (vixData && vixData['Global Quote'] && vixData['Global Quote']['05. price']) {
                vixLevel = parseFloat(vixData['Global Quote']['05. price']);
            } else if (vixData['Note']) {
                console.warn('VIX API rate limit or other note:', vixData['Note']);
            }
        } catch (e) {
            console.error('Error fetching VIX:', e.message);
        }

        // Generate market-wide alerts based on VIX
        if (vixLevel) {
            if (vixLevel > 25) {
                alerts.push({
                    type: 'market_volatility',
                    title: '🚨 High Volatility Alert',
                    description: `Market volatility (VIX: ${vixLevel.toFixed(2)}) is high. Expect choppy price action.`,
                    priority: 'high',
                    timestamp: new Date().toISOString(),
                    action: 'Consider smaller position sizes or defensive strategies.'
                });
            } else if (vixLevel < 15) {
                alerts.push({
                    type: 'market_calm',
                    title: '🧘 Market Calm Alert',
                    description: `Market volatility (VIX: ${vixLevel.toFixed(2)}) is low. Could precede a breakout or increased complacency.`,
                    priority: 'low',
                    timestamp: new Date().toISOString(),
                    action: 'Monitor for unusual volume spikes or news events.'
                });
            }
        }

        // Simulate real-time stock-specific alerts for watchlist
        for (const symbol of watchlist) {
            try {
                const stockResponse = await fetch(`https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${symbol}&apikey=${ALPHA_VANTAGE_API_KEY}`);
                const stockData = await stockResponse.json();

                if (stockData && stockData['Global Quote'] && stockData['Global Quote']['10. change percent']) {
                    const changePercent = parseFloat(stockData['Global Quote']['10. change percent']);
                    const price = parseFloat(stockData['Global Quote']['05. price']);
                    const volume = parseInt(stockData['Global Quote']['06. volume']);

                    // Example: Significant price movement
                    if (Math.abs(changePercent) > 3) { // More than 3% change
                        const direction = changePercent > 0 ? 'up' : 'down';
                        alerts.push({
                            type: 'price_movement',
                            title: `📈 ${symbol} Price Alert`,
                            description: `${symbol} is moving significantly (${changePercent}% ${direction}). Current price: $${price.toFixed(2)}`,
                            priority: 'high',
                            timestamp: new Date().toISOString(),
                            action: `Investigate news and technical levels for ${symbol}.`
                        });
                    }

                    // Example: High volume alert (simple threshold)
                    if (volume > 50000000 && symbol === 'SPY') { // SPY often has very high volume
                         alerts.push({
                            type: 'volume_spike',
                            title: `📊 ${symbol} Volume Spike`,
                            description: `${symbol} showing unusually high volume (${volume.toLocaleString()}).`,
                            priority: 'medium',
                            timestamp: new Date().toISOString(),
                            action: `Analyze ${symbol}'s price action and market context.`
                        });
                    } else if (volume > 10000000 && symbol !== 'SPY') { // Other stocks
                        alerts.push({
                            type: 'volume_spike',
                            title: `📊 ${symbol} Volume Spike`,
                            description: `${symbol} showing unusually high volume (${volume.toLocaleString()}).`,
                            priority: 'medium',
                            timestamp: new Date().toISOString(),
                            action: `Analyze ${symbol}'s price action and market context.`
                        });
                    }

                } else if (stockData['Note']) {
                    console.warn(`Alpha Vantage note for ${symbol}:`, stockData['Note']);
                }
            } catch (e) {
                console.error(`Error fetching real-time data for ${symbol}:`, e.message);
                // Don't push an alert, just log the warning
            }
        }

        // Market open/close alerts (based on server's time, adjust for EST market hours if needed)
        const now = new Date();
        const hour = now.getHours(); // 0-23
        const day = now.getDay(); // 0 (Sunday) - 6 (Saturday)
        const isMarketOpen = (day >= 1 && day <= 5) && (hour >= 9 && hour < 16); // Mon-Fri, 9am-4pm EST (adjust for UTC if Netlify function is not EST)
        const isPreMarket = (day >= 1 && day <= 5) && (hour >= 4 && hour < 9);
        const isAfterHours = (day >= 1 && day <= 5) && (hour >= 16 && hour < 20);

        if (isMarketOpen) {
            // Check for significant market open/close events
            if (hour === 9 && now.getMinutes() < 10) { // Just after market open
                alerts.push({
                    type: 'market_open',
                    title: '🔔 Market Open',
                    description: 'The US stock market is now open. Expect initial volatility.',
                    priority: 'low',
                    timestamp: new Date().toISOString(),
                    action: 'Observe opening trends and price action.'
                });
            } else if (hour === 15 && now.getMinutes() > 50) { // Near market close
                alerts.push({
                    type: 'market_close_approach',
                    title: '🕒 Market Close Approaching',
                    description: 'Less than 10 minutes until market close. Watch for end-of-day moves.',
                    priority: 'low',
                    timestamp: new Date().toISOString(),
                    action: 'Prepare for market close and after-hours trading.'
                });
            }
        } else if (!isMarketOpen && (isPreMarket || isAfterHours)) {
             alerts.push({
                type: 'extended_hours',
                title: '⏰ Extended Hours',
                description: `Market is in ${isPreMarket ? 'pre-market' : 'after-hours'} trading. Volume may be low.`,
                priority: 'low',
                timestamp: new Date().toISOString(),
                action: 'Monitor for news or earnings reactions.'
            });
        }


        // If no real alerts, and if the API key check passed, return empty array with a message
        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({
                alerts: alerts.length > 0 ? alerts : [], // Ensure it's an array
                timestamp: new Date().toISOString(),
                source: 'real-time-monitoring',
                market_status: isMarketOpen ? 'open' : (isPreMarket || isAfterHours) ? 'extended' : 'closed',
                message: alerts.length === 0 ? "No real-time alerts at the moment. The market might be calm, or your watchlist is empty." : undefined
            })
        };

    } catch (error) {
        console.error('Real-time alerts error:', error);
        
        let errorMessage = `Alert system error: ${error.message}`;
        if (error.message.includes('API key not configured')) {
            errorMessage = `Alpha Vantage API key not found. Please add ALPHA_VANTAGE_API_KEY to Netlify environment variables.`;
        } else if (error.message.includes('API rate limit reached')) {
            errorMessage = `Alpha Vantage API rate limit reached. Please try again in a moment.`;
        }

        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({ 
                error: errorMessage,
                alerts: [] // Always return alerts as an array on error
            })
        };
    }
};
