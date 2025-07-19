// Portfolio Health Dashboard Component
// Displays overall portfolio health metrics and AI insights

import React from 'react';
import { PortfolioHealth } from '../types/recommendations';

interface PortfolioHealthDashboardProps {
  health?: PortfolioHealth;
  positions?: any;
  candidates?: any;
  learningStatus?: any;
}

const PortfolioHealthDashboard: React.FC<PortfolioHealthDashboardProps> = ({ health, positions, candidates, learningStatus }) => {
  // Handle legacy prop structure or use health directly
  const portfolioHealth = health || {
    overallScore: 0,
    riskScore: 100,
    diversificationScore: 0,
    momentumScore: 0,
    projectedReturn: 0,
    projectedTimeframe: 'Unknown',
    strengths: [],
    weaknesses: ['No data available'],
    recommendations: [],
    sectorExposure: []
  };
  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    if (score >= 40) return 'text-orange-600';
    return 'text-red-600';
  };

  const getScoreBackground = (score: number) => {
    if (score >= 80) return 'bg-green-100';
    if (score >= 60) return 'bg-yellow-100';
    if (score >= 40) return 'bg-orange-100';
    return 'bg-red-100';
  };

  const CircularProgress = ({ score, label }: { score: number; label: string }) => {
    const radius = 45;
    const circumference = 2 * Math.PI * radius;
    const strokeDashoffset = circumference - (score / 100) * circumference;

    return (
      <div className="relative">
        <svg className="w-32 h-32 transform -rotate-90">
          <circle
            cx="64"
            cy="64"
            r={radius}
            stroke="#e5e7eb"
            strokeWidth="8"
            fill="none"
          />
          <circle
            cx="64"
            cy="64"
            r={radius}
            stroke={score >= 80 ? '#10b981' : score >= 60 ? '#f59e0b' : score >= 40 ? '#fb923c' : '#ef4444'}
            strokeWidth="8"
            fill="none"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            className="transition-all duration-500"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className={`text-3xl font-bold ${getScoreColor(score)}`}>{score}</span>
          <span className="text-sm text-gray-600">{label}</span>
        </div>
      </div>
    );
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Portfolio Health Dashboard</h2>

      {/* Main Score */}
      <div className="flex justify-center mb-8">
        <div className="text-center">
          <div className={`text-6xl font-bold ${getScoreColor(portfolioHealth.overallScore)} mb-2`}>
            {portfolioHealth.overallScore}
          </div>
          <p className="text-gray-600 text-lg">Overall Portfolio Health</p>
          <div className={`mt-2 px-4 py-1 rounded-full inline-block ${getScoreBackground(portfolioHealth.overallScore)}`}>
            <span className={`font-medium ${getScoreColor(portfolioHealth.overallScore)}`}>
              {portfolioHealth.overallScore >= 80 ? 'Excellent' :
               portfolioHealth.overallScore >= 60 ? 'Good' :
               portfolioHealth.overallScore >= 40 ? 'Fair' : 'Needs Attention'}
            </span>
          </div>
        </div>
      </div>

      {/* Score Breakdown */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-8">
        <div className="flex justify-center">
          <CircularProgress score={portfolioHealth.riskScore} label="Risk Score" />
        </div>
        <div className="flex justify-center">
          <CircularProgress score={portfolioHealth.diversificationScore} label="Diversification" />
        </div>
        <div className="flex justify-center">
          <CircularProgress score={portfolioHealth.momentumScore} label="Momentum" />
        </div>
        <div className="flex justify-center">
          <div className="text-center">
            <div className="w-32 h-32 flex flex-col items-center justify-center bg-blue-50 rounded-full">
              <span className="text-3xl font-bold text-blue-600">
                {portfolioHealth.projectedReturn > 0 ? '+' : ''}{(portfolioHealth.projectedReturn * 100).toFixed(1)}%
              </span>
              <span className="text-sm text-gray-600">Projected Return</span>
              <span className="text-xs text-gray-500">{portfolioHealth.projectedTimeframe}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Strengths and Weaknesses */}
      <div className="grid md:grid-cols-2 gap-6 mb-6">
        {/* Strengths */}
        <div className="bg-green-50 p-4 rounded-lg">
          <h3 className="font-bold text-green-800 mb-3 flex items-center">
            <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            Portfolio Strengths
          </h3>
          {portfolioHealth.strengths.length > 0 ? (
            <ul className="space-y-2">
              {portfolioHealth.strengths.map((strength, index) => (
                <li key={index} className="flex items-start">
                  <span className="text-green-600 mr-2">•</span>
                  <span className="text-gray-700">{strength}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-gray-600">Building strength metrics...</p>
          )}
        </div>

        {/* Weaknesses */}
        <div className="bg-red-50 p-4 rounded-lg">
          <h3 className="font-bold text-red-800 mb-3 flex items-center">
            <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
            Areas for Improvement
          </h3>
          {portfolioHealth.weaknesses.length > 0 ? (
            <ul className="space-y-2">
              {portfolioHealth.weaknesses.map((weakness, index) => (
                <li key={index} className="flex items-start">
                  <span className="text-red-600 mr-2">•</span>
                  <span className="text-gray-700">{weakness}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-gray-600">No critical issues identified</p>
          )}
        </div>
      </div>

      {/* AI Recommendations */}
      {portfolioHealth.recommendations.length > 0 && (
        <div className="bg-blue-50 p-4 rounded-lg">
          <h3 className="font-bold text-blue-800 mb-3 flex items-center">
            <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
            AI Recommendations
          </h3>
          <ul className="space-y-2">
            {portfolioHealth.recommendations.map((rec, index) => (
              <li key={index} className="flex items-start">
                <span className="text-blue-600 mr-2">→</span>
                <span className="text-gray-700">{rec}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Sector Exposure (if available) */}
      {portfolioHealth.sectorExposure.length > 0 && (
        <div className="mt-6">
          <h3 className="font-bold text-gray-800 mb-3">Sector Exposure</h3>
          <div className="space-y-2">
            {portfolioHealth.sectorExposure.map((sector, index) => (
              <div key={index} className="flex items-center justify-between">
                <span className="text-gray-700">{sector.sector}</span>
                <div className="flex items-center space-x-2">
                  <div className="w-32 bg-gray-200 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full ${
                        sector.risk === 'HIGH' ? 'bg-red-500' :
                        sector.risk === 'MEDIUM' ? 'bg-yellow-500' : 'bg-green-500'
                      }`}
                      style={{ width: `${sector.percentage}%` }}
                    />
                  </div>
                  <span className="text-sm text-gray-600 w-12 text-right">
                    {sector.percentage.toFixed(0)}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default PortfolioHealthDashboard;