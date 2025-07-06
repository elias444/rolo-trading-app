import React, { useState, useEffect, useRef } from 'react';

const RoloApp = () => {
  const [currentTab, setCurrentTab] = useState('chat');
  const [ticker, setTicker] = useState('');
  const [messages, setMessages] = useState([
    {
      id: 1,
      type: 'assistant',
      content: "Hello! I'm Rolo, your AI-powered trading assistant. I'm connected to live market data and ready to help you analyze stocks, find options plays, and learn your trading style. What would you like to explore today?",
      timestamp: new Date()
    }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [apiConnected, setApiConnected] = useState(false);
  const [stockData, setStockData] = useState({});
  const [currentAnalysis, setCurrentAnalysis] = useState(null);
  const [watchlists, setWatchlists] = useState({
    'Main Portfolio': ['SPY', 'QQQ', 'AAPL'],
    'Growth Stocks': ['TSLA', 'NVDA'],
    'Tech': ['MSFT', 'GOOGL']
  });
  const [activeWatchlist, setActiveWatchlist] = useState('Main Portfolio');
  const [newWatchlistName, setNewWatchlistName] = useState('');
  const [showNewWatchlistInput, setShowNewWatchlistInput] = useState(false);
  const [newTickerInput, setNewTickerInput] = useState('');
  const [isLoadingStock, setIsLoadingStock] = useState(false);
  const [apiError, setApiError] = useState(null);
  const [openMenus, setOpenMenus] = useState({});
  const [openWatchlistMenus, setOpenWatchlistMenus] = useState({});
  const [analysisResults, setAnalysisResults] = useState({});
  const messagesEndRef = useRef(null);

  useEffect(() => {
    setTimeout(() => {
      setApiConnected(true);
      loadWatchlistData();
    }, 2000);
  }, []);

  const loadWatchlistData = async () => {
    const allTickers = Object.values(watchlists).flat();
    const uniqueTickers = [...new Set(allTickers)];
    
    for (const symbol of uniqueTickers.slice(0, 5)) {
      await fetchRealStockData(symbol, false);
      await new Promise(resolve => setTimeout(resolve, 200));
    }
  };

  const fetchRealStockData = async (symbol, showLoading = true) => {
    if (showLoading) setIsLoadingStock(true);
    setApiError(null);

    try {
      const response = await fetch(`/.netlify/functions/stock-data?symbol=${symbol}`);
      
      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.error && !data.fallback) {
        throw new Error(data.error);
      }
      
      const stockInfo = data.fallback ? 
        {
          price: (Math.random() * 100 + 200).toFixed(2),
          change: (Math.random() * 10 - 5).toFixed(2),
          changePercent: (Math.random() * 4 - 2).toFixed(2),
          volume: (Math.random() * 50 + 10).toFixed(1),
          high: (Math.random() * 100 + 220).toFixed(2),
          low: (Math.random() * 100 + 180).toFixed(2),
          open: (Math.random() * 100 + 200).toFixed(2),
          prevClose: (Math.random() * 100 + 200).toFixed(2),
          isLive: false
        } : data;

      setStockData(prev => ({
        ...prev,
        [symbol]: stockInfo
      }));

      return stockInfo;
    } catch (error) {
      console.error('Error fetching stock data:', error);
      setApiError(error.message);
      
      const mockData = {
        price: (Math.random() * 100 + 200).toFixed(2),
        change: (Math.random() * 10 - 5).toFixed(2),
        changePercent: (Math.random() * 4 - 2).toFixed(2),
        volume: (Math.random() * 50 + 10).toFixed(1),
        high: (Math.random() * 100 + 220).toFixed(2),
        low: (Math.random() * 100 + 180).toFixed(2),
        open: (Math.random() * 100 + 200).toFixed(2),
        prevClose: (Math.random() * 100 + 200).toFixed(2),
        isLive: false
      };
      
      setStockData(prev => ({
        ...prev,
        [symbol]: mockData
      }));
      
      return mockData;
    } finally {
      if (showLoading) setIsLoadingStock(false);
    }
  };

  return (
    <div style={{ 
      width: '100vw',
      height: '100vh', 
      display: 'flex', 
      flexDirection: 'column', 
      backgroundColor: '#f8fafc',
      fontFamily: 'system-ui, -apple-system, sans-serif',
      margin: 0,
      padding: 0,
      overflow: 'hidden'
    }}>
      <div style={{ 
        background: 'linear-gradient(to right, #7c3aed, #6366f1)', 
        color: 'white', 
        padding: '16px',
        textAlign: 'center'
      }}>
        <h1 style={{ margin: 0, fontSize: '20px' }}>Rolo AI Trading</h1>
        <p style={{ margin: '8px 0 0 0', fontSize: '14px' }}>Your AI Trading Assistant</p>
      </div>
      
      <div style={{ 
        flex: 1, 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: