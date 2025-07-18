export { default as PerformanceDatabase } from './database';
export { default as TradeLogger } from './tradeLogger';
export { default as ReturnCalculator } from './returnCalculator';
export { default as RiskMetricsCalculator } from './riskMetrics';
export { default as AlphaTestingEngine } from './alphaTest';
export { default as AlertSystem } from './alertSystem';

// Main performance tracking orchestrator
import PerformanceDatabase from './database';
import TradeLogger from './tradeLogger';
import ReturnCalculator from './returnCalculator';
import RiskMetricsCalculator from './riskMetrics';
import AlphaTestingEngine from './alphaTest';
import AlertSystem from './alertSystem';

export class PerformanceTracker {
  private db: PerformanceDatabase;
  private tradeLogger: TradeLogger;
  private returnCalculator: ReturnCalculator;
  private riskCalculator: RiskMetricsCalculator;
  private alphaEngine: AlphaTestingEngine;
  private alertSystem: AlertSystem;

  constructor() {
    this.db = new PerformanceDatabase();
    this.tradeLogger = new TradeLogger();
    this.returnCalculator = new ReturnCalculator();
    this.riskCalculator = new RiskMetricsCalculator();
    this.alphaEngine = new AlphaTestingEngine();
    this.alertSystem = new AlertSystem();
  }

  async syncPerformanceData(portfolioValue: number, additionalMetrics?: any) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Get historical data for calculations
    const last30Days = new Date();
    last30Days.setDate(last30Days.getDate() - 30);
    const historicalMetrics = await this.db.getPerformanceMetrics(last30Days, today);

    // Calculate returns and risk metrics
    const performanceSummary = await this.returnCalculator.getPerformanceSummary(30);
    const riskSummary = await this.riskCalculator.getRiskSummary(30);

    // Record daily performance
    await this.db.recordDailyPerformance({
      date: today,
      portfolio_value: portfolioValue,
      daily_return: performanceSummary.summary.total_return,
      cumulative_return: performanceSummary.summary.total_return,
      sharpe_ratio: performanceSummary.summary.sharpe_ratio,
      max_drawdown: performanceSummary.summary.max_drawdown,
      volatility: performanceSummary.summary.volatility,
      ...additionalMetrics
    });

    // Check for alerts
    await this.alertSystem.evaluatePerformanceAlerts(
      portfolioValue,
      {
        daily_return: performanceSummary.daily.portfolio_return,
        sharpe_ratio: performanceSummary.summary.sharpe_ratio,
        max_drawdown: performanceSummary.summary.max_drawdown,
        volatility: performanceSummary.summary.volatility,
        var_95: riskSummary.current_metrics.var_95,
        excess_return: performanceSummary.daily.excess_return,
        win_rate: performanceSummary.summary.win_rate
      },
      historicalMetrics.map(m => m.portfolio_value)
    );

    return {
      performance: performanceSummary,
      risk: riskSummary,
      alerts: await this.alertSystem.getActiveAlerts()
    };
  }

  async getFullPerformanceReport(days: number = 30) {
    const [performance, risk, alphaTest, alerts] = await Promise.all([
      this.returnCalculator.getPerformanceSummary(days),
      this.riskCalculator.getRiskSummary(days),
      this.alphaEngine.runComprehensiveAlphaTest(days),
      this.alertSystem.getAlertsSummary()
    ]);

    return {
      performance,
      risk,
      alpha_test: alphaTest,
      alerts,
      generated_at: new Date().toISOString()
    };
  }

  async validateAlphaGeneration(days: number = 60) {
    const alphaTest = await this.alphaEngine.runComprehensiveAlphaTest(days);
    
    return {
      is_generating_alpha: alphaTest.meta_analysis.consistent_alpha,
      confidence_level: alphaTest.main_test.confidence_level,
      p_value: alphaTest.main_test.p_value,
      recommendation: alphaTest.meta_analysis.recommendation,
      supporting_evidence: {
        significant_tests: alphaTest.meta_analysis.significant_tests,
        total_tests: alphaTest.meta_analysis.total_tests,
        average_p_value: alphaTest.meta_analysis.average_p_value
      }
    };
  }
}

export default PerformanceTracker;