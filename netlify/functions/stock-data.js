// netlify/functions/stock-data.js
// CLEAN STOCK DATA - NO MOCK DATA, REAL APIs ONLY

exports.handler = async (event, context) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, OPTIONS'
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  const symbol = event.queryStringParameters?.symbol;
  
  if (!symbol) {
    return {
      statusCode: 400,
      headers,
      body: JSON.stringify({ error: 'Symbol parameter is required' })
    };
  }

  try {
    // Try Alpha Vantage first
    const alphaVantageData = await getAlphaVantageData(symbol);
    if (alphaVantageData) {
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify(alphaVantageData)
      };
    }

    // Try Alpaca as backup
    const alpacaData = await getAlpacaData(symbol);
    if (alpacaData) {
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify(alpacaData)
      };
    }

    // If both fail, return error (NO MOCK DATA)
    throw new Error('Unable to fetch real-time data from any provider');

  } catch (error) {
    console.error('Stock data error:', error);
    
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: 'Real-time data temporarily unavailable',
        message: `Unable to fetch live data for ${symbol}. Please try again.`,
        symbol: symbol,
        timestamp: new Date().toISOString()
      })
    };
  }
};

// Alpha Vantage API - Real data only
async function getAlphaVantageData(symbol) {
  try {
    const apiKey = process.env.ALPHA_VANTAGE_API_KEY;
    if (!apiKey) {
      console.error('Alpha Vantage API key not configured');
      return null;
    }

    // Get quote data
    const quoteUrl = `https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${symbol}&apikey=${apiKey}`;
    const quoteResponse = await fetch(quoteUrl);
    
    if (!quoteResponse.ok) {
      throw new Error(`Alpha Vantage API error: ${quoteResponse.status}`);
    }
    
    const quoteData = await quoteResponse.json();
    
    if (quoteData['Error Message'] || quoteData['Note']) {
      console.log('Alpha Vantage API limit or error:', quoteData);
      return null;
    }
    
    const quote = quoteData['Global Quote'];
    if (!quote) {
      console.log('No quote data from Alpha Vantage');
      return null;
    }

    // Get company overview for additional data
    let companyData = {};
    try {
      const overviewUrl = `https://www.alphavantage.co/query?function=OVERVIEW&symbol=${symbol}&apikey=${apiKey}`;
      const overviewResponse = await fetch(overviewUrl);
      if (overviewResponse.ok) {
        const overview = await overviewResponse.json();
        if (overview && !overview['Error Message']) {
          companyData = overview;
        }
      }
    } catch (overviewError) {
      console.log('Company overview fetch failed:', overviewError.message);
    }

    // Return structured data - ALL REAL
    return {
      symbol: symbol,
      price: parseFloat(quote['05. price']),
      change: parseFloat(quote['09. change']),
      changePercent: quote['10. change percent'],
      volume: parseInt(quote['06. volume']),
      previousClose: parseFloat(quote['08. previous close']),
      open: parseFloat(quote['02. open']),
      high: parseFloat(quote['03. high']),
      low: parseFloat(quote['04. low']),
      marketCap: companyData.MarketCapitalization || null,
      peRatio: companyData.PERatio || null,
      high52Week: companyData['52WeekHigh'] || null,
      low52Week: companyData['52WeekLow'] || null,
      dividendYield: companyData.DividendYield || null,
      beta: companyData.Beta || null,
      sector: companyData.Sector || null,
      industry: companyData.Industry || null,
      description: companyData.Description || null,
      source: 'Alpha Vantage',
      timestamp: new Date().toISOString(),
      lastUpdated: quote['07. latest trading day']
    };

  } catch (error) {
    console.error('Alpha Vantage error:', error);
    return null;
  }
}

// Alpaca API - Backup real data source
async function getAlpacaData(symbol) {
  try {
    const apiKey = process.env.ALPACA_API_KEY;
    const secretKey = process.env.ALPACA_SECRET_KEY;
    
    if (!apiKey || !secretKey) {
      console.error('Alpaca API credentials not configured');
      return null;
    }

    const headers = {
      'APCA-API-KEY-ID': apiKey,
      'APCA-API-SECRET-KEY': secretKey
    };

    // Get latest trade
    const tradesUrl = `https://data.alpaca.markets/v2/stocks/${symbol}/trades/latest`;
    const tradesResponse = await fetch(tradesUrl, { headers });
    
    if (!tradesResponse.ok) {
      throw new Error(`Alpaca API error: ${tradesResponse.status}`);
    }
    
    const tradesData = await tradesResponse.json();
    
    if (!tradesData.trade) {
      console.log('No trade data from Alpaca');
      return null;
    }

    // Get latest quote
    let quoteData = {};
    try {
      const quotesUrl = `https://data.alpaca.markets/v2/stocks/${symbol}/quotes/latest`;
      const quotesResponse = await fetch(quotesUrl, { headers });
      if (quotesResponse.ok) {
        quoteData = await quotesResponse.json();
      }
    } catch (quoteError) {
      console.log('Quote fetch failed:', quoteError.message);
    }

    // Get snapshot for additional data
    let snapshotData = {};
    try {
      const snapshotUrl = `https://data.alpaca.markets/v2/stocks/${symbol}/snapshot`;
      const snapshotResponse = await fetch(snapshotUrl, { headers });
      if (snapshotResponse.ok) {
        snapshotData = await snapshotResponse.json();
      }
    } catch (snapshotError) {
      console.log('Snapshot fetch failed:', snapshotError.message);
    }

    // Return structured data - ALL REAL
    const snapshot = snapshotData.snapshot || {};
    const dailyBar = snapshot.dailyBar || {};
    const prevDailyBar = snapshot.prevDailyBar || {};

    return {
      symbol: symbol,
      price: tradesData.trade.p,
      volume: dailyBar.v || null,
      open: dailyBar.o || null,
      high: dailyBar.h || null,
      low: dailyBar.l || null,
      previousClose: prevDailyBar.c || null,
      change: prevDailyBar.c ? (tradesData.trade.p - prevDailyBar.c) : null,
      changePercent: prevDailyBar.c ? 
        `${(((tradesData.trade.p - prevDailyBar.c) / prevDailyBar.c) * 100).toFixed(2)}%` : null,
      bid: quoteData.quote?.bp || null,
      ask: quoteData.quote?.ap || null,
      bidSize: quoteData.quote?.bs || null,
      askSize: quoteData.quote?.as || null,
      source: 'Alpaca',
      timestamp: new Date().toISOString(),
      lastUpdated: tradesData.trade.t
    };

  } catch (error) {
    console.error('Alpaca error:', error);
    return null;
  }
}
