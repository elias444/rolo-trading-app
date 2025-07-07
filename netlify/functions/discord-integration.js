// netlify/functions/discord-integration.js - DISCORD BOT SENTIMENT INTEGRATION
exports.handler = async (event, context) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS'
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  try {
    const { symbol, action } = event.queryStringParameters;
    const DISCORD_BOT_TOKEN = process.env.DISCORD_BOT_TOKEN;
    const DISCORD_CHANNEL_ID = process.env.DISCORD_CHANNEL_ID; // Your trading channel ID
    
    if (!DISCORD_BOT_TOKEN) {
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ 
          error: 'Discord bot token not configured',
          setup: 'Add DISCORD_BOT_TOKEN to Netlify environment variables'
        })
      };
    }

    console.log(`Discord integration: ${action} for ${symbol}`);
    
    switch (action) {
      case 'sentiment':
        return await getDiscordSentiment(symbol, DISCORD_BOT_TOKEN, DISCORD_CHANNEL_ID);
      
      case 'post_analysis':
        return await postToDiscord(symbol, event.body, DISCORD_BOT_TOKEN, DISCORD_CHANNEL_ID);
      
      case 'get_mentions':
        return await getRecentMentions(symbol, DISCORD_BOT_TOKEN, DISCORD_CHANNEL_ID);
      
      default:
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({ error: 'Invalid action. Use: sentiment, post_analysis, or get_mentions' })
        };
    }

  } catch (error) {
    console.error('Discord integration error:', error);
    
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        error: `Discord integration failed: ${error.message}`
      })
    };
  }
};

// 💬 GET DISCORD SENTIMENT for a specific symbol
async function getDiscordSentiment(symbol, botToken, channelId) {
  try {
    // Fetch recent messages from your Discord trading channel
    const messagesUrl = `https://discord.com/api/v10/channels/${channelId}/messages?limit=100`;
    
    const response = await fetch(messagesUrl, {
      headers: {
        'Authorization': `Bot ${botToken}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      throw new Error(`Discord API error: ${response.status}`);
    }
    
    const messages = await response.json();
    
    // Filter messages mentioning the symbol
    const symbolMessages = messages.filter(msg => 
      msg.content.toUpperCase().includes(symbol.toUpperCase()) ||
      msg.content.toUpperCase().includes(`$${symbol.toUpperCase()}`)
    );
    
    // Analyze sentiment of symbol-related messages
    const sentimentAnalysis = analyzeSentiment(symbolMessages, symbol);
    
    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        symbol: symbol,
        discord: {
          totalMessages: symbolMessages.length,
          bullishCount: sentimentAnalysis.bullish,
          bearishCount: sentimentAnalysis.bearish,
          neutralCount: sentimentAnalysis.neutral,
          overallSentiment: sentimentAnalysis.overall,
          confidence: sentimentAnalysis.confidence,
          recentMessages: sentimentAnalysis.recentMessages,
          topKeywords: sentimentAnalysis.keywords,
          timestamp: new Date().toISOString()
        }
      })
    };
    
  } catch (error) {
    console.error('Discord sentiment fetch failed:', error);
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: error.message })
    };
  }
}

// 📤 POST ANALYSIS TO DISCORD
async function postToDiscord(symbol, analysisData, botToken, channelId) {
  try {
    const analysis = JSON.parse(analysisData || '{}');
    
    // Create a rich embed with the analysis
    const embed = {
      title: `🤖 Rolo AI Analysis: ${symbol}`,
      color: 0x7c3aed, // Purple color
      fields: [
        {
          name: '📊 Current Price',
          value: `$${analysis.price || 'N/A'}`,
          inline: true
        },
        {
          name: '📈 Change',
          value: `${analysis.change >= 0 ? '+' : ''}${analysis.change || 'N/A'}%`,
          inline: true
        },
        {
          name: '💭 Sentiment',
          value: analysis.sentiment || 'Mixed',
          inline: true
        },
        {
          name: '🎯 Strategy',
          value: analysis.strategy || 'Analyzing...',
          inline: false
        }
      ],
      timestamp: new Date().toISOString(),
      footer: {
        text: 'Rolo AI Trading Assistant'
      }
    };
    
    const messagePayload = {
      embeds: [embed],
      content: `📊 **${symbol} Analysis Complete**`
    };
    
    const response = await fetch(`https://discord.com/api/v10/channels/${channelId}/messages`, {
      method: 'POST',
      headers: {
        'Authorization': `Bot ${botToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(messagePayload)
    });
    
    if (!response.ok) {
      throw new Error(`Discord post failed: ${response.status}`);
    }
    
    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ success: true, message: 'Analysis posted to Discord' })
    };
    
  } catch (error) {
    console.error('Discord post failed:', error);
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: error.message })
    };
  }
}

// 📜 GET RECENT MENTIONS of a symbol
async function getRecentMentions(symbol, botToken, channelId) {
  try {
    const messagesUrl = `https://discord.com/api/v10/channels/${channelId}/messages?limit=50`;
    
    const response = await fetch(messagesUrl, {
      headers: {
        'Authorization': `Bot ${botToken}`,
        'Content-Type': 'application/json'
      }
    });
    
    const messages = await response.json();
    
    // Find recent mentions
    const mentions = messages
      .filter(msg => 
        msg.content.toUpperCase().includes(symbol.toUpperCase()) ||
        msg.content.toUpperCase().includes(`$${symbol.toUpperCase()}`)
      )
      .slice(0, 10)
      .map(msg => ({
        content: msg.content,
        author: msg.author.username,
        timestamp: msg.timestamp,
        sentiment: detectMessageSentiment(msg.content)
      }));
    
    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        symbol: symbol,
        mentions: mentions,
        totalFound: mentions.length
      })
    };
    
  } catch (error) {
    console.error('Discord mentions fetch failed:', error);
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: error.message })
    };
  }
}

// 🧠 SENTIMENT ANALYSIS FUNCTIONS

function analyzeSentiment(messages, symbol) {
  let bullish = 0;
  let bearish = 0;
  let neutral = 0;
  
  const keywords = {
    bullish: ['moon', 'calls', 'buy', 'long', 'bull', 'up', 'rocket', 'green', 'pump', 'breakout', 'rally', 'surge'],
    bearish: ['puts', 'short', 'sell', 'bear', 'down', 'red', 'dump', 'crash', 'drop', 'fall', 'correction']
  };
  
  const keywordCounts = {};
  const recentMessages = [];
  
  messages.forEach(msg => {
    const content = msg.content.toLowerCase();
    let sentiment = 'neutral';
    let bullishScore = 0;
    let bearishScore = 0;
    
    // Count keyword occurrences
    keywords.bullish.forEach(word => {
      if (content.includes(word)) {
        bullishScore++;
        keywordCounts[word] = (keywordCounts[word] || 0) + 1;
      }
    });
    
    keywords.bearish.forEach(word => {
      if (content.includes(word)) {
        bearishScore++;
        keywordCounts[word] = (keywordCounts[word] || 0) + 1;
      }
    });
    
    // Determine message sentiment
    if (bullishScore > bearishScore) {
      sentiment = 'bullish';
      bullish++;
    } else if (bearishScore > bullishScore) {
      sentiment = 'bearish';
      bearish++;
    } else {
      sentiment = 'neutral';
      neutral++;
    }
    
    // Add to recent messages (limit to 5 most recent)
    if (recentMessages.length < 5) {
      recentMessages.push({
        content: msg.content.substring(0, 100), // Truncate long messages
        sentiment: sentiment,
        author: msg.author.username,
        timestamp: msg.timestamp
      });
    }
  });
  
  // Calculate overall sentiment
  const total = bullish + bearish + neutral;
  let overall = 'neutral';
  let confidence = 0;
  
  if (total > 0) {
    if (bullish > bearish && bullish > neutral) {
      overall = 'bullish';
      confidence = Math.round((bullish / total) * 100);
    } else if (bearish > bullish && bearish > neutral) {
      overall = 'bearish';
      confidence = Math.round((bearish / total) * 100);
    } else {
      overall = 'neutral';
      confidence = Math.round((neutral / total) * 100);
    }
  }
  
  // Get top keywords
  const topKeywords = Object.entries(keywordCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([word, count]) => `${word} (${count})`);
  
  return {
    bullish,
    bearish,
    neutral,
    overall,
    confidence,
    recentMessages,
    keywords: topKeywords
  };
}

function detectMessageSentiment(content) {
  const lowerContent = content.toLowerCase();
  
  const bullishWords = ['moon', 'calls', 'buy', 'long', 'bull', 'up', 'rocket', 'green', 'pump'];
  const bearishWords = ['puts', 'short', 'sell', 'bear', 'down', 'red', 'dump', 'crash'];
  
  let bullishCount = bullishWords.filter(word => lowerContent.includes(word)).length;
  let bearishCount = bearishWords.filter(word => lowerContent.includes(word)).length;
  
  if (bullishCount > bearishCount) return 'bullish';
  if (bearishCount > bullishCount) return 'bearish';
  return 'neutral';
}