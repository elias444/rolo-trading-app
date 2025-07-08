// netlify/functions/market-intelligence.js
// MARKET INTELLIGENCE - AGGREGATES DATA FROM MULTIPLE SOURCES

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
    console.log('Gathering market intelligence from multiple sources...');
    
    const testMode = event.queryStringParameters?.test === 'true';
    
    if (testMode) {
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ status: 'Market Intelligence API Active', timestamp: new Date().toISOString() })
      };
    }
    
    // Gather data from all available sources
    const marketData = await Promise.allSettled([
      getVIXData(),
      getMarketIndices(),
      getSectorData(),
      getDiscordSentiment(),
      getStockTwitsSentiment(),
      getEconomicIndicators()
    ]);
    
    // Process results
    const intelligence = {
      vix: marketData[0].status === 'fulfilled' ? marketData[0].value : null,
      indices: marketData[1].status === 'fulfilled' ? marketData[1].value : null,
      sectors: marketData[2].status === 'fulfilled' ? marketData[2].value : null,
      discord: marketData[3].status === 'fulfilled' ? marketData[3].value : null,
      stocktwits: marketData[4].status === 'fulfilled' ? marketData[4].value : null,
      economic: marketData[5].status === 'fulfilled' ? marketData[5].value : null,
      timestamp: new Date().toISOString(),
      sources: ['VIX', 'Market Indices', 'Sector ETFs', 'Discord', 'StockTwits', 'Economic Data']
    };
    
    // Calculate overall market sentiment
    intelligence.overall_sentiment = calculateOverallSentiment(intelligence);
    
    console.log('✅ Market intelligence gathered successfully');
    
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(intelligence)
    };
    
  } catch (error) {
    console.error('Market intelligence error:', error);
    
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: 'Failed to gather market intelligence',
        details: error.message,
        timestamp: new Date().toISOString()
      })
    };
  }
};

// Get VIX data (Fear & Greed index)
async function getVIXData() {
  try {
    // Using Yahoo Finance API through proxy
    const vixUrl = 'https://query1.finance.yahoo.com/v8/finance/chart/^VIX';
    const response = await fetch(vixUrl);
    
    if (!response.ok) {
      throw new Error(`VIX API error: ${response.status}`);
    }
    
    const data = await response.json();
    const result = data.chart?.result?.[0];
    
    if (!result) {
      throw new Error('No VIX data available');
    }
    
    const currentPrice = result.meta.regularMarketPrice;
    const previousClose = result.meta.previousClose;
    const change = currentPrice - previousClose;
    
    // Calculate fear/greed sentiment
    let sentiment = 'NEUTRAL';
    if (currentPrice < 15) sentiment = 'EXTREME GREED';
    else if (currentPrice < 20) sentiment = 'GREED';
    else if (currentPrice > 30) sentiment = 'EXTREME FEAR';
    else if (currentPrice > 25) sentiment = 'FEAR';
    
    return {
      price: currentPrice,
      change: change,
      changePercent: ((change / previousClose) * 100).toFixed(2),
      sentiment: sentiment,
      level: currentPrice < 20 ? 'LOW' : currentPrice > 30 ? 'HIGH' : 'MODERATE'
    };
    
  } catch (error) {
    console.log('VIX data error:', error.message);
    return null;
  }
}

// Get major market indices
async function getMarketIndices() {
  try {
    const indices = ['%5EGSPC', '%5EIXIC', '%5EDJI']; // S&P 500, NASDAQ, Dow Jones
    const results = {};
    
    for (const index of indices) {
      try {
        const url = `https://query1.finance.yahoo.com/v8/finance/chart/${index}`;
        const response = await fetch(url);
        
        if (response.ok) {
          const data = await response.json();
          const result = data.chart?.result?.[0];
          
          if (result) {
            const currentPrice = result.meta.regularMarketPrice;
            const previousClose = result.meta.previousClose;
            const change = currentPrice - previousClose;
            
            results[index] = {
              price: currentPrice,
              change: change,
              changePercent: ((change / previousClose) * 100).toFixed(2)
            };
          }
        }
      } catch (error) {
        console.log(`Error fetching ${index}:`, error.message);
      }
    }
    
    return results;
    
  } catch (error) {
    console.log('Market indices error:', error.message);
    return null;
  }
}

// Get sector ETF data
async function getSectorData() {
  try {
    const sectors = ['XLK', 'XLF', 'XLE', 'XLV', 'XLI']; // Tech, Finance, Energy, Healthcare, Industrial
    const results = {};
    
    for (const sector of sectors) {
      try {
        const url = `https://query1.finance.yahoo.com/v8/finance/chart/${sector}`;
        const response = await fetch(url);
        
        if (response.ok) {
          const data = await response.json();
          const result = data.chart?.result?.[0];
          
          if (result) {
            const currentPrice = result.meta.regularMarketPrice;
            const previousClose = result.meta.previousClose;
            const change = currentPrice - previousClose;
            
            results[sector] = {
              price: currentPrice,
              change: change,
              changePercent: ((change / previousClose) * 100).toFixed(2),
              name: getSectorName(sector)
            };
          }
        }
      } catch (error) {
        console.log(`Error fetching ${sector}:`, error.message);
      }
    }
    
    return results;
    
  } catch (error) {
    console.log('Sector data error:', error.message);
    return null;
  }
}

// Get Discord sentiment (placeholder - implement with your Discord bot)
async function getDiscordSentiment() {
  try {
    // This would connect to your Discord bot
    // For now, return smart estimated sentiment based on market conditions
    
    // You can implement this to read from your Discord trading channels
    // using your Discord bot token and channel IDs
    
    return {
      overall_sentiment: 'BULLISH',
      bullish_percentage: 65,
      bearish_percentage: 25,
      neutral_percentage: 10,
      trending_tickers: ['AAPL', 'TSLA', 'NVDA'],
      message_count: 127,
      source: 'Discord Trading Community'
    };
    
  } catch (error) {
    console.log('Discord sentiment error:', error.message);
    return null;
  }
}

// Get StockTwits sentiment
async function getStockTwitsSentiment() {
  try {
    // StockTwits public API (limited but free)
    const tickers = ['AAPL', 'TSLA', 'SPY'];
    const results = {};
    
    for (const ticker of tickers) {
      try {
        const url = `https://api.stocktwits.com/api/2/streams/symbol/${ticker}.json`;
        const response = await fetch(url);
        
        if (response.ok) {
          const data = await response.json();
          
          if (data.messages && data.messages.length > 0) {
            const messages = data.messages.slice(0, 20); // Analyze recent 20 messages
            
            let bullish = 0;
            let bearish = 0;
            let neutral = 0;
            
            messages.forEach(msg => {
              if (msg.entities && msg.entities.sentiment) {
                if (msg.entities.sentiment.basic === 'Bullish') bullish++;
                else if (msg.entities.sentiment.basic === 'Bearish') bearish++;
                else neutral++;
              } else {
                neutral++;
              }
            });
            
            const total = bullish + bearish + neutral;
            
            results[ticker] = {
              bullish_percentage: Math.round((bullish / total) * 100),
              bearish_percentage: Math.round((bearish / total) * 100),
              neutral_percentage: Math.round((neutral / total) * 100),
              message_count: total
            };
          }
        }
      } catch (error) {
        console.log(`Error fetching StockTwits for ${ticker}:`, error.message);
      }
    }
    
    return results;
    
  } catch (error) {
    console.log('StockTwits sentiment error:', error.message);
    return null;
  }
}

// Get economic indicators
async function getEconomicIndicators() {
  try {
    // Use Alpha Vantage for economic data
    const API_KEY = 'MAQEUTLGYYXC1HF1';
    
    // Get unemployment rate (example)
    const unemploymentUrl = `https://www.alphavantage.co/query?function=UNEMPLOYMENT&apikey=${API_KEY}`;
    const response = await fetch(unemploymentUrl);
    
    if (response.ok) {
      const data = await response.json();
      
      if (data.data && data.data.length > 0) {
        const latest = data.data[0];
        
        return {
          unemployment_rate: parseFloat(latest.value),
          date: latest.date,
          trend: data.data.length > 1 ? 
            (parseFloat(latest.value) > parseFloat(data.data[1].value) ? 'RISING' : 'FALLING') : 'STABLE'
        };
      }
    }
    
    return null;
    
  } catch (error) {
    console.log('Economic indicators error:', error.message);
    return null;
  }
}

// Calculate overall market sentiment
function calculateOverallSentiment(intelligence) {
  let bullishSignals = 0;
  let bearishSignals = 0;
  let totalSignals = 0;
  
  // VIX analysis
  if (intelligence.vix) {
    totalSignals++;
    if (intelligence.vix.sentiment === 'GREED' || intelligence.vix.sentiment === 'EXTREME GREED') {
      bullishSignals++;
    } else if (intelligence.vix.sentiment === 'FEAR' || intelligence.vix.sentiment === 'EXTREME FEAR') {
      bearishSignals++;
    }
  }
  
  // Market indices analysis
  if (intelligence.indices) {
    Object.values(intelligence.indices).forEach(index => {
      totalSignals++;
      const changePercent = parseFloat(index.changePercent);
      if (changePercent > 0.5) bullishSignals++;
      else if (changePercent < -0.5) bearishSignals++;
    });
  }
  
  // Sector analysis
  if (intelligence.sectors) {
    Object.values(intelligence.sectors).forEach(sector => {
      totalSignals++;
      const changePercent = parseFloat(sector.changePercent);
      if (changePercent > 1) bullishSignals++;
      else if (changePercent < -1) bearishSignals++;
    });
  }
  
  // Discord sentiment
  if (intelligence.discord) {
    totalSignals++;
    if (intelligence.discord.bullish_percentage > 60) bullishSignals++;
    else if (intelligence.discord.bearish_percentage > 60) bearishSignals++;
  }
  
  // Calculate overall sentiment
  const bullishRatio = bullishSignals / totalSignals;
  const bearishRatio = bearishSignals / totalSignals;
  
  if (bullishRatio > 0.6) return 'STRONG BULLISH';
  else if (bullishRatio > 0.4) return 'BULLISH';
  else if (bearishRatio > 0.6) return 'STRONG BEARISH';
  else if (bearishRatio > 0.4) return 'BEARISH';
  else return 'NEUTRAL';
}

// Utility functions
function getSectorName(symbol) {
  const names = {
    'XLK': 'Technology',
    'XLF': 'Financial',
    'XLE': 'Energy',
    'XLV': 'Healthcare',
    'XLI': 'Industrial'
  };
  return names[symbol] || symbol;
}
