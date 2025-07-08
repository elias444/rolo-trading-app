// netlify/functions/realtime-alerts.js
// ADD THIS AS A NEW FILE - restores your real-time alerts functionality
// Monitors market for unusual activity and generates smart alerts

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
                body: JSON.stringify({ error: 'Alpha Vantage API key not configured' })
            };
        }

        // Watchlist of stocks to monitor for alerts
        const watchlist = ['SPY', 'QQQ', 'AAPL', 'TSLA', 'NVDA', 'MSFT', 'GOOGL', 'AMZN', 'META', 'HOOD'];
        const alerts = [];

        // Get current VIX level for market fear indicator
        try {
            const vixResponse = await fetch(`https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=VIX&apikey=${ALPHA_VANTAGE_API_KEY}`);
            const vixData = await vixResponse.json();
            
            if (vixData['Global Quote']) {
                const vixPrice = parseFloat(vixData['Global Quote']['05. price']);
                const vixChange = parseFloat(vixData['Global Quote']['09. change']);
                
                if (vixPrice > 25) {
                    alerts.push({
                        type: 'market_fear',
                        title: '📈 VIX Spike Alert',
                        description: `VIX spiked to ${vixPrice.toFixed(2)} - elevated market fear detected`,
                        priority: 'high',
                        timestamp: new Date().toLocaleString(),
                        action: 'Consider defensive positions or volatility plays'
                    });
                } else if (vixPrice < 15) {
                    alerts.push({
                        type: 'market_complacency',
                        title: '😴 Low VIX Alert',
                        description: `VIX at ${vixPrice.toFixed(2)} - market complacency detected`,
                        priority: 'medium',
                        timestamp: new Date().toLocaleString(),
                        action: 'Watch for potential volatility expansion'
                    });
                }
            }
        } catch (error) {
            console.log('VIX check failed:', error.message);
        }

        // Check for unusual volume and price movements
        for (const symbol of watchlist.slice(0, 5)) { // Check first 5 to avoid rate limits
            try {
                await new Promise(resolve => setTimeout(resolve, 200)); // Rate limit protection
                
                const response = await fetch(`https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${symbol}&apikey=${ALPHA_VANTAGE_API_KEY}`);
                const data = await response.json();
                
                if (data['Global Quote']) {
                    const quote = data['Global Quote'];
                    const price = parseFloat(quote['05. price']);
                    const change = parseFloat(quote['09. change']);
                    const changePercent = parseFloat(quote['10. change percent'].replace('%', ''));
                    const volume = parseInt(quote['06. volume']);
                    
                    // Alert for significant price moves
                    if (Math.abs(changePercent) > 5) {
                        alerts.push({
                            type: 'price_movement',
                            title: `🚀 ${symbol} ${changePercent > 0 ? 'Surge' : 'Drop'}`,
                            description: `${symbol} moved ${changePercent.toFixed(2)}% to $${price.toFixed(2)}`,
                            priority: Math.abs(changePercent) > 10 ? 'high' : 'medium',
                            timestamp: new Date().toLocaleString(),
                            action: changePercent > 0 ? 'Check for momentum continuation' : 'Look for bounce opportunity'
                        });
                    }
                    
                    // Alert for unusual volume (simplified check)
                    if (symbol === 'SPY' && volume > 100000000) { // 100M+ volume for SPY
                        alerts.push({
                            type: 'volume_spike',
                            title: '📊 High Volume Alert',
                            description: `${symbol} trading ${(volume / 1000000).toFixed(1)}M shares - above normal`,
                            priority: 'medium',
                            timestamp: new Date().toLocaleString(),
                            action: 'Monitor for institutional activity'
                        });
                    }
                }
            } catch (error) {
                console.log(`Alert check failed for ${symbol}:`, error.message);
            }
        }

        // Check for market gaps (pre-market/after-hours activity)
        const now = new Date();
        const hour = now.getHours();
        const isPreMarket = hour >= 4 && hour < 9;
        const isAfterHours = hour >= 16 && hour < 20;
        
        if (isPreMarket || isAfterHours) {
            alerts.push({
                type: 'extended_hours',
                title: `🌙 ${isPreMarket ? 'Pre-Market' : 'After-Hours'} Activity`,
                description: 'Extended hours trading active - monitor for gaps at open',
                priority: 'low',
                timestamp: new Date().toLocaleString(),
                action: 'Review overnight news and futures'
            });
        }

        // Add some market structure alerts based on time
        const isMarketOpen = hour >= 9 && hour < 16 && now.getDay() >= 1 && now.getDay() <= 5;
        
        if (isMarketOpen) {
            // Opening hour volatility
            if (hour === 9) {
                alerts.push({
                    type: 'market_open',
                    title: '🔔 Market Open Alert',
                    description: 'First hour of trading - heightened volatility expected',
                    priority: 'medium',
                    timestamp: new Date().toLocaleString(),
                    action: 'Monitor for opening gaps and momentum plays'
                });
            }
            
            // Power hour
            if (hour === 15) {
                alerts.push({
                    type: 'power_hour',
                    title: '⚡ Power Hour Alert',
                    description: 'Final trading hour - increased volume and volatility',
                    priority: 'medium',
                    timestamp: new Date().toLocaleString(),
                    action: 'Watch for end-of-day positioning moves'
                });
            }
        }

        // If no real alerts, return empty array (NO MOCK ALERTS)
        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({
                alerts: alerts,
                timestamp: new Date().toISOString(),
                source: 'real-time-monitoring',
                market_status: isMarketOpen ? 'open' : (isPreMarket || isAfterHours) ? 'extended' : 'closed'
            })
        };

    } catch (error) {
        console.error('Real-time alerts error:', error);
        
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({ 
                error: `Alert system error: ${error.message}`,
                alerts: [] // Return empty alerts array on error, NO MOCK DATA
            })
        };
    }
};
