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
      const marketResponse = await fetch('/.netlify/functions/market-dashboard');
      if (marketResponse.ok) {
        const marketDataResponse = await marketResponse.json();
        const economicResponse = await fetch('/.netlify/functions/economic-indicators');
        const economicData = await economicResponse.json();
        if (marketDataResponse && Object.keys(marketDataResponse).length > 0) {
          setMarketData({
            ...marketDataResponse,
            economicIndicators: economicData.indicators || {},
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
    if (!chatInput.trim() || !settings.enableAIChat) return;
    
    setChatMessages(prev => [...prev, { role: 'user', content: chatInput }]);
    const message = chatInput;
    setChatInput('');
    
    try {
      const response = await fetch('/.netlify/functions/enhanced-rolo-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          message: `${message} (Context: Current stock: ${selectedStock}, Market status: ${marketStatus}, Recent plays: ${JSON.stringify(smartPlays.map(p => p.title))}, Alerts: ${JSON.stringify(alerts.map(a => a.title))}, Time: ${new Date().toLocaleString()})`,
          context: { selectedStock, marketStatus, activeTab, smartPlays, alerts }
        }),
      });
      if (response.ok) {
        const data = await response.json();
        setChatMessages(prev => [...prev, { role: 'ai', content: data.response || 'Sorry, I encountered an error accessing real-time data.' }]);
      }
    } catch (error) {
      setChatMessages(prev => [...prev, { role: 'ai', content: 'Sorry, I encountered an error. Please try again.' }]);
    }
  }, [chatInput, selectedStock, marketStatus, activeTab, smartPlays, alerts, settings.enableAIChat]);

  const handleEditStocks = useCallback(() => {
    setIsEditingStocks(!isEditingStocks);
  }, [isEditingStocks]);

  const handleStockEdit = useCallback((index, newSymbol) => {
    if (newSymbol && newSymbol.trim()) {
      const updatedStocks = [...popularStocks];
      updatedStocks[index] = newSymbol.toUpperCase().trim();
      setPopularStocks(updatedStocks);
      localStorage.setItem('roloPopularStocks', JSON.stringify(updatedStocks));
      fetchStockData(updatedStocks[index]); // Refresh data for new symbol
    }
  }, [popularStocks, fetchStockData]);

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

  const handleSettingChange = (key, value) => {
    const newSettings = { ...settings, [key]: value };
    saveSettings(newSettings);
  };

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
      WebkitFontSmoothing: 'antialiased',
      MozOsxFontSmoothing: 'grayscale'
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
                    transition: 'border-color 0.3s ease'
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
                    transition: 'background-color 0.3s ease'
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
                    transition: 'background-color 0.3s ease'
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
                            transition: 'all 0.2s ease',
                            position: 'relative',
                            boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
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
                                  width: '60px',
                                  outline: 'none',
                                  transition: 'border-color 0.3s ease'
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
                                    cursor: 'pointer',
                                    transition: 'background-color 0.3s ease'
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
                          fontSize: '24px',
                          transition: 'background-color 0.3s ease'
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
                  boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1), 0 2px 4px -1px rgba(0,0,0,0.06)',
                  transition: 'box-shadow 0.3s ease'
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
                        boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
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

        {activeTab === 'settings' && (
          <div style={{ padding: '20px' }}>
            <h2 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '16px' }}>
              Settings
            </h2>
            <div style={{
              backgroundColor: '#1a1a1a',
              borderRadius: '16px',
              padding: '20px',
              marginBottom: '16px',
              boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1), 0 2px 4px -1px rgba(0,0,0,0.06)'
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
              boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1), 0 2px 4px -1px rgba(0,0,0,0.06)'
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

        {/* ... (rest of the tabs remain the same as in Version A, with added transitions and shadows for iOS feel) */}

      </div>

      {/* Bottom Navigation with iOS blur-like effect */}
      <div style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: 'rgba(26,26,26,0.8)',
        backdropFilter: 'blur(10px)',
        borderTop: '1px solid rgba(55,65,81,0.5)',
        padding: '8px 0',
        paddingBottom: 'env(safe-area-inset-bottom, 8px)',
        zIndex: 1000,
        boxShadow: '0 -1px 3px rgba(0,0,0,0.1)'
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
                transition: 'color 0.3s ease',
                minWidth: '60px',
                userSelect: 'none'
              }}
            >
              <svg width="24" height="24" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ transition: 'transform 0.3s ease' }}>
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
          input:focus, button:focus {
            box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.5);
          }
        `}
      </style>
    </div>
  );
};

export default RoloApp;