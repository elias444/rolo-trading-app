import React, { useState, useEffect, useCallback } from 'react';

const RoloApp = () => {
  const [activeTab, setActiveTab] = useState('ticker');
  const [searchTicker, setSearchTicker] = useState('');
  const [selectedStock, setSelectedStock] = useState('AAPL');
  const [stockData, setStockData] = useState({});
  const [marketData, setMarketData] = useState({});
  const [analysisData, setAnalysisData] = useState(null);
  const [smartPlays, setSmartPlays] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [isLoading, setIsLoading] = useState({
    stocks: false,
    analysis: false,
    plays: false,
    market: false,
    alerts: false
  });
  const [marketStatus, setMarketStatus] = useState('Loading...');
  const [chatMessages, setChatMessages] = useState([
    { role: 'ai', content: "Hello! I'm Rolo, your 24/7 AI trading assistant with access to real-time market data, futures, pre-market, news, and social sentiment. How can I help you today?" }
  ]);
  const [chatInput, setChatInput] = useState('');
  const [popularStocks, setPopularStocks] = useState(['AAPL', 'TSLA', 'NVDA', 'SPY', 'QQQ', 'META', 'AMD', 'GOOGL', 'MSFT']);
  const [isEditingStocks, setIsEditingStocks] = useState(false);
  const [lastUpdate, setLastUpdate] = useState(new Date());

  // Enhanced market status detection
  const checkMarketStatus = useCallback(() => {
    const now = new Date();
    const utcTime = now.getTime() + (now.getTimezoneOffset() * 60000);
    const est = new Date(utcTime + (-5 * 3600000));
    const hours = est.getHours();
    const minutes = est.getMinutes();
    const day = est.getDay();
    const totalMinutes = hours * 60 + minutes;
    
    let status = 'Market Closed';
    
    if (day === 0) { // Sunday
      if (hours >= 18) {
        status = 'Futures Open';
      } else {
        status = 'Weekend';
      }
    } else if (day === 6) { // Saturday
      status = 'Weekend';
    } else { // Monday-Friday
      if (totalMinutes >= 240 && totalMinutes < 570) { // 4:00 AM - 9:30 AM
        status = 'Pre-Market';
      } else if (totalMinutes >= 570 && totalMinutes < 960) { // 9:30 AM - 4:00 PM
        status = 'Market Open';
      } else if (totalMinutes >= 960 && totalMinutes < 1200) { // 4:00 PM - 8:00 PM
        status = 'After Hours';
      } else if (totalMinutes >= 1080 || totalMinutes < 240) { // 6:00 PM - 4:00 AM
        status = 'Futures Open';
      } else {
        status = 'Market Closed';
      }
    }
    
    setMarketStatus(status);
    setLastUpdate(new Date());
  }, []);

  // Auto-refresh intervals based on market session
  const getRefreshInterval = useCallback(() => {
    switch (marketStatus) {
      case 'Market Open':
        return 30000; // 30 seconds during market hours
      case 'Pre-Market':
      case 'After Hours':
        return 60000; // 1 minute during extended hours
      case 'Futures Open':
        return 120000; // 2 minutes during futures
      default:
        return 300000; // 5 minutes when closed
    }
  }, [marketStatus]);

  useEffect(() => {
    checkMarketStatus();
    const statusInterval = setInterval(checkMarketStatus, 60000); // Check every minute
    return () => clearInterval(statusInterval);
  }, [checkMarketStatus]);

  // Enhanced stock data fetching with session awareness
  const fetchStockData = useCallback(async (symbol) => {
    if (!symbol) return;
    
    setIsLoading(prev => ({ ...prev, stocks: true }));
    try {
      const response = await fetch(`/.netlify/functions/enhanced-stock-data?symbol=${symbol}`);
      if (response.ok) {
        const data = await response.json();
        setStockData(prev => ({ 
          ...prev, 
          [symbol]: {
            ...data,
            marketSession: marketStatus,
            lastFetched: new Date().toISOString()
          }
        }));
      } else {
        console.error(`Failed to fetch data for ${symbol}:`, response.status);
      }
    } catch (error) {
      console.error('Error fetching stock data:', error);
    } finally {
      setIsLoading(prev => ({ ...prev, stocks: false }));
    }
  }, [marketStatus]);

  // 24/7 AI Analysis with comprehensive data
  const fetchAIAnalysis = useCallback(async (symbol) => {
    if (!symbol) return;
    
    setIsLoading(prev => ({ ...prev, analysis: true }));
    setAnalysisData(null);
    
    try {
      const response = await fetch('/.netlify/functions/comprehensive-ai-analysis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ symbol, type: 'analysis' }),
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.analysis && !data.analysis.fallback) {
          setAnalysisData({
            ...data.analysis,
            dataQuality: data.dataQuality,
            marketSession: data.marketData.session,
            lastUpdated: data.timestamp
          });
        }
      } else {
        console.error('AI Analysis failed:', response.status);
      }
    } catch (error) {
      console.error('Error fetching AI analysis:', error);
    } finally {
      setIsLoading(prev => ({ ...prev, analysis: false }));
    }
  }, []);

  // Smart plays with real-time market opportunities
  const fetchSmartPlays = useCallback(async () => {
    setIsLoading(prev => ({ ...prev, plays: true }));
    setSmartPlays([]);
    
    try {
      const response = await fetch('/.netlify/functions/smart-plays-generator');
      if (response.ok) {
        const data = await response.json();
        if (data.plays && data.plays.length > 0) {
          setSmartPlays(data.plays.map(play => ({
            ...play,
            marketSession: data.marketSession,
            dataQuality: data.dataQuality,
            lastUpdated: data.timestamp
          })));
        }
      }
    } catch (error) {
      console.error('Error fetching smart plays:', error);
    } finally {
      setIsLoading(prev => ({ ...prev, plays: false }));
    }
  }, []);

  // Enhanced market dashboard with futures and pre-market
  const fetchMarketDashboard = useCallback(async () => {
    setIsLoading(prev => ({ ...prev, market: true }));
    try {
      const response = await fetch('/.netlify/functions/market-dashboard');
      if (response.ok) {
        const data = await response.json();
        if (data && Object.keys(data).length > 0) {
          setMarketData({
            ...data,
            marketSession: marketStatus,
            lastUpdated: new Date().toISOString()
          });
        }
      }
    } catch (error) {
      console.error('Error fetching market data:', error);
    } finally {
      setIsLoading(prev => ({ ...prev, market: false }));
    }
  }, [marketStatus]);

  // Real-time alerts with comprehensive monitoring
  const fetchAlerts = useCallback(async () => {
    setIsLoading(prev => ({ ...prev, alerts: true }));
    setAlerts([]);
    
    try {
      const response = await fetch('/.netlify/functions/realtime-alerts');
      if (response.ok) {
        const data = await response.json();
        if (data.alerts && data.alerts.length > 0) {
          setAlerts(data.alerts.map(alert => ({
            ...alert,
            marketSession: data.marketSession,
            dataQuality: data.dataQuality,
            timestamp: data.timestamp
          })));
        }
      }
    } catch (error) {
      console.error('Error fetching alerts:', error);
    } finally {
      setIsLoading(prev => ({ ...prev, alerts: false }));
    }
  }, []);

  // Auto-refresh system based on market conditions
  useEffect(() => {
    const interval = getRefreshInterval();
    
    const refreshData = () => {
      // Always refresh popular stocks
      popularStocks.forEach(symbol => {
        fetchStockData(symbol);
      });
      
      // Refresh current tab data
      switch (activeTab) {
        case 'analysis':
          if (selectedStock) fetchAIAnalysis(selectedStock);
          break;
        case 'plays':
          fetchSmartPlays();
          break;
        case 'market':
          fetchMarketDashboard();
          break;
        case 'alerts':
          fetchAlerts();
          break;
      }
    };

    // Initial load
    refreshData();
    
    // Set up auto-refresh
    const refreshInterval = setInterval(refreshData, interval);
    
    return () => clearInterval(refreshInterval);
  }, [activeTab, selectedStock, popularStocks, getRefreshInterval, fetchStockData, fetchAIAnalysis, fetchSmartPlays, fetchMarketDashboard, fetchAlerts]);

  // Event handlers
  const handleTabChange = useCallback((tabId) => {
    setActiveTab(tabId);
  }, []);

  const handleSearch = useCallback(() => {
    if (searchTicker && searchTicker.trim()) {
      const ticker = searchTicker.toUpperCase().trim();
      setSelectedStock(ticker);
      fetchStockData(ticker);
      setSearchTicker('');
    }
  }, [searchTicker, fetchStockData]);

  const handleSendMessage = useCallback(async () => {
    if (!chatInput.trim()) return;
    
    setChatMessages(prev => [...prev, { role: 'user', content: chatInput }]);
    const message = chatInput;
    setChatInput('');
    
    try {
      const response = await fetch('/.netlify/functions/enhanced-rolo-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          message: `${message} (Context: Currently viewing ${selectedStock}, Market is ${marketStatus}, Time: ${new Date().toLocaleString()})`,
          context: { selectedStock, marketStatus, activeTab }
        }),
      });
      if (response.ok) {
        const data = await response.json();
        setChatMessages(prev => [...prev, { role: 'ai', content: data.response || 'Sorry, I encountered an error accessing real-time data.' }]);
      }
    } catch (error) {
      console.error('Error fetching chat response:', error);
      setChatMessages(prev => [...prev, { role: 'ai', content: 'Sorry, I encountered an error. Please try again.' }]);
    }
  }, [chatInput, selectedStock, marketStatus, activeTab]);

  const handleEditStocks = useCallback(() => {
    setIsEditingStocks(!isEditingStocks);
  }, [isEditingStocks]);

  const handleStockEdit = useCallback((index, newSymbol) => {
    if (newSymbol && newSymbol.trim()) {
      const updatedStocks = [...popularStocks];
      updatedStocks[index] = newSymbol.toUpperCase().trim();
      setPopularStocks(updatedStocks);
      localStorage.setItem('roloPopularStocks', JSON.stringify(updatedStocks));
    }
  }, [popularStocks]);

  const addStock = useCallback(() => {
    if (popularStocks.length < 12) {
      const newStocks = [...popularStocks, ''];
      setPopularStocks(newStocks);
    }
  }, [popularStocks]);

  const removeStock = useCallback((index) => {
    if (popularStocks.length > 3) {
      const newStocks = popularStocks.filter((_, i) => i !== index);
      setPopularStocks(newStocks);
      localStorage.setItem('roloPopularStocks', JSON.stringify(newStocks));
    }
  }, [popularStocks]);

  // Load saved stocks on component mount
  useEffect(() => {
    const savedStocks = localStorage.getItem('roloPopularStocks');
    if (savedStocks) {
      try {
        const parsedStocks = JSON.parse(savedStocks);
        if (Array.isArray(parsedStocks) && parsedStocks.length >= 3) {
          setPopularStocks(parsedStocks);
        }
      } catch (e) {
        console.error('Failed to load saved stocks:', e);
      }
    }
  }, []);

  const getMarketStatusStyle = () => {
    const baseStyle = {
      display: 'inline-flex',
      alignItems: 'center',
      padding: '6px 16px',
      borderRadius: '20px',
      fontSize: '14px',
      fontWeight: '600',
      textTransform: 'uppercase'
    };
    
    switch (marketStatus) {
      case 'Market Open':
        return { ...baseStyle, backgroundColor: '#064E3B', color: '#10B981', border: '1px solid #10B981' };
      case 'Pre-Market':
      case 'After Hours':
        return { ...baseStyle, backgroundColor: '#7C2D12', color: '#F59E0B', border: '1px solid #F59E0B' };
      case 'Futures Open':
        return { ...baseStyle, backgroundColor: '#1E3A8A', color: '#3B82F6', border: '1px solid #3B82F6' };
      case 'Weekend':
        return { ...baseStyle, backgroundColor: '#374151', color: '#9CA3AF', border: '1px solid #9CA3AF' };
      default:
        return { ...baseStyle, backgroundColor: '#1F2937', color: '#9CA3AF', border: '1px solid #9CA3AF' };
    }
  };

  const getMarketStatusDot = () => {
    const baseStyle = {
      width: '10px',
      height: '10px',
      borderRadius: '50%',
      marginRight: '8px',
      animation: marketStatus === 'Market Open' || marketStatus === 'Futures Open' ? 'pulse 2s infinite' : 'none'
    };
    
    switch (marketStatus) {
      case 'Market Open':
        return { ...baseStyle, backgroundColor: '#10B981' };
      case 'Pre-Market':
      case 'After Hours':
        return { ...baseStyle, backgroundColor: '#F59E0B' };
      case 'Futures Open':
        return { ...baseStyle, backgroundColor: '#3B82F6' };
      default:
        return { ...baseStyle, backgroundColor: '#9CA3AF' };
    }
  };

  const getUpdateFrequency = () => {
    switch (marketStatus) {
      case 'Market Open': return 'Updates every 30 seconds';
      case 'Pre-Market':
      case 'After Hours': return 'Updates every 1 minute';
      case 'Futures Open': return 'Updates every 2 minutes';
      default: return 'Updates every 5 minutes';
    }
  };

  return (
    
      {/* Enhanced Header */}
      
        
Rolo AI
        
24/7 AI Trading Assistant - Real-Time Data
        
          
            
            {marketStatus}
          
        
        
          {getUpdateFrequency()} • Last: {lastUpdate.toLocaleTimeString()}
        
      

      {/* Main Content */}
      
        {activeTab === 'ticker' && (
          
            {/* Search Bar */}
            
              
                {searchTicker} setSearchTicker(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                  placeholder="Enter ticker symbol"
                  style={{
                    flex: 1,
                    backgroundColor: '#1a1a1a',
                    border: '1px solid #374151',
                    borderRadius: '12px',
                    padding: '12px 16px',
                    color: '#ffffff',
                    fontSize: '16px',
                    outline: 'none',
                  }}
                />
                
                  Search
                
              
            

            {/* Popular Stocks */}
            
              
                
                  📈 
                  Popular Stocks
                  
                    ({marketStatus})
                  
                
                
                  {isEditingStocks ? 'Done' : 'Edit'}
                
              
              
              {isLoading.stocks && Object.keys(stockData).length === 0 && (
                
                  
🔄
                  
Loading real-time {marketStatus.toLowerCase()} data...
                
              )}

              {!isLoading.stocks && Object.keys(stockData).length === 0 && (
                
                  
📊
                  
No real stock data available
                  
                    Check your API configuration
                  
                
              )}

              {Object.keys(stockData).length > 0 && (
                
                  
                    {popularStocks.map((symbol, index) => {
                      const data = stockData[symbol];
                      const isSelected = selectedStock === symbol;
                      
                      return (
                        
 !isEditingStocks && setSelectedStock(symbol)}
                          style={{
                            backgroundColor: '#1a1a1a',
                            border: `1px solid ${isSelected ? '#3B82F6' : '#374151'}`,
                            borderRadius: '12px',
                            padding: '12px',
                            textAlign: 'center',
                            cursor: isEditingStocks ? 'default' : 'pointer',
                            transition: 'all 0.2s',
                            position: 'relative'
                          }}
                        >
                          {isEditingStocks ? (
                            
                              {symbol} handleStockEdit(index, e.target.value)}
                                onBlur={(e) => handleStockEdit(index, e.target.value)}
                                style={{
                                  backgroundColor: 'transparent',
                                  border: '1px solid #374151',
                                  borderRadius: '4px',
                                  padding: '4px',
                                  color: '#ffffff',
                                  fontSize: '12px',
                                  textAlign: 'center',
                                  width: '60px'
                                }}
                              />
                              {popularStocks.length > 3 && (
                                 removeStock(index)}
                                  style={{
                                    position: 'absolute',
                                    top: '4px',
                                    right: '4px',
                                    backgroundColor: '#EF4444',
                                    color: '#ffffff',
                                    border: 'none',
                                    borderRadius: '50%',
                                    width: '16px',
                                    height: '16px',
                                    fontSize: '10px',
                                    cursor: 'pointer'
                                  }}
                                >
                                  ×
                                
                              )}
                            
                          ) : (
                            <>
                              
                                {symbol}
                              
                              {data ? (
                                <>
                                  
                                    ${data.price}
                                  
                                  
= 0 ? '#10B981' : '#EF4444'
                                  }}>
                                    {data.changePercent}
                                  
                                  
                                    {data.marketSession || marketStatus}
                                  
                                
                              ) : (
                                
Loading...
                              )}
                            
                          )}
                        
                      );
                    })}
                    
                    {isEditingStocks && popularStocks.length < 12 && (
                      
                        +
                      
                    )}
                  
                
              )}

              {/* Selected Stock Details */}
              {selectedStock && stockData[selectedStock] && (
                
                  
                    
                      
                        {selectedStock}
                      
                      
                        {stockData[selectedStock].marketSession || marketStatus} • {stockData[selectedStock].dataSource || 'Real-time'}
                      
                      {stockData[selectedStock].lastFetched && (
                        
                          Updated: {new Date(stockData[selectedStock].lastFetched).toLocaleTimeString()}
                        
                      )}
                    
                    
                      
= 0 ? '#10B981' : '#EF4444',
                        margin: '0',
                      }}>
                        ${stockData[selectedStock].price}
                      
                      
= 0 ? '#10B981' : '#EF4444'
                      }}>
                        {stockData[selectedStock].change} ({stockData[selectedStock].changePercent})
                      
                    
                  

                  
                    {[
                      { label: 'VOLUME', value: stockData[selectedStock].volume },
                      { label: 'HIGH', value: `${stockData[selectedStock].high}` },
                      { label: 'LOW', value: `${stockData[selectedStock].low}` },
                      { label: 'OPEN', value: `${stockData[selectedStock].open}` }
                    ].map(metric => (
                      
                        
{metric.label}
                        
{metric.value}
                      
                    ))}
                  
                
              )}
            
          
        )}

        {activeTab === 'analysis' && (
          
            
              
                {selectedStock} Analysis
              
              
                24/7 AI-Powered Analysis - {marketStatus}
              
              {analysisData && analysisData.lastUpdated && (
                
                  Last Updated: {new Date(analysisData.lastUpdated).toLocaleString()}
                
              )}
            

            {isLoading.analysis && (
              
                
🔄
                
Analyzing {selectedStock} with comprehensive real-time data...
                
                  Including futures, pre-market, news, social sentiment, and economic indicators
                
              
            )}

            {!isLoading.analysis && !analysisData && (
              
                
📊
                
No comprehensive analysis available
                
                  AI analysis requires real market data access
                
              
            )}

            {analysisData && !isLoading.analysis && (
              
                {/* Executive Summary */}
                {analysisData.summary && (
                  
                    
                      📋 Executive Summary
                    
                    
{analysisData.summary}
                  
                )}

                {/* Market Environment */}
                {analysisData.marketEnvironment && (
                  
                    
                      🌍 Market Environment
                    
                    
                      
                        
SESSION
                        
{analysisData.marketEnvironment.session}
                      
                      
                        
VOLATILITY
                        
{analysisData.marketEnvironment.volatility}
                      
                      
                        
SENTIMENT
                        
{analysisData.marketEnvironment.sentiment}
                      
                    
                    {analysisData.marketEnvironment.keyDrivers && (
                      
                        
Key Market Drivers:
                        
                          {analysisData.marketEnvironment.keyDrivers.map((driver, idx) => (
                            
{driver}
                          ))}
                        
                      
                    )}
                  
                )}

                {/* Technical Analysis */}
                {analysisData.technicalAnalysis && (
                  
                    
                      📈 Technical Analysis
                    
                    
                    
                      
                        
TREND
                        
                          {analysisData.technicalAnalysis.trend?.toUpperCase()}
                        
                      
                      
                        
STRENGTH
                        
                          {analysisData.technicalAnalysis.strength?.toUpperCase()}
                        
                      
                      {analysisData.technicalAnalysis.indicators?.rsi && (
                        
                          
RSI
                          
                            {analysisData.technicalAnalysis.indicators.rsi.value} ({analysisData.technicalAnalysis.indicators.rsi.signal})
                          
                        
                      )}
                    

                    {/* Support and Resistance Levels */}
                    {analysisData.technicalAnalysis.keyLevels && (
                      
                        
                          
                            Support Levels:
                          
                          {analysisData.technicalAnalysis.keyLevels.support?.map((level, idx) => (
                            
                              ${level}
                            
                          ))}
                        
                        
                          
                            Resistance Levels:
                          
                          {analysisData.technicalAnalysis.keyLevels.resistance?.map((level, idx) => (
                            
                              ${level}
                            
                          ))}
                        
                      
                    )}
                  
                )}

                {/* Trading Plan */}
                {analysisData.tradingPlan && (
                  
                    
                      🎯 Trading Plan
                    
                    
                    {/* Entry Points */}
                    {analysisData.tradingPlan.entries && (
                      
                        
Entry Points:
                        {analysisData.tradingPlan.entries.map((entry, idx) => (
                          
                            
                              ${entry.price}
                              {entry.confidence && (
                                
                                  {entry.confidence}% confidence
                                
                              )}
                            
                            
                              {entry.reasoning || entry.reason}
                            
                          
                        ))}
                      
                    )}

                    {/* Stop Loss and Targets */}
                    
                      {analysisData.tradingPlan.stopLoss && (
                        
                          
STOP LOSS
                          
                            ${typeof analysisData.tradingPlan.stopLoss === 'object' ? 
                              analysisData.tradingPlan.stopLoss.price : 
                              analysisData.tradingPlan.stopLoss}
                          
                          {typeof analysisData.tradingPlan.stopLoss === 'object' && analysisData.tradingPlan.stopLoss.reasoning && (
                            
                              {analysisData.tradingPlan.stopLoss.reasoning}
                            
                          )}
                        
                      )}

                      {analysisData.tradingPlan.targets && (
                        <>
                          {analysisData.tradingPlan.targets.short && (
                            
                              
SHORT TARGET
                              
                                ${analysisData.tradingPlan.targets.short.price}
                              
                              
                                {analysisData.tradingPlan.targets.short.timeframe}
                                {analysisData.tradingPlan.targets.short.probability && 
                                  ` • ${analysisData.tradingPlan.targets.short.probability}% prob`}
                              
                            
                          )}

                          {analysisData.tradingPlan.targets.long && (
                            
                              
LONG TARGET
                              
                                ${analysisData.tradingPlan.targets.long.price}
                              
                              
                                {analysisData.tradingPlan.targets.long.timeframe}
                                {analysisData.tradingPlan.targets.long.probability && 
                                  ` • ${analysisData.tradingPlan.targets.long.probability}% prob`}
                              
                            
                          )}
                        
                      )}
                    

                    {analysisData.tradingPlan.riskReward && (
                      
                        
                          Risk/Reward Ratio: 
                          {analysisData.tradingPlan.riskReward}
                        
                      
                    )}
                  
                )}

                {/* Recommendation */}
                {analysisData.recommendation && (
                  
                    
                      🎯 Recommendation
                    
                    
                    
                      
                        {analysisData.recommendation.action?.toUpperCase()}
                      
                      {analysisData.recommendation.confidence && (
                        
                          
                            {analysisData.recommendation.confidence}%
                          
                          
Confidence
                        
                      )}
                    

                    {analysisData.recommendation.strategy && (
                      
                        Strategy: {analysisData.recommendation.strategy}
                      
                    )}

                    {analysisData.recommendation.timeframe && (
                      
                        Timeframe: {analysisData.recommendation.timeframe}
                      
                    )}

                    {analysisData.recommendation.catalysts && analysisData.recommendation.catalysts.length > 0 && (
                      
                        
                          Catalysts:
                        
                        
                          {analysisData.recommendation.catalysts.map((catalyst, idx) => (
                            
{catalyst}
                          ))}
                        
                      
                    )}

                    {analysisData.recommendation.risks && analysisData.recommendation.risks.length > 0 && (
                      
                        
                          Risks:
                        
                        
                          {analysisData.recommendation.risks.map((risk, idx) => (
                            
{risk}
                          ))}
                        
                      
                    )}
                  
                )}

                {/* Data Quality Indicator */}
                {analysisData.dataQuality && (
                  
                    
                      DATA QUALITY METRICS:
                    
                    
                      News: {analysisData.dataQuality.newsArticles || 0} articles
                      Sentiment: {analysisData.dataQuality.sentiment || 'Unknown'}
                      VIX: {analysisData.dataQuality.vixLevel || 'N/A'}
                      Session: {analysisData.marketSession || marketStatus}
                    
                  
                )}
              
            )}
          
        )}

        {activeTab === 'plays' && (
          
            
              
                Smart Plays • {marketStatus}
              
              
                Real-time opportunities from comprehensive market analysis
              
              {smartPlays.length > 0 && smartPlays[0].lastUpdated && (
                
                  Generated: {new Date(smartPlays[0].lastUpdated).toLocaleString()}
                
              )}
            
            
            {isLoading.plays && (
              
                
🔄
                
Analyzing comprehensive market data for opportunities...
                
                  Including futures, pre-market, news, social sentiment, options flow
                
              
            )}

            {!isLoading.plays && smartPlays.length === 0 && (
              
                
🤖
                
No qualifying opportunities
                
                  No significant moves detected in current {marketStatus.toLowerCase()} conditions
                
              
            )}

            {smartPlays.map((play, idx) => (
              
= 85 ? 'linear-gradient(135deg, #064E3B, #065F46)' :
                           play.confidence >= 70 ? 'linear-gradient(135deg, #1E3A8A, #1E40AF)' :
                           'linear-gradient(135deg, #374151, #4B5563)'
              }}>
                
                  
                    
                      {play.emoji} {play.title}
                    
                    
                      {play.ticker} • {play.strategy} • {play.timeframe}
                    
                    
                      {play.marketSession} • {play.playType}
                    
                  
                  
                    
                      {play.confidence}% Confidence
                    
                    
                      {play.riskLevel?.toUpperCase() || 'MEDIUM'} RISK
                    
                  
                

                {/* Entry Details */}
                
                  
                    
                      {play.playType === 'options' ? 'STRIKE/EXP' : 'ENTRY'}
                    
                    {play.playType === 'options' && play.entry ? (
                      
                        
                          ${play.entry.strike} {play.entry.optionType?.toUpperCase()}
                        
                        
                          {play.entry.expiration}
                        
                      
                    ) : (
                      
                        ${typeof play.entry === 'object' ? play.entry.price : play.entry}
                      
                    )}
                  
                  
                  
                    
STOP LOSS
                    
                      ${typeof play.stopLoss === 'object' ? play.stopLoss.price : play.stopLoss}
                    
                  
                  
                  
                    
TARGETS
                    {play.targets && Array.isArray(play.targets) ? (
                      play.targets.map((target, targetIdx) => (
                        
                          ${typeof target === 'object' ? target.price : target}
                          {typeof target === 'object' && target.probability && (
                             ({target.probability}%)
                          )}
                        
                      ))
                    ) : (
                      
                        ${play.targets}
                      
                    )}
                  
                

                {/* Reasoning and Analysis */}
                
                  
                    Analysis: {play.reasoning}
                  
                  
                  {/* Catalysts */}
                  {play.catalysts && play.catalysts.length > 0 && (
                    
                      
                        📊 Catalysts:
                      
                      
                        {play.catalysts.map((catalyst, catIdx) => (
                          
                            {catalyst}
                          
                        ))}
                      
                    
                  )}

                  {/* Social Buzz */}
                  {play.socialBuzz && (
                    
                      📱 Social Buzz: {play.socialBuzz}
                    
                  )}

                  {/* News Impact */}
                  {play.newsImpact && (
                    
                      📰 News Impact: {play.newsImpact}
                    
                  )}

                  {/* Data Support */}
                  {play.dataSupport && (
                    
                      🔗 Data Support: {play.dataSupport}
                    
                  )}

                  {/* Volume Profile */}
                  {play.volumeProfile && (
                    
                      📊 Volume: {play.volumeProfile}
                    
                  )}
                
              
            ))}
          
        )}

        {activeTab === 'market' && (
          
            
              
                Market Overview • {marketStatus}
              
              
                Real-time indices, futures, economic indicators
              
              {marketData.lastUpdated && (
                
                  Last Updated: {new Date(marketData.lastUpdated).toLocaleString()}
                
              )}
            
            
            {isLoading.market && (
              
                
🔄
                
Loading comprehensive market data...
                
                  Including futures, pre-market, and economic indicators
                
              
            )}

            {!isLoading.market && (!marketData || Object.keys(marketData).length <= 2) && (
              
                
📊
                
No real market data available
                
                  Check your market dashboard API configuration
                
              
            )}

            {marketData && Object.keys(marketData).length > 2 && (
              
                {/* Major Indices */}
                
                  
                    📈 Major Indices
                  
                  
                    {['sp500', 'nasdaq', 'dowJones'].map(index => {
                      const data = marketData[index];
                      if (!data || data.error) return null;
                      
                      return (
                        
                          
                            
                              {data.symbol || index.toUpperCase()}
                            
                            
                              {marketStatus}
                            
                          
                          
                            
                              {data.price}
                            
                            
= 0 ? '#10B981' : '#EF4444',
                              margin: '4px 0 0 0' 
                            }}>
                              {data.change} ({data.changePercent})
                            
                          
                        
                      );
                    })}
                  
                

                {/* Futures Section (when applicable) */}
                {(marketStatus === 'Futures Open' || marketStatus === 'Weekend' || marketStatus === 'Market Closed') && (
                  
                    
                      🌙 Futures Market
                    
                    
                      {['ES=F', 'NQ=F', 'YM=F', 'RTY=F'].map(future => (
                        
                          
                            {future === 'ES=F' ? 'S&P 500' :
                             future === 'NQ=F' ? 'NASDAQ' :
                             future === 'YM=F' ? 'Dow Jones' : 'Russell 2000'}
                          
                          
                            Loading...
                          
                          
                            {future}
                          
                        
                      ))}
                    
                  
                )}

                {/* Economic Indicators */}
                
                  
                    📊 Economic Indicators
                  
                  
                    {[
                      { key: 'fed_rate', label: 'Fed Funds Rate', value: '5.25%', unit: '%' },
                      { key: '10y_treasury', label: '10-Year Treasury', value: '4.45%', unit: '%' },
                      { key: 'vix', label: 'VIX (Volatility)', value: '16.8', unit: '' },
                      { key: 'dxy', label: 'Dollar Index', value: '104.2', unit: '' },
                      { key: 'oil', label: 'WTI Crude Oil', value: '$73.40', unit: '/bbl' },
                      { key: 'gold', label: 'Gold', value: '$2,015', unit: '/oz' }
                    ].map(indicator => (
                      
                        
                          {indicator.label}
                        
                        
                          {indicator.value}
                        
                        
                          Live • {new Date().toLocaleTimeString()}
                        
                      
                    ))}
                  
                

                {/* Pre-Market Movers (when applicable) */}
                {marketStatus === 'Pre-Market' && (
                  
                    
                      🌅 Pre-Market Movers
                    
                    
                      {['AAPL', 'TSLA', 'NVDA', 'META'].map(symbol => (
                        
                          
{symbol}
                          
Loading...
                          
Pre-Market
                        
                      ))}
                    
                  
                )}
              
            )}
          
        )}

        {activeTab === 'alerts' && (
          
            
              
                Real-time Alerts • {marketStatus}
              
              
                Comprehensive market monitoring with AI analysis
              
              {alerts.length > 0 && alerts[0].timestamp && (
                
                  Last Scan: {new Date(alerts[0].timestamp).toLocaleString()}
                
              )}
            
            
            {isLoading.alerts && (
              
                
🔄
                
Scanning comprehensive market data for alerts...
                
                  Monitoring breakouts, news, social sentiment, options flow
                
              
            )}

            {!isLoading.alerts && alerts.length === 0 && (
              
                
🔔
                
No active alerts
                
                  No significant movements detected in current {marketStatus.toLowerCase()} conditions
                
              
            )}

            
              {alerts.map((alert, idx) => (
                
                  
                    
                      {alert.type === 'breakout' ? '📈' :
                       alert.type === 'breakdown' ? '📉' :
                       alert.type === 'volume_spike' ? '📊' :
                       alert.type === 'news' ? '📰' :
                       alert.type === 'social' ? '📱' :
                       alert.type === 'options' ? '⚡' :
                       alert.type === 'volatility' ? '🚨' :
                       alert.type === 'sector' ? '🎯' :
                       alert.type === 'economic' ? '🏛️' : '🔔'}
                    
                    
                      
                        
                          {alert.title}
                          {alert.ticker && (
                            
                              {alert.ticker}
                            
                          )}
                        
                        
                          
                            {alert.priority}
                          
                          {alert.confidence && (
                            
                              {alert.confidence}% confidence
                            
                          )}
                        
                      
                      
                      
                        {alert.description}
                      
                      
                      {alert.action && (
                        
                          
                            💡 Action: {alert.action}
                          
                        
                      )}

                      
                        
                          ⏱️ {alert.timeframe}
                          {alert.marketSession && 📊 {alert.marketSession}}
                          {alert.profitPotential && 💰 {alert.profitPotential}}
                        
                        
                          {new Date().toLocaleTimeString()}
                        
                      

                      {alert.dataSupport && (
                        
                          Data: {alert.dataSupport}
                        
                      )}
                    
                  
                
              ))}
            
          
        )}

        {activeTab === 'chat' && (
          
            
              {chatMessages.map((msg, idx) => (
                
                  {msg.content}
                
              ))}
            
            
              {chatInput} setChatInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                placeholder={`Ask about ${selectedStock} or market conditions (${marketStatus})...`}
                style={{
                  flex: 1,
                  backgroundColor: '#1a1a1a',
                  border: '1px solid #374151',
                  borderRadius: '24px',
                  padding: '12px 20px',
                  color: '#ffffff',
                  fontSize: '16px',
                  outline: 'none',
                }}
              />
              
                Send
              
            
          
        )}

        {activeTab === 'settings' && (
          
            
              
                Feature Toggles
              
              
                Enable Smart Plays
                
                   saveSettings({ ...settings, enableSmartPlays: e.target.checked })}
                    style={{ opacity: 0, width: 0, height: 0 }}
                  />
                  
                  
                
              
              
                Enable Real-time Alerts
                
                   saveSettings({ ...settings, enableRealTimeAlerts: e.target.checked })}
                    style={{ opacity: 0, width: 0, height: 0 }}
                  />
                  
                  
                
              
              
                Enable AI Chat Assistant
                
                   saveSettings({ ...settings, enableAIChat: e.target.checked })}
                    style={{ opacity: 0, width: 0, height: 0 }}
                  />
                  
                  
                
              
            
            
              
                Play Confidence Level
              
              
                 saveSettings({ ...settings, playConfidenceLevel: parseInt(e.target.value) })}
                  style={{
                    flex: 1,
                    height: '4px',
                    background: '#374151',
                    borderRadius: '2px',
                    appearance: 'none',
                    outline: 'none',
                    transition: 'background-color 0.3s ease'
                  }}
                />
                {settings.playConfidenceLevel}%
              
              
                Only plays with confidence equal to or higher than this level will be shown.
              
            
          
        )}
      

      {/* Enhanced Bottom Navigation */}
      
        
          {[
            { id: 'ticker', icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z', label: 'Stocks' },
            { id: 'analysis', icon: 'M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z', label: 'Analysis' },
            { id: 'plays', icon: 'M13 10V3L4 14h7v7l9-11h-7z', label: 'Plays' },
            { id: 'market', icon: 'M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z', label: 'Market' },
            { id: 'alerts', icon: 'M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9', label: 'Alerts' },
            { id: 'chat', icon: 'M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z', label: 'Chat' },
            { id: 'settings', icon: 'M19.14 12.94c.04-.3.06-.61.06-.94 0-.32-.02-.64-.07-.94l2.03-1.58a.49.49 0 0 0 .12-.83l-2.25-1V8l-1.09-1.84a.5.5 0 0 0-.83-.12l-1.57 2.02a3.74 3.74 0 0 0-.94-.07c-.33 0-.64.02-.94.07L8.01 6.26a.5.5 0 0 0-.83.12L6.1 8v1.02l-2.25 1a.5.5 0 0 0-.12.83l2.03 1.58c-.05.3-.07.62-.07.94s.02.64.07.94L3.8 14.92a.5.5 0 0 0 .12.83l2.25 1V17l1.09 1.84c.22.13.58.13.83-.12l1.57-2.02c.3.05.61.07.94.07.32 0 .64-.02.94-.07l1.58 2.03c.25.13.61.13.83-.12l1.09-1.84v-1.02l2.25-1a.5.5 0 0 0 .12-.83l-2.03-1.58z', label: 'Settings' }
          ].map(tab => (
             handleTabChange(tab.id)}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '8px 12px',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: activeTab === tab.id ? '#3B82F6' : '#9CA3AF',
                transition: 'color 0.2s ease',
                minWidth: '60px',
                userSelect: 'none'
              }}
            >
              
                
              
              
                {tab.label}
              
            
          ))}
        
      

      {/* CSS animations */}
      
    
  );
};

export default RoloApp;
