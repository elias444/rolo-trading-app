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
  const [settings, setSettings] = useState({
    enableSmartPlays: true,
    enableRealTimeAlerts: true,
    enableAIChat: true,
    playConfidenceLevel: 75
  });

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

  // Load settings from localStorage
  useEffect(() => {
    const savedSettings = localStorage.getItem('roloSettings');
    if (savedSettings) {
      setSettings(JSON.parse(savedSettings));
    }
    const savedStocks = localStorage.getItem('roloPopularStocks');
    if (savedStocks) {
      setPopularStocks(JSON.parse(savedStocks));
    }
  }, []);

  // Save settings to localStorage
  const saveSettings = (newSettings) => {
    localStorage.setItem('roloSettings', JSON.stringify(newSettings));
    setSettings(newSettings);
  };

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
    if (!settings.enableSmartPlays) {
      setSmartPlays([]);
      return;
    }
    setIsLoading(prev => ({ ...prev, plays: true }));
    setSmartPlays([]);
    
    try {
      const response = await fetch('/.netlify/functions/comprehensive-ai-analysis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'smartplays' }),
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.analysis && data.analysis.plays && data.analysis.plays.length > 0) {
          const filteredPlays = data.analysis.plays.filter(play => play.confidence >= settings.playConfidenceLevel).map(play => ({
            ...play,
            marketSession: data.marketData.session,
            dataQuality: data.dataQuality,
            lastUpdated: data.timestamp
          }));
          setSmartPlays(filteredPlays);
        }
      }
    } catch (error) {
      console.error('Error fetching smart plays:', error);
    } finally {
      setIsLoading(prev => ({ ...prev, plays: false }));
    }
  }, [settings.enableSmartPlays, settings.playConfidenceLevel]);

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
    if (!settings.enableRealTimeAlerts) {
      setAlerts([]);
      return;
    }
    setIsLoading(prev => ({ ...prev, alerts: true }));
    setAlerts([]);
    
    try {
      const response = await fetch('/.netlify/functions/comprehensive-ai-analysis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'alerts' }),
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.analysis && data.analysis.alerts && data.analysis.alerts.length > 0) {
          setAlerts(data.analysis.alerts.map(alert => ({
            ...alert,
            marketSession: data.marketData.session,
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
  }, [settings.enableRealTimeAlerts]);

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
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#000000',
      color: '#ffffff',
      display: 'flex',
      flexDirection: 'column',
      fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif',
    }}>
      {/* Enhanced Header */}
      <div style={{
        background: 'linear-gradient(to bottom, #1a1a1a, #000000)',
        padding: '20px',
        textAlign: 'center',
        borderBottom: '1px solid #374151'
      }}>
        <h1 style={{
          fontSize: '32px',
          fontWeight: 'bold',
          color: '#3B82F6',
          margin: '0 0 8px 0',
        }}>Rolo AI</h1>
        <p style={{
          color: '#9CA3AF',
          fontSize: '14px',
          margin: '0 0 12px 0',
        }}>24/7 AI Trading Assistant - Real-Time Data</p>
        <div style={{ marginBottom: '8px' }}>
          <span style={getMarketStatusStyle()}>
            <span style={getMarketStatusDot()}></span>
            {marketStatus}
          </span>
        </div>
        <p style={{ fontSize: '12px', color: '#6B7280', margin: '4px 0 0 0' }}>
          {getUpdateFrequency()} • Last: {lastUpdate.toLocaleTimeString()}
        </p>
      </div>

      {/* Main Content */}
      <div style={{
        flex: 1,
        overflowY: 'auto',
        paddingBottom: '80px',
      }}>
        {activeTab === 'ticker' && (
          <div>
            {/* Search Bar */}
            <div style={{ padding: '20px' }}>
              <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
                <input
                  type="text"
                  value={searchTicker}
                  onChange={(e) => setSearchTicker(e.target.value)}
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
                <button
                  onClick={handleSearch}
                  style={{
                    backgroundColor: '#3B82F6',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '12px',
                    padding: '12px 24px',
                    fontWeight: '600',
                    cursor: 'pointer',
                  }}
                >
                  Search
                </button>
              </div>
            </div>

            {/* Popular Stocks */}
            <div style={{ padding: '0 20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <h2 style={{
                  fontSize: '18px',
                  fontWeight: '600',
                  margin: 0,
                  display: 'flex',
                  alignItems: 'center',
                }}>
                  <span style={{ marginRight: '8px' }}>📈</span> 
                  Popular Stocks
                  <span style={{ fontSize: '12px', color: '#6B7280', marginLeft: '8px' }}>
                    ({marketStatus})
                  </span>
                </h2>
                <button
                  onClick={handleEditStocks}
                  style={{
                    backgroundColor: isEditingStocks ? '#059669' : '#374151',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '8px',
                    padding: '6px 12px',
                    fontSize: '12px',
                    cursor: 'pointer',
                  }}
                >
                  {isEditingStocks ? 'Done' : 'Edit'}
                </button>
              </div>
              
              {isLoading.stocks && Object.keys(stockData).length === 0 && (
                <div style={{ textAlign: 'center', padding: '40px 20px', color: '#9CA3AF' }}>
                  <p style={{ fontSize: '48px', margin: '0 0 16px 0' }}>🔄</p>
                  <p>Loading real-time {marketStatus.toLowerCase()} data...</p>
                </div>
              )}

              {!isLoading.stocks && Object.keys(stockData).length === 0 && (
                <div style={{ textAlign: 'center', padding: '40px 20px', color: '#9CA3AF' }}>
                  <p style={{ fontSize: '48px', margin: '0 0 16px 0' }}>📊</p>
                  <p>No real stock data available</p>
                  <p style={{ fontSize: '14px', marginTop: '8px' }}>
                    Check your API configuration
                  </p>
                </div>
              )}

              {Object.keys(stockData).length > 0 && (
                <div>
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
                    gap: '12px',
                    marginBottom: '24px'
                  }}>
                    {popularStocks.map((symbol, index) => {
                      const data = stockData[symbol];
                      const isSelected = selectedStock === symbol;
                      
                      return (
                        <div
                          key={`${symbol}-${index}`}
                          onClick={() => !isEditingStocks && setSelectedStock(symbol)}
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
                            <div>
                              <input
                                type="text"
                                value={symbol}
                                onChange={(e) => handleStockEdit(index, e.target.value)}
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
                                <button
                                  onClick={() => removeStock(index)}
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
                                </button>
                              )}
                            </div>
                          ) : (
                            <>
                              <div style={{ fontWeight: 'bold', marginBottom: '4px', fontSize: '14px' }}>
                                {symbol}
                              </div>
                              {data ? (
                                <>
                                  <div style={{ fontSize: '14px', color: '#9CA3AF', marginBottom: '2px' }}>
                                    ${data.price}
                                  </div>
                                  <div style={{
                                    fontSize: '12px',
                                    color: parseFloat(data.change) >= 0 ? '#10B981' : '#EF4444'
                                  }}>
                                    {data.changePercent}
                                  </div>
                                  <div style={{ fontSize: '10px', color: '#6B7280', marginTop: '2px' }}>
                                    {data.marketSession || marketStatus}
                                  </div>
                                </>
                              ) : (
                                <div style={{ fontSize: '12px', color: '#6B7280' }}>Loading...</div>
                              )}
                            </>
                          )}
                        </div>
                      );
                    })}
                    
                    {isEditingStocks && popularStocks.length < 12 && (
                      <button
                        onClick={addStock}
                        style={{
                          backgroundColor: '#374151',
                          border: '1px dashed #6B7280',
                          borderRadius: '12px',
                          padding: '12px',
                          color: '#9CA3AF',
                          cursor: 'pointer',
                          fontSize: '24px'
                        }}
                      >
                        +
                      </button>
                    )}
                  </div>
                </div>
              )}

              {/* Selected Stock Details */}
              {selectedStock && stockData[selectedStock] && (
                <div style={{
                  backgroundColor: '#1a1a1a',
                  borderRadius: '20px',
                  padding: '24px',
                  border: '1px solid #1F2937',
                }}>
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                    marginBottom: '16px',
                  }}>
                    <div>
                      <h2 style={{ fontSize: '32px', fontWeight: 'bold', margin: '0' }}>
                        {selectedStock}
                      </h2>
                      <p style={{ color: '#9CA3AF', fontSize: '14px', margin: '4px 0 0 0' }}>
                        {stockData[selectedStock].marketSession || marketStatus} • {stockData[selectedStock].dataSource || 'Real-time'}
                      </p>
                      {stockData[selectedStock].lastFetched && (
                        <p style={{ color: '#6B7280', fontSize: '12px', margin: '2px 0 0 0' }}>
                          Updated: {new Date(stockData[selectedStock].lastFetched).toLocaleTimeString()}
                        </p>
                      )}
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{
                        fontSize: '32px',
                        fontWeight: 'bold',
                        color: parseFloat(stockData[selectedStock].change) >= 0 ? '#10B981' : '#EF4444',
                        margin: '0',
                      }}>
                        ${stockData[selectedStock].price}
                      </div>
                      <div style={{
                        fontSize: '14px',
                        marginTop: '4px',
                        color: parseFloat(stockData[selectedStock].change) >= 0 ? '#10B981' : '#EF4444'
                      }}>
                        {stockData[selectedStock].change} ({stockData[selectedStock].changePercent})
                      </div>
                    </div>
                  </div>

                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(2, 1fr)',
                    gap: '16px',
                    marginTop: '24px',
                  }}>
                    {[
                      { label: 'VOLUME', value: stockData[selectedStock].volume },
                      { label: 'HIGH', value: `${stockData[selectedStock].high}` },
                      { label: 'LOW', value: `${stockData[selectedStock].low}` },
                      { label: 'OPEN', value: `${stockData[selectedStock].open}` }
                    ].map(metric => (
                      <div key={metric.label} style={{
                        backgroundColor: '#000000',
                        borderRadius: '12px',
                        padding: '16px',
                      }}>
                        <p style={{
                          color: '#9CA3AF',
                          fontSize: '14px',
                          marginBottom: '4px',
                        }}>{metric.label}</p>
                        <p style={{
                          fontSize: '20px',
                          fontWeight: '600',
                          margin: '0'
                        }}>{metric.value}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'analysis' && (
          <div style={{ padding: '20px' }}>
            <div style={{
              background: 'linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%)',
              borderRadius: '20px',
              padding: '24px',
              marginBottom: '16px'
            }}>
              <h2 style={{ fontSize: '24px', fontWeight: 'bold', margin: '0 0 8px 0' }}>
                {selectedStock} Analysis
              </h2>
              <p style={{ color: '#9CA3AF', margin: '0 0 8px 0' }}>
                24/7 AI-Powered Analysis - {marketStatus}
              </p>
              {analysisData && analysisData.lastUpdated && (
                <p style={{ color: '#6B7280', fontSize: '12px', margin: 0 }}>
                  Last Updated: {new Date(analysisData.lastUpdated).toLocaleString()}
                </p>
              )}
            </div>

            {isLoading.analysis && (
              <div style={{ textAlign: 'center', padding: '40px 20px', color: '#9CA3AF' }}>
                <p style={{ fontSize: '48px', margin: '0 0 16px 0' }}>🔄</p>
                <p>Analyzing {selectedStock} with comprehensive real-time data...</p>
                <p style={{ fontSize: '14px', marginTop: '8px' }}>
                  Including futures, pre-market, news, social sentiment, and economic indicators
                </p>
              </div>
            )}

            {!isLoading.analysis && !analysisData && (
              <div style={{ textAlign: 'center', padding: '40px 20px', color: '#9CA3AF' }}>
                <p style={{ fontSize: '48px', margin: '0 0 16px 0' }}>📊</p>
                <p>No comprehensive analysis available</p>
                <p style={{ fontSize: '14px', marginTop: '8px' }}>
                  AI analysis requires real market data access
                </p>
              </div>
            )}

            {analysisData && !isLoading.analysis && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {/* Executive Summary */}
                {analysisData.summary && (
                  <div style={{
                    backgroundColor: '#1a1a1a',
                    borderRadius: '16px',
                    padding: '20px',
                    border: '1px solid #374151',
                  }}>
                    <h3 style={{ margin: '0 0 12px 0', color: '#3B82F6', fontSize: '18px' }}>
                      📋 Executive Summary
                    </h3>
                    <p style={{ margin: 0, lineHeight: 1.6, fontSize: '16px' }}>{analysisData.summary}</p>
                  </div>
                )}

                {/* Market Environment */}
                {analysisData.marketEnvironment && (
                  <div style={{
                    backgroundColor: '#1a1a1a',
                    borderRadius: '16px',
                    padding: '20px',
                    border: '1px solid #374151',
                  }}>
                    <h3 style={{ margin: '0 0 16px 0', color: '#10B981', fontSize: '18px' }}>
                      🌍 Market Environment
                    </h3>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
                      <div>
                        <p style={{ margin: '0 0 4px 0', fontSize: '12px', color: '#9CA3AF' }}>SESSION</p>
                        <p style={{ margin: '0', fontWeight: 'bold' }}>{analysisData.marketEnvironment.session}</p>
                      </div>
                      <div>
                        <p style={{ margin: '0 0 4px 0', fontSize: '12px', color: '#9CA3AF' }}>VOLATILITY</p>
                        <p style={{ margin: '0', fontWeight: 'bold' }}>{analysisData.marketEnvironment.volatility}</p>
                      </div>
                      <div>
                        <p style={{ margin: '0 0 4px 0', fontSize: '12px', color: '#9CA3AF' }}>SENTIMENT</p>
                        <p style={{ margin: '0', fontWeight: 'bold' }}>{analysisData.marketEnvironment.sentiment}</p>
                      </div>
                    </div>
                    {analysisData.marketEnvironment.keyDrivers && (
                      <div style={{ marginTop: '16px' }}>
                        <p style={{ margin: '0 0 8px 0', fontSize: '14px', fontWeight: '600' }}>Key Market Drivers:</p>
                        <ul style={{ margin: 0, paddingLeft: '20px' }}>
                          {analysisData.marketEnvironment.keyDrivers.map((driver, idx) => (
                            <li key={idx} style={{ marginBottom: '4px' }}>{driver}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}

                {/* Technical Analysis */}
                {analysisData.technicalAnalysis && (
                  <div style={{
                    backgroundColor: '#1a1a1a',
                    borderRadius: '16px',
                    padding: '20px',
                    border: '1px solid #374151',
                  }}>
                    <h3 style={{ margin: '0 0 16px 0', color: '#F59E0B', fontSize: '18px' }}>
                      📈 Technical Analysis
                    </h3>
                    
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '12px', marginBottom: '16px' }}>
                      <div style={{ backgroundColor: '#000000', borderRadius: '8px', padding: '12px' }}>
                        <p style={{ margin: '0 0 4px 0', fontSize: '12px', color: '#9CA3AF' }}>TREND</p>
                        <p style={{ 
                          margin: '0', 
                          fontWeight: 'bold',
                          color: analysisData.technicalAnalysis.trend === 'bullish' ? '#10B981' : 
                                analysisData.technicalAnalysis.trend === 'bearish' ? '#EF4444' : '#9CA3AF'
                        }}>
                          {analysisData.technicalAnalysis.trend?.toUpperCase()}
                        </p>
                      </div>
                      <div style={{ backgroundColor: '#000000', borderRadius: '8px', padding: '12px' }}>
                        <p style={{ margin: '0 0 4px 0', fontSize: '12px', color: '#9CA3AF' }}>STRENGTH</p>
                        <p style={{ margin: '0', fontWeight: 'bold' }}>
                          {analysisData.technicalAnalysis.strength?.toUpperCase()}
                        </p>
                      </div>
                      {analysisData.technicalAnalysis.indicators?.rsi && (
                        <div style={{ backgroundColor: '#000000', borderRadius: '8px', padding: '12px' }}>
                          <p style={{ margin: '0 0 4px 0', fontSize: '12px', color: '#9CA3AF' }}>RSI</p>
                          <p style={{ margin: '0', fontWeight: 'bold' }}>
                            {analysisData.technicalAnalysis.indicators.rsi.value} ({analysisData.technicalAnalysis.indicators.rsi.signal})
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Support and Resistance Levels */}
                    {analysisData.technicalAnalysis.keyLevels && (
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                        <div>
                          <p style={{ margin: '0 0 8px 0', fontSize: '14px', fontWeight: '600', color: '#EF4444' }}>
                            Support Levels:
                          </p>
                          {analysisData.technicalAnalysis.keyLevels.support?.map((level, idx) => (
                            <p key={idx} style={{ margin: '0 0 4px 0', fontSize: '14px' }}>
                              ${level}
                            </p>
                          ))}
                        </div>
                        <div>
                          <p style={{ margin: '0 0 8px 0', fontSize: '14px', fontWeight: '600', color: '#10B981' }}>
                            Resistance Levels:
                          </p>
                          {analysisData.technicalAnalysis.keyLevels.resistance?.map((level, idx) => (
                            <p key={idx} style={{ margin: '0 0 4px 0', fontSize: '14px' }}>
                              ${level}
                            </p>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Trading Plan */}
                {analysisData.tradingPlan && (
                  <div style={{
                    backgroundColor: '#1a1a1a',
                    borderRadius: '16px',
                    padding: '20px',
                    border: '1px solid #374151',
                  }}>
                    <h3 style={{ margin: '0 0 16px 0', color: '#8B5CF6', fontSize: '18px' }}>
                      🎯 Trading Plan
                    </h3>
                    
                    {/* Entry Points */}
                    {analysisData.tradingPlan.entries && (
                      <div style={{ marginBottom: '16px' }}>
                        <p style={{ margin: '0 0 8px 0', fontSize: '14px', fontWeight: '600' }}>Entry Points:</p>
                        {analysisData.tradingPlan.entries.map((entry, idx) => (
                          <div key={idx} style={{ 
                            backgroundColor: '#000000', 
                            borderRadius: '8px', 
                            padding: '12px', 
                            marginBottom: '8px',
                            border: '1px solid #10B981'
                          }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <span style={{ fontWeight: 'bold', color: '#10B981' }}>${entry.price}</span>
                              {entry.confidence && (
                                <span style={{ fontSize: '12px', color: '#9CA3AF' }}>
                                  {entry.confidence}% confidence
                                </span>
                              )}
                            </div>
                            <p style={{ margin: '4px 0 0 0', fontSize: '14px', color: '#E5E7EB' }}>
                              {entry.reasoning || entry.reason}
                            </p>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Stop Loss and Targets */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
                      {analysisData.tradingPlan.stopLoss && (
                        <div style={{ backgroundColor: '#000000', borderRadius: '8px', padding: '12px', border: '1px solid #EF4444' }}>
                          <p style={{ margin: '0 0 4px 0', fontSize: '12px', color: '#9CA3AF' }}>STOP LOSS</p>
                          <p style={{ margin: '0', fontWeight: 'bold', color: '#EF4444' }}>
                            ${typeof analysisData.tradingPlan.stopLoss === 'object' ? 
                              analysisData.tradingPlan.stopLoss.price : 
                              analysisData.tradingPlan.stopLoss}
                          </p>
                          {typeof analysisData.tradingPlan.stopLoss === 'object' && analysisData.tradingPlan.stopLoss.reasoning && (
                            <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: '#9CA3AF' }}>
                              {analysisData.tradingPlan.stopLoss.reasoning}
                            </p>
                          )}
                        </div>
                      )}

                      {analysisData.tradingPlan.targets && (
                        <>
                          {analysisData.tradingPlan.targets.short && (
                            <div style={{ backgroundColor: '#000000', borderRadius: '8px', padding: '12px', border: '1px solid #F59E0B' }}>
                              <p style={{ margin: '0 0 4px 0', fontSize: '12px', color: '#9CA3AF' }}>SHORT TARGET</p>
                              <p style={{ margin: '0', fontWeight: 'bold', color: '#F59E0B' }}>
                                ${analysisData.tradingPlan.targets.short.price}
                              </p>
                              <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: '#9CA3AF' }}>
                                {analysisData.tradingPlan.targets.short.timeframe}
                                {analysisData.tradingPlan.targets.short.probability && 
                                  ` • ${analysisData.tradingPlan.targets.short.probability}% prob`}
                              </p>
                            </div>
                          )}

                          {analysisData.tradingPlan.targets.long && (
                            <div style={{ backgroundColor: '#000000', borderRadius: '8px', padding: '12px', border: '1px solid #10B981' }}>
                              <p style={{ margin: '0 0 4px 0', fontSize: '12px', color: '#9CA3AF' }}>LONG TARGET</p>
                              <p style={{ margin: '0', fontWeight: 'bold', color: '#10B981' }}>
                                ${analysisData.tradingPlan.targets.long.price}
                              </p>
                              <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: '#9CA3AF' }}>
                                {analysisData.tradingPlan.targets.long.timeframe}
                                {analysisData.tradingPlan.targets.long.probability && 
                                  ` • ${analysisData.tradingPlan.targets.long.probability}% prob`}
                              </p>
                            </div>
                          )}
                        </>
                      )}
                    </div>

                    {analysisData.tradingPlan.riskReward && (
                      <div style={{ marginTop: '12px', padding: '12px', backgroundColor: '#000000', borderRadius: '8px' }}>
                        <p style={{ margin: '0', fontSize: '14px' }}>
                          <span style={{ color: '#9CA3AF' }}>Risk/Reward Ratio: </span>
                          <span style={{ fontWeight: 'bold' }}>{analysisData.tradingPlan.riskReward}</span>
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {/* Recommendation */}
                {analysisData.recommendation && (
                  <div style={{
                    backgroundColor: '#1a1a1a',
                    borderRadius: '16px',
                    padding: '20px',
                    border: '1px solid #374151',
                    background: analysisData.recommendation.action === 'buy' ? 'linear-gradient(135deg, #064E3B, #065F46)' :
                                analysisData.recommendation.action === 'sell' ? 'linear-gradient(135deg, #7F1D1D, #991B1B)' :
                                'linear-gradient(135deg, #374151, #4B5563)'
                  }}>
                    <h3 style={{ margin: '0 0 16px 0', color: '#ffffff', fontSize: '18px' }}>
                      🎯 Recommendation
                    </h3>
                    
                    <div style={{ 
                      display: 'flex', 
                      justifyContent: 'space-between', 
                      alignItems: 'center', 
                      marginBottom: '16px',
                      flexWrap: 'wrap',
                      gap: '12px'
                    }}>
                      <p style={{ margin: '0', fontSize: '28px', fontWeight: 'bold', color: '#ffffff' }}>
                        {analysisData.recommendation.action?.toUpperCase()}
                      </p>
                      {analysisData.recommendation.confidence && (
                        <div style={{ textAlign: 'right' }}>
                          <p style={{ margin: '0', fontSize: '20px', fontWeight: 'bold', color: '#ffffff' }}>
                            {analysisData.recommendation.confidence}%
                          </p>
                          <p style={{ margin: '0', fontSize: '12px', color: '#E5E7EB' }}>Confidence</p>
                        </div>
                      )}
                    </div>

                    {analysisData.recommendation.strategy && (
                      <p style={{ margin: '0 0 12px 0', color: '#E5E7EB', fontSize: '16px' }}>
                        <strong>Strategy:</strong> {analysisData.recommendation.strategy}
                      </p>
                    )}

                    {analysisData.recommendation.timeframe && (
                      <p style={{ margin: '0 0 12px 0', color: '#E5E7EB', fontSize: '14px' }}>
                        <strong>Timeframe:</strong> {analysisData.recommendation.timeframe}
                      </p>
                    )}

                    {analysisData.recommendation.catalysts && analysisData.recommendation.catalysts.length > 0 && (
                      <div style={{ marginBottom: '12px' }}>
                        <p style={{ margin: '0 0 8px 0', fontSize: '14px', fontWeight: '600', color: '#ffffff' }}>
                          Catalysts:
                        </p>
                        <ul style={{ margin: 0, paddingLeft: '20px', color: '#E5E7EB' }}>
                          {analysisData.recommendation.catalysts.map((catalyst, idx) => (
                            <li key={idx} style={{ marginBottom: '4px' }}>{catalyst}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {analysisData.recommendation.risks && analysisData.recommendation.risks.length > 0 && (
                      <div>
                        <p style={{ margin: '0 0 8px 0', fontSize: '14px', fontWeight: '600', color: '#ffffff' }}>
                          Risks:
                        </p>
                        <ul style={{ margin: 0, paddingLeft: '20px', color: '#E5E7EB' }}>
                          {analysisData.recommendation.risks.map((risk, idx) => (
                            <li key={idx} style={{ marginBottom: '4px' }}>{risk}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}

                {/* Data Quality Indicator */}
                {analysisData.dataQuality && (
                  <div style={{
                    backgroundColor: '#0F1419',
                    borderRadius: '8px',
                    padding: '12px',
                    border: '1px solid #374151',
                  }}>
                    <p style={{ margin: '0 0 8px 0', fontSize: '12px', fontWeight: '600', color: '#9CA3AF' }}>
                      DATA QUALITY METRICS:
                    </p>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: '8px', fontSize: '11px' }}>
                      <span>News: {analysisData.dataQuality.newsArticles || 0} articles</span>
                      <span>Sentiment: {analysisData.dataQuality.sentiment || 'Unknown'}</span>
                      <span>VIX: {analysisData.dataQuality.vixLevel || 'N/A'}</span>
                      <span>Session: {analysisData.marketSession || marketStatus}</span>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {activeTab === 'plays' && (
          <div style={{ padding: '20px' }}>
            <div style={{ marginBottom: '16px' }}>
              <h2 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '8px' }}>
                Smart Plays • {marketStatus}
              </h2>
              <p style={{ color: '#9CA3AF', marginBottom: '8px', fontSize: '14px' }}>
                Real-time opportunities from comprehensive market analysis
              </p>
              {smartPlays.length > 0 && smartPlays[0].lastUpdated && (
                <p style={{ color: '#6B7280', fontSize: '12px', margin: 0 }}>
                  Generated: {new Date(smartPlays[0].lastUpdated).toLocaleString()}
                </p>
              )}
            </div>
            
            {isLoading.plays && (
              <div style={{ textAlign: 'center', padding: '40px 20px', color: '#9CA3AF' }}>
                <p style={{ fontSize: '48px', margin: '0 0 16px 0' }}>🔄</p>
                <p>Analyzing comprehensive market data for opportunities...</p>
                <p style={{ fontSize: '14px', marginTop: '8px' }}>
                  Including futures, pre-market, news, social sentiment, options flow
                </p>
              </div>
            )}

            {!isLoading.plays && smartPlays.length === 0 && (
              <div style={{ textAlign: 'center', padding: '40px 20px', color: '#9CA3AF' }}>
                <p style={{ fontSize: '48px', margin: '0 0 16px 0' }}>🤖</p>
                <p style={{ fontSize: '18px', margin: '0 0 8px 0' }}>No qualifying opportunities</p>
                <p style={{ fontSize: '14px', margin: '0' }}>
                  No significant moves detected in current {marketStatus.toLowerCase()} conditions
                </p>
              </div>
            )}

            {smartPlays.map((play, idx) => (
              <div key={idx} style={{
                borderRadius: '16px',
                padding: '20px',
                marginBottom: '16px',
                border: '1px solid #374151',
                background: play.confidence >= 85 ? 'linear-gradient(135deg, #064E3B, #065F46)' :
                           play.confidence >= 70 ? 'linear-gradient(135deg, #1E3A8A, #1E40AF)' :
                           'linear-gradient(135deg, #374151, #4B5563)'
              }}>
                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'flex-start', 
                  marginBottom: '12px',
                  flexWrap: 'wrap',
                  gap: '8px'
                }}>
                  <div style={{ flex: 1 }}>
                    <h3 style={{ fontSize: '18px', fontWeight: '600', margin: '0 0 4px 0', color: '#ffffff' }}>
                      {play.emoji} {play.title}
                    </h3>
                    <p style={{ margin: '0', fontSize: '16px', fontWeight: 'bold', color: '#ffffff' }}>
                      {play.ticker} • {play.strategy} • {play.timeframe}
                    </p>
                    <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: '#E5E7EB' }}>
                      {play.marketSession} • {play.playType}
                    </p>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px' }}>
                    <span style={{
                      backgroundColor: 'rgba(255, 255, 255, 0.2)',
                      padding: '4px 12px',
                      borderRadius: '12px',
                      fontSize: '12px',
                      color: '#ffffff',
                      fontWeight: 'bold'
                    }}>
                      {play.confidence}% Confidence
                    </span>
                    <span style={{
                      fontSize: '10px',
                      padding: '2px 8px',
                      borderRadius: '4px',
                      backgroundColor: play.riskLevel === 'high' ? 'rgba(239, 68, 68, 0.3)' :
                                      play.riskLevel === 'medium' ? 'rgba(245, 158, 11, 0.3)' :
                                      'rgba(16, 185, 129, 0.3)',
                      color: play.riskLevel === 'high' ? '#FCA5A5' :
                             play.riskLevel === 'medium' ? '#FCD34D' : '#A7F3D0'
                    }}>
                      {play.riskLevel?.toUpperCase() || 'MEDIUM'} RISK
                    </span>
                  </div>
                </div>

                {/* Entry Details */}
                <div style={{ 
                  display: 'grid', 
                  gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', 
                  gap: '12px',
                  marginBottom: '16px',
                  backgroundColor: 'rgba(0, 0, 0, 0.4)',
                  padding: '16px',
                  borderRadius: '12px'
                }}>
                  <div>
                    <p style={{ margin: '0 0 4px 0', fontSize: '12px', color: '#9CA3AF' }}>
                      ENTRY
                    </p>
                    <p style={{ margin: '0', fontWeight: 'bold', color: '#10B981' }}>
                      ${play.entry}
                    </p>
                  </div>
                  <div>
                    <p style={{ margin: '0 0 4px 0', fontSize: '12px', color: '#9CA3AF' }}>STOP LOSS</p>
                    <p style={{ margin: '0', fontWeight: 'bold', color: '#EF4444' }}>
                      ${play.stopLoss}
                    </p>
                  </div>
                  <div>
                    <p style={{ margin: '0 0 4px 0', fontSize: '12px', color: '#9CA3AF' }}>TARGET</p>
                    <p style={{ margin: '0', fontWeight: 'bold', color: '#10B981' }}>
                      ${play.target}
                    </p>
                  </div>
                </div>

                <p style={{ margin: '0 0 12px 0', fontSize: '15px', color: '#E5E7EB', lineHeight: 1.4 }}>
                  <strong>Analysis:</strong> {play.reasoning}
                </p>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'market' && (
          <div style={{ padding: '20px' }}>
            <div style={{ marginBottom: '16px' }}>
              <h2 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '8px' }}>
                Market Overview • {marketStatus}
              </h2>
              <p style={{ color: '#9CA3AF', fontSize: '14px', marginBottom: '8px' }}>
                Real-time indices, futures, economic indicators
              </p>
              {marketData.lastUpdated && (
                <p style={{ color: '#6B7280', fontSize: '12px', margin: 0 }}>
                  Last Updated: {new Date(marketData.lastUpdated).toLocaleString()}
                </p>
              )}
            </div>
            
            {isLoading.market && (
              <div style={{ textAlign: 'center', padding: '40px 20px', color: '#9CA3AF' }}>
                <p style={{ fontSize: '48px', margin: '0 0 16px 0' }}>🔄</p>
                <p>Loading comprehensive market data...</p>
                <p style={{ fontSize: '14px', marginTop: '8px' }}>
                  Including futures, pre-market, and economic indicators
                </p>
              </div>
            )}

            {!isLoading.market && (!marketData || Object.keys(marketData).length <= 2) && (
              <div style={{ textAlign: 'center', padding: '40px 20px', color: '#9CA3AF' }}>
                <p style={{ fontSize: '48px', margin: '0 0 16px 0' }}>📊</p>
                <p>No real market data available</p>
                <p style={{ fontSize: '14px', marginTop: '8px' }}>
                  Check your market dashboard API configuration
                </p>
              </div>
            )}

            {marketData && Object.keys(marketData).length > 2 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                {/* Major Indices */}
                <div>
                  <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '12px', color: '#3B82F6' }}>
                    📈 Major Indices
                  </h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {['sp500', 'nasdaq', 'dowJones'].map(index => {
                      const data = marketData[index];
                      if (!data || data.error) return null;
                      
                      return (
                        <div key={index} style={{
                          backgroundColor: '#1a1a1a',
                          borderRadius: '16px',
                          padding: '20px',
                          border: '1px solid #1F2937',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center'
                        }}>
                          <div>
                            <p style={{ fontWeight: '600', margin: '0', fontSize: '16px' }}>
                              {data.symbol || index.toUpperCase()}
                            </p>
                            <p style={{ fontSize: '12px', color: '#9CA3AF', margin: '4px 0 0 0' }}>
                              {marketStatus}
                            </p>
                          </div>
                          <div style={{ textAlign: 'right' }}>
                            <p style={{ fontSize: '20px', fontWeight: 'bold', margin: '0' }}>
                              {data.price}
                            </p>
                            <p style={{ 
                              fontSize: '14px', 
                              color: data.change && parseFloat(data.change) >= 0 ? '#10B981' : '#EF4444',
                              margin: '4px 0 0 0' 
                            }}>
                              {data.change} ({data.changePercent})
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Futures Section (when applicable) */}
                {(marketStatus === 'Futures Open' || marketStatus === 'Weekend' || marketStatus === 'Market Closed') && (
                  <div>
                    <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '12px', color: '#3B82F6' }}>
                      🌙 Futures Market
                    </h3>
                    <div style={{ 
                      display: 'grid', 
                      gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', 
                      gap: '12px' 
                    }}>
                      {['ES=F', 'NQ=F', 'YM=F', 'RTY=F'].map(future => (
                        <div key={future} style={{
                          backgroundColor: '#1a1a1a',
                          borderRadius: '12px',
                          padding: '16px',
                          border: '1px solid #374151'
                        }}>
                          <p style={{ margin: '0 0 8px 0', fontSize: '14px', fontWeight: '600' }}>
                            {future === 'ES=F' ? 'S&P 500' :
                             future === 'NQ=F' ? 'NASDAQ' :
                             future === 'YM=F' ? 'Dow Jones' : 'Russell 2000'}
                          </p>
                          <p style={{ margin: '0 0 4px 0', fontSize: '16px', fontWeight: 'bold' }}>
                            {marketData[future.toLowerCase().replace('=f', '')]?.price || 'N/A'}
                          </p>
                          <p style={{ margin: '0', fontSize: '12px', color: '#9CA3AF' }}>
                            {future}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Economic Indicators */}
                <div>
                  <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '12px', color: '#F59E0B' }}>
                    📊 Economic Indicators
                  </h3>
                  <div style={{ 
                    display: 'grid', 
                    gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', 
                    gap: '12px' 
                  }}>
                    {marketData.economicIndicators && Object.entries(marketData.economicIndicators).map(([key, indicator]) => (
                      <div key={key} style={{
                        backgroundColor: '#000000',
                        borderRadius: '12px',
                        padding: '16px',
                        border: '1px solid #374151'
                      }}>
                        <p style={{
                          color: '#9CA3AF',
                          fontSize: '12px',
                          marginBottom: '4px',
                          textTransform: 'uppercase',
                          fontWeight: '600'
                        }}>
                          {indicator.name || key.toUpperCase()}
                        </p>
                        <p style={{
                          fontSize: '18px',
                          fontWeight: 'bold',
                          margin: '0 0 4px 0'
                        }}>
                          {indicator.value} {indicator.unit}
                        </p>
                        <p style={{ fontSize: '10px', color: '#6B7280', margin: '0' }}>
                          {indicator.date ? new Date(indicator.date).toLocaleDateString() : 'Live'}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Pre-Market Movers (when applicable) */}
                {marketStatus === 'Pre-Market' && (
                  <div>
                    <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '12px', color: '#F59E0B' }}>
                      🌅 Pre-Market Movers
                    </h3>
                    <div style={{ 
                      display: 'grid', 
                      gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', 
                      gap: '12px' 
                    }}>
                      {popularStocks.slice(0, 4).map(symbol => (
                        <div key={symbol} style={{
                          backgroundColor: '#1a1a1a',
                          borderRadius: '12px',
                          padding: '12px',
                          border: '1px solid #374151',
                          textAlign: 'center'
                        }}>
                          <p style={{ margin: '0 0 4px 0', fontWeight: 'bold' }}>{symbol}</p>
                          <p style={{ margin: '0 0 2px 0', fontSize: '14px' }}>{stockData[symbol]?.price || 'N/A'}</p>
                          <p style={{ margin: '0', fontSize: '10px', color: '#9CA3AF' }}>Pre-Market</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {activeTab === 'alerts' && (
          <div style={{ padding: '20px' }}>
            <div style={{ marginBottom: '16px' }}>
              <h2 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '8px' }}>
                Real-time Alerts • {marketStatus}
              </h2>
              <p style={{ color: '#9CA3AF', marginBottom: '8px', fontSize: '14px' }}>
                Comprehensive market monitoring with AI analysis
              </p>
              {alerts.length > 0 && alerts[0].timestamp && (
                <p style={{ color: '#6B7280', fontSize: '12px', margin: 0 }}>
                  Last Scan: {new Date(alerts[0].timestamp).toLocaleString()}
                </p>
              )}
            </div>
            
            {isLoading.alerts && (
              <div style={{ textAlign: 'center', padding: '40px 20px', color: '#9CA3AF' }}>
                <p style={{ fontSize: '48px', margin: '0 0 16px 0' }}>🔄</p>
                <p>Scanning comprehensive market data for alerts...</p>
                <p style={{ fontSize: '14px', marginTop: '8px' }}>
                  Monitoring breakouts, news, social sentiment, options flow
                </p>
              </div>
            )}

            {!isLoading.alerts && alerts.length === 0 && (
              <div style={{ textAlign: 'center', padding: '40px 20px', color: '#9CA3AF' }}>
                <p style={{ fontSize: '48px', margin: '0 0 16px 0' }}>🔔</p>
                <p style={{ fontSize: '18px', margin: '0 0 8px 0' }}>No active alerts</p>
                <p style={{ fontSize: '14px', margin: '0' }}>
                  No significant movements detected in current {marketStatus.toLowerCase()} conditions
                </p>
              </div>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {alerts.map((alert, idx) => (
                <div 
                  key={`${alert.id}-${idx}`} 
                  style={{
                    backgroundColor: alert.priority === 'high' ? 'rgba(239, 68, 68, 0.15)' :
                                    alert.priority === 'medium' ? 'rgba(245, 158, 11, 0.15)' :
                                    'rgba(16, 185, 129, 0.15)',
                    border: `2px solid ${alert.priority === 'high' ? '#EF4444' :
                                         alert.priority === 'medium' ? '#F59E0B' : '#10B981'}`,
                    borderRadius: '16px',
                    padding: '20px'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '16px' }}>
                    <span style={{ fontSize: '32px', flexShrink: 0 }}>
                      {alert.type === 'breakout' ? '📈' :
                       alert.type === 'breakdown' ? '📉' :
                       alert.type === 'volume_spike' ? '📊' :
                       alert.type === 'news' ? '📰' :
                       alert.type === 'social' ? '📱' :
                       alert.type === 'options' ? '⚡' :
                       alert.type === 'volatility' ? '🚨' :
                       alert.type === 'sector' ? '🎯' :
                       alert.type === 'economic' ? '🏛️' : '🔔'}
                    </span>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                        <h3 style={{ fontWeight: '700', margin: '0', fontSize: '18px', color: '#ffffff' }}>
                          {alert.title}
                          {alert.ticker && (
                            <span style={{ 
                              marginLeft: '8px', 
                              fontSize: '14px', 
                              fontWeight: '600',
                              color: alert.priority === 'high' ? '#FCA5A5' :
                                    alert.priority === 'medium' ? '#FCD34D' : '#A7F3D0'
                            }}>
                              {alert.ticker}
                            </span>
                          )}
                        </h3>
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px' }}>
                          <span style={{
                            fontSize: '11px',
                            padding: '2px 8px',
                            borderRadius: '4px',
                            backgroundColor: alert.priority === 'high' ? '#EF4444' :
                                            alert.priority === 'medium' ? '#F59E0B' : '#10B981',
                            color: '#ffffff',
                            fontWeight: 'bold',
                            textTransform: 'uppercase'
                          }}>
                            {alert.priority}
                          </span>
                          {alert.confidence && (
                            <span style={{ fontSize: '10px', color: '#9CA3AF' }}>
                              {alert.confidence}% confidence
                            </span>
                          )}
                        </div>
                      </div>
                      
                      <p style={{ fontSize: '15px', color: '#E5E7EB', margin: '0 0 12px 0', lineHeight: 1.5 }}>
                        {alert.description}
                      </p>
                      
                      {alert.action && (
                        <div style={{ 
                          backgroundColor: 'rgba(0, 0, 0, 0.3)', 
                          borderRadius: '8px', 
                          padding: '12px', 
                          marginBottom: '12px' 
                        }}>
                          <p style={{ fontSize: '13px', margin: '0', color: '#ffffff' }}>
                            <span style={{ fontWeight: '600' }}>💡 Action:</span> {alert.action}
                          </p>
                        </div>
                      )}

                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
                        <div style={{ display: 'flex', gap: '12px', fontSize: '12px', color: '#9CA3AF' }}>
                          <span>⏱️ {alert.timeframe}</span>
                          {alert.marketSession && <span>📊 {alert.marketSession}</span>}
                          {alert.profitPotential && <span>💰 {alert.profitPotential}</span>}
                        </div>
                        <span style={{ fontSize: '11px', color: '#6B7280' }}>
                          {new Date().toLocaleTimeString()}
                        </span>
                      </div>

                      {alert.dataSupport && (
                        <p style={{ fontSize: '11px', color: '#6B7280', margin: '8px 0 0 0', fontStyle: 'italic' }}>
                          Data: {alert.dataSupport}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'chat' && (
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            height: 'calc(100vh - 200px)',
            padding: '20px',
          }}>
            <div style={{
              flex: 1,
              overflowY: 'auto',
              marginBottom: '16px',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
            }}>
              {chatMessages.map((msg, idx) => (
                <div
                  key={idx}
                  style={{
                    maxWidth: '85%',
                    padding: '12px 16px',
                    borderRadius: '18px',
                    wordWrap: 'break-word',
                    backgroundColor: msg.role === 'user' ? '#3B82F6' : '#374151',
                    color: msg.role === 'user' ? '#ffffff' : '#E5E7EB',
                    alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start',
                    marginLeft: msg.role === 'user' ? 'auto' : '0',
                    marginRight: msg.role === 'user' ? '0' : 'auto',
                  }}
                >
                  {msg.content}
                </div>
              ))}
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <input
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
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
              <button
                onClick={handleSendMessage}
                style={{
                  backgroundColor: '#3B82F6',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '24px',
                  padding: '12px 24px',
                  cursor: 'pointer',
                  fontWeight: '600',
                }}
              >
                Send
              </button>
            </div>
          </div>
        )}

        {activeTab === 'settings' && (
          <div style={{ padding: '20px' }}>
            <div style={{
              backgroundColor: '#1a1a1a',
              borderRadius: '16px',
              padding: '20px',
              marginBottom: '16px'
            }}>
              <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '12px' }}>
                Feature Toggles
              </h3>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                <span>Enable Smart Plays</span>
                <label style={{ position: 'relative', display: 'inline-block', width: '40px', height: '20px' }}>
                  <input
                    type="checkbox"
                    checked={settings.enableSmartPlays}
                    onChange={(e) => handleSettingChange('enableSmartPlays', e.target.checked)}
                    style={{ opacity: 0, width: 0, height: 0 }}
                  />
                  <span style={{
                    position: 'absolute',
                    cursor: 'pointer',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    backgroundColor: settings.enableSmartPlays ? '#3B82F6' : '#6B7280',
                    transition: 'background-color 0.3s ease',
                    borderRadius: '20px'
                  }} />
                  <span style={{
                    position: 'absolute',
                    content: '',
                    height: '16px',
                    width: '16px',
                    left: '2px',
                    bottom: '2px',
                    backgroundColor: 'white',
                    transition: 'transform 0.3s ease',
                    borderRadius: '50%',
                    transform: settings.enableSmartPlays ? 'translateX(20px)' : 'translateX(0)'
                  }} />
                </label>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                <span>Enable Real-time Alerts</span>
                <label style={{ position: 'relative', display: 'inline-block', width: '40px', height: '20px' }}>
                  <input
                    type="checkbox"
                    checked={settings.enableRealTimeAlerts}
                    onChange={(e) => handleSettingChange('enableRealTimeAlerts', e.target.checked)}
                    style={{ opacity: 0, width: 0, height: 0 }}
                  />
                  <span style={{
                    position: 'absolute',
                    cursor: 'pointer',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    backgroundColor: settings.enableRealTimeAlerts ? '#3B82F6' : '#6B7280',
                    transition: 'background-color 0.3s ease',
                    borderRadius: '20px'
                  }} />
                  <span style={{
                    position: 'absolute',
                    content: '',
                    height: '16px',
                    width: '16px',
                    left: '2px',
                    bottom: '2px',
                    backgroundColor: 'white',
                    transition: 'transform 0.3s ease',
                    borderRadius: '50%',
                    transform: settings.enableRealTimeAlerts ? 'translateX(20px)' : 'translateX(0)'
                  }} />
                </label>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span>Enable AI Chat Assistant</span>
                <label style={{ position: 'relative', display: 'inline-block', width: '40px', height: '20px' }}>
                  <input
                    type="checkbox"
                    checked={settings.enableAIChat}
                    onChange={(e) => handleSettingChange('enableAIChat', e.target.checked)}
                    style={{ opacity: 0, width: 0, height: 0 }}
                  />
                  <span style={{
                    position: 'absolute',
                    cursor: 'pointer',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    backgroundColor: settings.enableAIChat ? '#3B82F6' : '#6B7280',
                    transition: 'background-color 0.3s ease',
                    borderRadius: '20px'
                  }} />
                  <span style={{
                    position: 'absolute',
                    content: '',
                    height: '16px',
                    width: '16px',
                    left: '2px',
                    bottom: '2px',
                    backgroundColor: 'white',
                    transition: 'transform 0.3s ease',
                    borderRadius: '50%',
                    transform: settings.enableAIChat ? 'translateX(20px)' : 'translateX(0)'
                  }} />
                </label>
              </div>
            </div>
            <div style={{
              backgroundColor: '#1a1a1a',
              borderRadius: '16px',
              padding: '20px',
            }}>
              <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '12px' }}>
                Play Confidence Level
              </h3>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={settings.playConfidenceLevel}
                  onChange={(e) => handleSettingChange('playConfidenceLevel', parseInt(e.target.value))}
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
                <span>{settings.playConfidenceLevel}%</span>
              </div>
              <p style={{ fontSize: '12px', color: '#6B7280', marginTop: '8px' }}>
                Only plays with confidence equal to or higher than this level will be shown.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Enhanced Bottom Navigation */}
      <div style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: '#1a1a1a',
        borderTop: '1px solid #374151',
        padding: '8px 0',
        paddingBottom: 'env(safe-area-inset-bottom, 8px)',
        zIndex: 1000
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-around',
          alignItems: 'center',
        }}>
          {[
            { id: 'ticker', icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z', label: 'Stocks' },
            { id: 'analysis', icon: 'M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z', label: 'Analysis' },
            { id: 'plays', icon: 'M13 10V3L4 14h7v7l9-11h-7z', label: 'Plays' },
            { id: 'market', icon: 'M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z', label: 'Market' },
            { id: 'alerts', icon: 'M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9', label: 'Alerts' },
            { id: 'chat', icon: 'M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z', label: 'Chat' },
            { id: 'settings', icon: 'M19.14 12.94c.04-.3.06-.61.06-.94 0-.32-.02-.64-.07-.94l2.03-1.58a.49.49 0 0 0 .12-.83l-2.25-1V8l-1.09-1.84a.5.5 0 0 0-.83-.12l-1.57 2.02a3.74 3.74 0 0 0-.94-.07c-.33 0-.64.02-.94.07L8.01 6.26a.5.5 0 0 0-.83.12L6.1 8v1.02l-2.25 1a.5.5 0 0 0-.12.83l2.03 1.58c-.05.3-.07.62-.07.94s.02.64.07.94L3.8 14.92a.5.5 0 0 0 .12.83l2.25 1V17l1.09 1.84c.22.13.58.13.83-.12l1.57-2.02c.3.05.61.07.94.07.32 0 .64-.02.94-.07l1.58 2.03c.25.13.61.13.83-.12l1.09-1.84v-1.02l2.25-1a.5.5 0 0 0 .12-.83l-2.03-1.58z', label: 'Settings' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => handleTabChange(tab.id)}
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
              <svg width="24" height="24" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={tab.icon} />
              </svg>
              <span style={{
                fontSize: '11px',
                marginTop: '4px',
                fontWeight: activeTab === tab.id ? '600' : '400'
              }}>
                {tab.label}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* CSS animations */}
      <style>
        {`
          @keyframes pulse {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.5; }
          }
        `}
      </style>
    </div>
  );
};

export default RoloApp;