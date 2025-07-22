// netlify/functions/comprehensive-ai-analysis.js
// Integrates multiple sources for analysis/smartplays/alerts

exports.handler = async (event) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Content-Type': 'application/json'
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  const body = JSON.parse(event.body);
  const { symbol, type } = body; // type: 'analysis', 'smartplays', 'alerts'

  const ALPHA_VANTAGE_API_KEY = process.env.ALPHA_VANTAGE_API_KEY;
  const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

  if (!ALPHA_VANTAGE_API_KEY || !GEMINI_API_KEY) {
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: "API keys not configured" })
    };
  }

  try {
    // Fetch quote
    const quoteUrl = `https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${symbol || 'SPY'}&apikey=${ALPHA_VANTAGE_API_KEY}`;
    const quoteResponse = await fetch(quoteUrl);
    const quoteData = await quoteResponse.json();

    // Fetch news sentiment
    const newsUrl = `https://www.alphavantage.co/query?function=NEWS_SENTIMENT&tickers=${symbol || 'SPY'}&apikey=${ALPHA_VANTAGE_API_KEY}`;
    const newsSentimentResponse = await fetch(newsUrl);
    const newsData = await newsSentimentResponse.json();

    // Fetch top movers
    const moversUrl = `https://www.alphavantage.co/query?function=TOP_GAINERS_LOSERS&apikey=${ALPHA_VANTAGE_API_KEY}`;
    const moversResponse = await fetch(moversUrl);
    const moversData = await moversResponse.json();

    // Fetch VIX
    const vixUrl = `https://www.alphavantage.co/query?function=REAL_GDP&interval=annual&apikey=${ALPHA_VANTAGE_API_KEY}`; // Placeholder, use VIX quote
    const vixResponse = await fetch(vixUrl);
    const vixData = await vixResponse.json();

    // Fetch RSI
    const rsiUrl = `https://www.alphavantage.co/query?function=RSI&symbol=${symbol || 'SPY'}&interval=daily&time_period=14&series_type=close&apikey=${ALPHA_VANTAGE_API_KEY}`;
    const rsiResponse = await rsiUrl(fetch);
    const rsiData = await rsiResponse.json();

    // Yahoo Finance for chart and meta
    const yahooUrl = `https://query1.finance.yahoo.com/v8/finance/chart/${symbol || 'SPY'}?interval=1d`;
    const yahooResponse = await fetch(yahooUrl);
    const yahooData = await yahooResponse.json();

    // StockTwits sentiment
    const stockTwitsUrl = `https://api.stocktwits.com/api/2/streams/symbol/${symbol || 'SPY'}.json`;
    const stockTwitsResponse = await fetch(stockTwitsUrl);
    const stockTwitsData = await stockTwitsResponse.json();

    // Reddit posts (using a placeholder API, replace with actual if available)
    const redditUrl = `https://www.reddit.com/r/wallstreetbets/search.json?q=${symbol || 'SPY'}&restrict_sr=true&sort=new`;
    const redditResponse = await fetch(redditUrl);
    const redditData = await redditResponse.json();

    // Fetch options data
    const optionsResponse = await fetch(`${process.env.URL}/.netlify/functions/options-data?symbol=${symbol}`);
    const optionsData = await optionsResponse.json();

    // Fetch technical indicators
    const technicalResponse = await fetch(`${process.env.URL}/.netlify/functions/technical-indicators?symbol=${symbol}`);
    const technicalData = await technicalResponse.json();

    // Fetch news data
    const newsResponse = await fetch(`${process.env.URL}/.netlify/functions/news-data`);
    const newsData2 = await newsResponse.json();

    // Market dashboard for broader context
    const marketResponse = await fetch(`${process.env.URL}/.netlify/functions/market-dashboard`);
    const marketData2 = await marketResponse.json();

    // Construct Gemini prompt based on type
    let prompt = '';
    if (type === 'analysis') {
      prompt = `Provide detailed analysis for ${symbol}, including executive summary, market environment (session, volatility, sentiment from StockTwits/Reddit/news), technicals (RSI, MACD, Bollinger from technicalData, support/resistance), fundamentals (from yahooData), options flow (calls/puts volume from optionsData), trading plan (entries/stop/targets with confidence), recommendation (buy/sell/hold with catalysts/risks). Use all data: quote: ${JSON.stringify(quoteData)}, news: ${JSON.stringify(newsData)}, movers: ${JSON.stringify(moversData)}, vix: ${JSON.stringify(vixData)}, rsi: ${JSON.stringify(rsiData)}, yahoo: ${JSON.stringify(yahooData)}, stocktwits: ${JSON.stringify(stockTwitsData)}, reddit: ${JSON.stringify(redditData)}, options: ${JSON.stringify(optionsData)}, technical: ${JSON.stringify(technicalData)}, news2: ${JSON.stringify(newsData2)}, market: ${JSON.stringify(marketData2)}. Format as structured JSON.`;
    } else if (type === 'smartplays') {
      prompt = `Search all stocks, analyze buy/sell volume, options calls/puts volume, technical indicators, social sentiment (StockTwits/Reddit), news impact, to generate top 10 stock plays with confidence score >70%. For each: ticker, strategy, entry/stop/target, reasoning (based on all data). Use data: movers: ${JSON.stringify(moversData)}, news: ${JSON.stringify(newsData)}, options: ${JSON.stringify(optionsData)}, technical: ${JSON.stringify(technicalData)}, stocktwits/reddit/news/market as above. Format as JSON array of plays.`;
    } else if (type === 'alerts') {
      prompt = `Fetch top 10 news stories for potential price increases/decreases (from newsData), analyze for live/before-impact signals. For each: title, ticker, priority, description, action, timeframe. Use data: news: ${JSON.stringify(newsData)}, news2: ${JSON.stringify(newsData2)}, movers: ${JSON.stringify(moversData)}. Format as JSON array.`;
    }

    // Call Gemini with prompt
    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`;
    const geminiResponse = await fetch(geminiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { responseMimeType: 'application/json' }
      })
    });
    const geminiData = await geminiResponse.json();
    const generatedContent = geminiData.candidates[0].content.parts[0].text;
    const parsedContent = JSON.parse(generatedContent);

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ analysis: parsedContent, marketData: { session: marketStatus }, timestamp: new Date().toISOString(), dataQuality: { newsArticles: newsData.feed?.length || 0, sentiment: newsData.overall_sentiment_score || 'Neutral', vixLevel: vixData['Real GDP'][0]?.value || 'N/A' } })
    };
  } catch (error) {
    console.error('Error in comprehensive-ai-analysis:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Analysis error', fallback: true })
    };
  }
};