import type { NextApiRequest, NextApiResponse } from 'next';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Return real data structure with safe defaults - no complex API calls
  res.status(200).json({
    success: true,
    recommendations: [], // No current recommendations
    portfolioHealth: {
      overallScore: 0,
      riskScore: 100,
      diversificationScore: 0,
      momentumScore: 0,
      projectedReturn: 0,
      projectedTimeframe: 'Connect portfolio for analysis',
      strengths: [],
      weaknesses: ['Connect portfolio to begin AI analysis'],
      recommendations: [],
      optimizationsReady: 0
    },
    stockTheses: [],
    learningContext: {
      totalPatterns: 0,
      patternInsights: []
    }
  });
}