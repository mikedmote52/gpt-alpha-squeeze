import { useEffect, useState } from 'react';

interface PerformanceData {
  summary: {
    period: string;
    total_return: number;
    annualized_return: number;
    sharpe_ratio: number;
    max_drawdown: number;
    alpha_p_value: number;
    is_beating_baseline: boolean;
    days_tracked: number;
  };
  risk_assessment: {
    risk_grade: string;
    risk_score: number;
    var_95: number;
    var_99: number;
    beta: number;
    alerts: string[];
  };
  alpha_test: {
    is_significant: boolean;
    p_value: number;
    confidence_level: number;
    interpretation: string;
    power: number;
  };
  alerts: any[];
}

export default function PerformanceDashboard() {
  const [data, setData] = useState<PerformanceData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [period, setPeriod] = useState('30');

  useEffect(() => {
    fetchPerformanceData();
  }, [period]);

  const fetchPerformanceData = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/performance/dashboard?period=${period}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch performance data');
      }
      
      const result = await response.json();
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  const syncData = async () => {
    try {
      const response = await fetch('/api/performance/sync', { method: 'POST' });
      if (response.ok) {
        await fetchPerformanceData();
      }
    } catch (err) {
      console.error('Sync failed:', err);
    }
  };

  const formatPercentage = (value: number) => `${(value * 100).toFixed(2)}%`;
  const formatNumber = (value: number) => value.toFixed(4);

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h2 className="text-2xl font-semibold mb-4">Performance Dashboard</h2>
        <div className="text-center py-8">Loading performance data...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h2 className="text-2xl font-semibold mb-4">Performance Dashboard</h2>
        <div className="text-red-600 text-center py-8">Error: {error}</div>
        <button
          onClick={fetchPerformanceData}
          className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Retry
        </button>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h2 className="text-2xl font-semibold mb-4">Performance Dashboard</h2>
        <div className="text-center py-8">No performance data available</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-semibold">Performance Dashboard</h2>
          <div className="flex space-x-2">
            <select
              value={period}
              onChange={(e) => setPeriod(e.target.value)}
              className="px-3 py-2 border rounded"
            >
              <option value="7">7 Days</option>
              <option value="30">30 Days</option>
              <option value="60">60 Days</option>
              <option value="90">90 Days</option>
            </select>
            <button
              onClick={syncData}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              Sync Data
            </button>
          </div>
        </div>

        {/* Alpha Generation Status */}
        <div className={`p-4 rounded-lg mb-4 ${
          data.alpha_test.is_significant 
            ? 'bg-green-100 border-green-400' 
            : 'bg-yellow-100 border-yellow-400'
        } border`}>
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold">
                {data.alpha_test.is_significant ? '✅ Alpha Generation Detected' : '⚠️ Alpha Generation Inconclusive'}
              </h3>
              <p className="text-sm text-gray-600 mt-1">
                p-value: {data.alpha_test.p_value.toFixed(4)} | 
                Confidence: {data.alpha_test.confidence_level}% | 
                Power: {formatPercentage(data.alpha_test.power)}
              </p>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold">
                {data.summary.is_beating_baseline ? '🚀' : '📊'}
              </div>
              <div className="text-sm text-gray-600">
                {data.summary.days_tracked} days tracked
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Performance Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow p-4">
          <h3 className="text-sm font-medium text-gray-600">Total Return</h3>
          <div className={`text-2xl font-bold ${
            data.summary.total_return >= 0 ? 'text-green-600' : 'text-red-600'
          }`}>
            {formatPercentage(data.summary.total_return)}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-4">
          <h3 className="text-sm font-medium text-gray-600">Annualized Return</h3>
          <div className={`text-2xl font-bold ${
            data.summary.annualized_return >= 0 ? 'text-green-600' : 'text-red-600'
          }`}>
            {formatPercentage(data.summary.annualized_return)}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-4">
          <h3 className="text-sm font-medium text-gray-600">Sharpe Ratio</h3>
          <div className={`text-2xl font-bold ${
            data.summary.sharpe_ratio >= 1 ? 'text-green-600' : 
            data.summary.sharpe_ratio >= 0.5 ? 'text-yellow-600' : 'text-red-600'
          }`}>
            {formatNumber(data.summary.sharpe_ratio)}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-4">
          <h3 className="text-sm font-medium text-gray-600">Max Drawdown</h3>
          <div className={`text-2xl font-bold ${
            data.summary.max_drawdown <= 0.10 ? 'text-green-600' : 
            data.summary.max_drawdown <= 0.20 ? 'text-yellow-600' : 'text-red-600'
          }`}>
            {formatPercentage(data.summary.max_drawdown)}
          </div>
        </div>
      </div>

      {/* Risk Assessment */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h3 className="text-lg font-semibold mb-4">Risk Assessment</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
          <div className="text-center">
            <div className={`text-3xl font-bold mb-2 ${
              data.risk_assessment.risk_grade === 'A' ? 'text-green-600' :
              data.risk_assessment.risk_grade === 'B' ? 'text-blue-600' :
              data.risk_assessment.risk_grade === 'C' ? 'text-yellow-600' :
              'text-red-600'
            }`}>
              {data.risk_assessment.risk_grade}
            </div>
            <div className="text-sm text-gray-600">Risk Grade</div>
          </div>

          <div className="text-center">
            <div className="text-2xl font-bold mb-2">{formatPercentage(data.risk_assessment.var_95)}</div>
            <div className="text-sm text-gray-600">VaR 95%</div>
          </div>

          <div className="text-center">
            <div className="text-2xl font-bold mb-2">{formatPercentage(data.risk_assessment.var_99)}</div>
            <div className="text-sm text-gray-600">VaR 99%</div>
          </div>

          <div className="text-center">
            <div className="text-2xl font-bold mb-2">{formatNumber(data.risk_assessment.beta)}</div>
            <div className="text-sm text-gray-600">Beta</div>
          </div>
        </div>

        {data.risk_assessment.alerts.length > 0 && (
          <div className="bg-yellow-50 border border-yellow-200 rounded p-4">
            <h4 className="font-semibold text-yellow-800 mb-2">Risk Alerts</h4>
            <ul className="text-sm text-yellow-700 space-y-1">
              {data.risk_assessment.alerts.map((alert, index) => (
                <li key={index}>• {alert}</li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Alpha Test Results */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h3 className="text-lg font-semibold mb-4">Statistical Analysis</h3>
        <div className="bg-gray-50 p-4 rounded">
          <p className="text-sm text-gray-700">{data.alpha_test.interpretation}</p>
        </div>
      </div>

      {/* Active Alerts */}
      {data.alerts.length > 0 && (
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h3 className="text-lg font-semibold mb-4">Active Alerts</h3>
          <div className="space-y-3">
            {data.alerts.map((alert, index) => (
              <div
                key={index}
                className={`p-3 rounded border-l-4 ${
                  alert.severity === 'critical' ? 'border-red-500 bg-red-50' :
                  alert.severity === 'high' ? 'border-orange-500 bg-orange-50' :
                  alert.severity === 'medium' ? 'border-yellow-500 bg-yellow-50' :
                  'border-blue-500 bg-blue-50'
                }`}
              >
                <div className="flex justify-between items-start">
                  <div>
                    <div className="font-medium">{alert.message}</div>
                    <div className="text-sm text-gray-600 mt-1">
                      {new Date(alert.created_at).toLocaleDateString()}
                    </div>
                  </div>
                  <span className={`px-2 py-1 text-xs rounded ${
                    alert.severity === 'critical' ? 'bg-red-100 text-red-800' :
                    alert.severity === 'high' ? 'bg-orange-100 text-orange-800' :
                    alert.severity === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-blue-100 text-blue-800'
                  }`}>
                    {alert.severity.toUpperCase()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}