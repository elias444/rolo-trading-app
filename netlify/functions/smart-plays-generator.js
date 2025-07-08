// netlify/functions/smart-plays-generator.js
// SMART PLAYS GENERATOR - AI-POWERED TRADING OPPORTUNITIES

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
    
    // Get comprehensive market data
    const marketData = await gatherMarketData();
    
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
    
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: 'Failed to generate smart plays',
        details: error.message,
        timestamp: new Date().toISOString()
      })
    };
  }
};

// Gather comprehensive market data for analysis
async function gatherMarketData() {
  const data = {
    stocks: {},
    market: {},
    sentiment: 'NEUTRAL'
  };
  
  // Top watchlist tickers to analyze
  const tickers = ['AAPL', 'TSLA', 'NVDA', 'MSFT', 'GOOGL', 'AMZN', 'SPY', 'QQQ', 'HOOD', 'AI'];
  
  // Get stock data for all tickers
  for (const ticker of tickers) {
    try {
      const stockResponse = await fetch(`${getBaseUrl()}/smart-stock-data?symbol=${ticker}&entitlement=realtime`);
      if (stockResponse.ok) {
        const stockData = await stockResponse.json();
        data.stocks[ticker] = stockData;
      }
    } catch (error) {
      console.log(`Failed to get data for ${ticker}:`, error.message);
    }
  }
  
  // Get market intelligence
  try {
    const marketResponse = await fetch(`${getBaseUrl()}/market-intelligence`);
    if (marketResponse.ok) {
      const marketIntelligence = await marketResponse.json();
      data.market = marketIntelligence;
      data.sentiment = marketIntelligence.overall_sentiment || 'NEUTRAL';
    }
  } catch (error) {
    console.log('Failed to get market intelligence:', error.message);
  }
  
  return data;
}

// Generate top trading plays
async function generateTopPlays(marketData) {
  const plays = [];
  
  // 1. Technical Momentum Plays
  const momentumPlays = generateMomentumPlays(marketData.stocks);
  plays.push(...momentumPlays);
  
  // 2. Options Income Plays
  const incomePlays = generateIncomePlays(marketData.stocks, marketData.sentiment);
  plays.push(...incomePlays);
  
  // 3. Breakout Plays
  const breakoutPlays = generateBreakoutPlays(marketData.stocks);
  plays.push(...breakoutPlays);
  
  // 4. Volatility Plays
  const volatilityPlays = generateVolatilityPlays(marketData.stocks, marketData.market);
  plays.push(...volatilityPlays);
  
  // 5. Sector Rotation Plays
  const sectorPlays = generateSectorPlays(marketData.market);
  plays.push(...sectorPlays);
  
  // Sort by confidence and return top 10
  return plays
    .sort((a, b) => b.confidence - a.confidence)
    .slice(0, 10);
}

// Generate momentum-based plays
function generateMomentumPlays(stocks) {
  const plays = [];
  
  Object.entries(stocks).forEach(([ticker, stock]) => {
    if (!stock.price || !stock.change) return;
    
    const changePercent = parseFloat((stock.changePercent || '0%').replace('%', ''));
    const volume = stock.volume || 0;
    
    // Strong momentum criteria
    if (Math.abs(changePercent) > 2 && volume > 1000000) {
      const direction = changePercent > 0 ? 'bullish' : 'bearish';
      const confidence = Math.min(90, 60 + Math.abs(changePercent) * 5);
      
      const play = {
        emoji: changePercent > 0 ? '🚀' : '📉',
        title: `${direction.toUpperCase()} Momentum`,
        ticker: ticker,
        strategy: direction === 'bullish' ? 'Bull Call Spread' : 'Bear Put Spread',
        confidence: Math.round(confidence),
        description: `Strong ${direction} momentum with ${Math.abs(changePercent).toFixed(1)}% move on ${formatVolume(volume)} volume.`,
        type: 'momentum',
        timeframe: '1-2 weeks',
        risk_level: 'Medium'
      };
      
      plays.push(play);
    }
  });
  
  return plays;
}

// Generate income-based plays
function generateIncomePlays(stocks, marketSentiment) {
  const plays = [];
  
  Object.entries(stocks).forEach(([ticker, stock]) => {
    if (!stock.price || !stock.rsi) return;
    
    const rsi = stock.rsi;
    const price = stock.price;
    
    // Income play criteria (stable stocks with good premiums)
    if (rsi > 40 && rsi < 70 && price > 50 && ['AAPL', 'MSFT', 'GOOGL', 'AMZN'].includes(ticker)) {
      const confidence = marketSentiment === 'BULLISH' ? 75 : marketSentiment === 'BEARISH' ? 60 : 70;
      
      const play = {
        emoji: '💰',
        title: 'Income Generation',
        ticker: ticker,
        strategy: 'Covered Call / Cash-Secured Put',
        confidence: confidence,
        description: `Stable stock with good options premiums. RSI ${rsi.toFixed(1)} suggests moderate volatility.`,
        type: 'income',
        timeframe: '2-4 weeks',
        risk_level: 'Low'
      };
      
      plays.push(play);
    }
  });
  
  return plays;
}

// Generate breakout plays
function generateBreakoutPlays(stocks) {
  const plays = [];
  
  Object.entries(stocks).forEach(([ticker, stock]) => {
    if (!stock.price || !stock.high || !stock.sma20) return;
    
    const price = stock.price;
    const high52Week = stock.high || price * 1.2; // Estimate if not available
    const sma20 = stock.sma20;
    
    // Breakout criteria
    const nearHighs = (price / high52Week) > 0.95;
    const aboveSMA = price > sma20;
    
    if (nearHighs && aboveSMA) {
      const confidence = 70;
      
      const play = {
        emoji: '📈',
        title: 'Breakout Setup',
        ticker: ticker,
        strategy: 'Long Calls / Bull Call Spread',
        confidence: confidence,
        description: `Trading near 52-week highs above SMA20. Potential breakout candidate.`,
        type: 'breakout',
        timeframe: '2-3 weeks',
        risk_level: 'Medium-High'
      };
      
      plays.push(play);
    }
  });
  
  return plays;
}

// Generate volatility plays
function generateVolatilityPlays(stocks, market) {
  const plays = [];
  
  const vixLevel = market.vix?.price || 20;
  
  // High volatility environment
  if (vixLevel > 25) {
    const play = {
      emoji: '⚡',
      title: 'High Volatility Premium Selling',
      ticker: 'SPY',
      strategy: 'Iron Condor / Short Strangles',
      confidence: 80,
      description: `VIX at ${vixLevel.toFixed(1)} suggests high premium environment. Sell volatility.`,
      type: 'volatility',
      timeframe: '2-4 weeks',
      risk_level: 'Medium'
    };
    
    plays.push(play);
  }
  
  // Low volatility environment
  if (vixLevel < 15) {
    const play = {
      emoji: '🎯',
      title: 'Low Volatility Expansion',
      ticker: 'SPY',
      strategy: 'Long Straddles / Calendar Spreads',
      confidence: 75,
      description: `VIX at ${vixLevel.toFixed(1)} suggests volatility expansion possible. Buy volatility.`,
      type: 'volatility',
      timeframe: '3-6 weeks',
      risk_level: 'Medium'
    };
    
    plays.push(play);
  }
  
  return plays;
}

// Generate sector rotation plays
function generateSectorPlays(market) {
  const plays = [];
  
  if (!market.sectors) return plays;
  
  // Find strongest and weakest sectors
  const sectors = Object.entries(market.sectors);
  if (sectors.length === 0) return plays;
  
  const sortedSectors = sectors.sort((a, b) => {
    const aChange = parseFloat(a[1].changePercent || '0');
    const bChange = parseFloat(b[1].changePercent || '0');
    return bChange - aChange;
  });
  
  const strongestSector = sortedSectors[0];
  const weakestSector = sortedSectors[sortedSectors.length - 1];
  
  // Strongest sector play
  if (parseFloat(strongestSector[1].changePercent) > 1) {
    const play = {
      emoji: '🔥',
      title: 'Sector Leader',
      ticker: strongestSector[0],
      strategy: 'Long Calls / Sector ETF',
      confidence: 75,
      description: `${strongestSector[1].name} sector leading with ${strongestSector[1].changePercent}% gain.`,
      type: 'sector',
      timeframe: '2-4 weeks',
      risk_level: 'Medium'
    };
    
    plays.push(play);
  }
  
  // Weakest sector contrarian play
  if (parseFloat(weakestSector[1].changePercent) < -2) {
    const play = {
      emoji: '🔄',
      title: 'Contrarian Bounce',
      ticker: weakestSector[0],
      strategy: 'Oversold Bounce Play',
      confidence: 65,
      description: `${weakestSector[1].name} sector oversold at ${weakestSector[1].changePercent}%. Potential bounce.`,
      type: 'contrarian',
      timeframe: '1-3 weeks',
      risk_level: 'Medium-High'
    };
    
    plays.push(play);
  }
  
  return plays;
}

// Utility functions
function formatVolume(volume) {
  if (!volume) return 'N/A';
  if (volume > 1000000) return `${(volume / 1000000).toFixed(1)}M`;
  if (volume > 1000) return `${(volume / 1000).toFixed(0)}K`;
  return volume.toLocaleString();
}

function getBaseUrl() {
  return 'https://magenta-monstera-8d552b.netlify.app/.netlify/functions';
}
