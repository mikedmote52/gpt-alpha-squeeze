import type { NextApiRequest, NextApiResponse } from 'next';
import ReturnCalculator from '../../../lib/performance/returnCalculator';
import RiskMetricsCalculator from '../../../lib/performance/riskMetrics';
import AlphaTestingEngine from '../../../lib/performance/alphaTest';
import PerformanceDatabase from '../../../lib/performance/database';

interface DashboardResponse {
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
  performance_metrics: {
    daily: any;
    weekly: any;
    monthly: any;
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
  recent_trades: any[];
  alerts: any[];
}

export default async function handler(req: NextApiRequest, res: NextApiResponse<DashboardResponse | { error: string }>) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Only GET allowed' });
  }

  try {
    const { period = '30' } = req.query;
    const days = parseInt(period as string) || 30;

    // Initialize calculators
    const returnCalculator = new ReturnCalculator();
    const riskCalculator = new RiskMetricsCalculator();
    const alphaEngine = new AlphaTestingEngine();
    const db = new PerformanceDatabase();

    // Run all calculations in parallel
    const [
      performanceSummary,
      riskSummary,
      alphaTest,
      recentTrades,
      alerts
    ] = await Promise.all([
      returnCalculator.getPerformanceSummary(days),
      riskCalculator.getRiskSummary(days),
      alphaEngine.runComprehensiveAlphaTest(days),
      db.getTradeHistory(undefined, 20),
      db.getUnresolvedAlerts()
    ]);

    // Calculate days tracked
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    const metricsData = await db.getPerformanceMetrics(startDate, endDate);

    // Build response
    const response: DashboardResponse = {
      summary: {
        period: `${days}d`,
        total_return: performanceSummary.summary.total_return,
        annualized_return: performanceSummary.summary.annualized_return,
        sharpe_ratio: performanceSummary.summary.sharpe_ratio,
        max_drawdown: performanceSummary.summary.max_drawdown,
        alpha_p_value: alphaTest.main_test.p_value,
        is_beating_baseline: alphaTest.main_test.is_significant,
        days_tracked: metricsData.length
      },
      performance_metrics: {
        daily: performanceSummary.daily,
        weekly: performanceSummary.weekly,
        monthly: performanceSummary.monthly
      },
      risk_assessment: {
        risk_grade: riskSummary.risk_grade,
        risk_score: riskSummary.risk_score,
        var_95: riskSummary.current_metrics.var_95,
        var_99: riskSummary.current_metrics.var_99,
        beta: riskSummary.current_metrics.beta,
        alerts: riskSummary.alerts
      },
      alpha_test: {
        is_significant: alphaTest.main_test.is_significant,
        p_value: alphaTest.main_test.p_value,
        confidence_level: alphaTest.main_test.confidence_level,
        interpretation: alphaTest.main_test.interpretation,
        power: alphaTest.main_test.power
      },
      recent_trades: recentTrades,
      alerts: alerts
    };

    res.status(200).json(response);
  } catch (error) {
    console.error('Dashboard API error:', error);
    res.status(500).json({ error: 'Failed to generate performance dashboard' });
  }
}