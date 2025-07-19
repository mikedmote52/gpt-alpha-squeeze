import { useState, useEffect } from 'react';

interface DataStatus {
  alpaca: boolean;
  marketData: boolean;
  reddit: boolean;
  scanner: boolean;
  lastUpdate: string;
}

export default function DataStatusIndicator() {
  const [status, setStatus] = useState<DataStatus>({
    alpaca: false,
    marketData: false,
    reddit: false,
    scanner: false,
    lastUpdate: 'Never'
  });

  const checkDataSources = async () => {
    try {
      // Test Alpaca connection
      const alpacaTest = await fetch('/api/alpaca/positions');
      const alpacaStatus = alpacaTest.ok;

      // Test market data (Yahoo Finance fallback)
      const marketTest = await fetch('/api/test-market-data');
      const marketStatus = marketTest.ok;

      // Test Reddit access
      const redditTest = await fetch('/api/test-reddit');
      const redditStatus = redditTest.ok;

      // Test scanner
      const scannerTest = await fetch('/api/scanner?universe=SQUEEZE_FOCUS&minScore=1&maxResults=1');
      const scannerStatus = scannerTest.ok;

      setStatus({
        alpaca: alpacaStatus,
        marketData: marketStatus,
        reddit: redditStatus,
        scanner: scannerStatus,
        lastUpdate: new Date().toLocaleTimeString()
      });
    } catch (error) {
      console.error('Error checking data sources:', error);
    }
  };

  useEffect(() => {
    checkDataSources();
    const interval = setInterval(checkDataSources, 30000); // Check every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const getStatusColor = (isActive: boolean) => 
    isActive ? 'text-green-500' : 'text-red-500';

  const getStatusIcon = (isActive: boolean) => 
    isActive ? '✅' : '❌';

  const overallHealth = Object.values(status).filter(Boolean).length - 1; // Exclude lastUpdate
  const totalSources = 4;
  const healthPercent = Math.round((overallHealth / totalSources) * 100);

  return (
    <div className="bg-gray-50 border rounded-lg p-3 mb-4">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-semibold text-gray-700">
          🔗 Real-Time Data Status
        </h3>
        <div className={`text-lg font-bold ${
          healthPercent >= 75 ? 'text-green-600' : 
          healthPercent >= 50 ? 'text-yellow-600' : 'text-red-600'
        }`}>
          {healthPercent}%
        </div>
      </div>
      
      <div className="grid grid-cols-2 gap-2 text-xs">
        <div className={`flex items-center ${getStatusColor(status.alpaca)}`}>
          {getStatusIcon(status.alpaca)} Alpaca Portfolio
        </div>
        <div className={`flex items-center ${getStatusColor(status.marketData)}`}>
          {getStatusIcon(status.marketData)} Market Data
        </div>
        <div className={`flex items-center ${getStatusColor(status.reddit)}`}>
          {getStatusIcon(status.reddit)} Reddit Sentiment
        </div>
        <div className={`flex items-center ${getStatusColor(status.scanner)}`}>
          {getStatusIcon(status.scanner)} Live Scanner
        </div>
      </div>
      
      <div className="mt-2 text-xs text-gray-500">
        Last checked: {status.lastUpdate}
      </div>
      
      {healthPercent >= 75 && (
        <div className="mt-2 text-xs text-green-700 bg-green-100 rounded px-2 py-1">
          ✨ All systems operational - AI has access to real-time data
        </div>
      )}
      
      {healthPercent < 50 && (
        <div className="mt-2 text-xs text-red-700 bg-red-100 rounded px-2 py-1">
          ⚠️ Limited data access - recommendations may use cached/fallback data
        </div>
      )}
    </div>
  );
}