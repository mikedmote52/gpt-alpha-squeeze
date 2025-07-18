import PerformanceDatabase from './database';

interface RiskMetrics {
  sharpe_ratio: number;
  sortino_ratio: number;
  max_drawdown: number;
  var_95: number;
  var_99: number;
  expected_shortfall: number;
  beta: number;
  alpha: number;
  tracking_error: number;
  information_ratio: number;
  calmar_ratio: number;
  downside_deviation: number;
}

class RiskMetricsCalculator {
  private db: PerformanceDatabase;
  private readonly RISK_FREE_RATE = 0.05; // 5% annual
  private readonly BASELINE_MONTHLY_RETURN = 0.638; // 63.8% monthly baseline
  
  constructor() {
    this.db = new PerformanceDatabase();
  }

  async calculateRiskMetrics(
    startDate: Date,
    endDate: Date,
    benchmarkReturns?: number[]
  ): Promise<RiskMetrics> {
    const metrics = await this.db.getPerformanceMetrics(startDate, endDate);
    
    if (metrics.length === 0) {
      throw new Error('No performance data found for the specified period');
    }

    const portfolioValues = metrics.map(m => m.portfolio_value);
    const dailyReturns = this.calculateDailyReturns(portfolioValues);
    
    // Generate benchmark returns if not provided
    const benchmark = benchmarkReturns || this.generateBenchmarkReturns(dailyReturns.length);
    
    const riskMetrics: RiskMetrics = {
      sharpe_ratio: this.calculateSharpeRatio(dailyReturns),
      sortino_ratio: this.calculateSortinoRatio(dailyReturns),
      max_drawdown: this.calculateMaxDrawdown(portfolioValues),
      var_95: this.calculateVaR(dailyReturns, 0.95),
      var_99: this.calculateVaR(dailyReturns, 0.99),
      expected_shortfall: this.calculateExpectedShortfall(dailyReturns, 0.95),
      beta: this.calculateBeta(dailyReturns, benchmark),
      alpha: this.calculateAlpha(dailyReturns, benchmark),
      tracking_error: this.calculateTrackingError(dailyReturns, benchmark),
      information_ratio: this.calculateInformationRatio(dailyReturns, benchmark),
      calmar_ratio: this.calculateCalmarRatio(dailyReturns, portfolioValues),
      downside_deviation: this.calculateDownsideDeviation(dailyReturns)
    };

    // Store risk metrics in database
    await this.db.recordRiskMetrics({
      date: endDate,
      portfolio_beta: riskMetrics.beta,
      var_95: riskMetrics.var_95,
      var_99: riskMetrics.var_99,
      expected_shortfall: riskMetrics.expected_shortfall,
      portfolio_correlation: this.calculateCorrelation(dailyReturns, benchmark),
      concentration_risk: this.calculateConcentrationRisk(portfolioValues)
    });

    return riskMetrics;
  }

  private calculateDailyReturns(portfolioValues: number[]): number[] {
    const returns: number[] = [];
    
    for (let i = 1; i < portfolioValues.length; i++) {
      const currentValue = portfolioValues[i];
      const previousValue = portfolioValues[i - 1];
      const dailyReturn = (currentValue - previousValue) / previousValue;
      returns.push(dailyReturn);
    }
    
    return returns;
  }

  private generateBenchmarkReturns(length: number): number[] {
    const dailyBaselineReturn = Math.pow(1 + this.BASELINE_MONTHLY_RETURN, 1/30.44) - 1;
    
    // Add some volatility to make it more realistic
    const volatility = 0.15; // 15% annual volatility
    const dailyVolatility = volatility / Math.sqrt(252);
    
    return Array.from({ length }, () => {
      const noise = this.generateNormalRandom() * dailyVolatility;
      return dailyBaselineReturn + noise;
    });
  }

  private generateNormalRandom(): number {
    // Box-Muller transform for normal distribution
    const u = Math.random();
    const v = Math.random();
    return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
  }

  private calculateSharpeRatio(dailyReturns: number[]): number {
    if (dailyReturns.length === 0) return 0;
    
    const meanReturn = dailyReturns.reduce((sum, r) => sum + r, 0) / dailyReturns.length;
    const dailyRiskFreeRate = this.RISK_FREE_RATE / 252;
    const volatility = this.calculateVolatility(dailyReturns);
    
    if (volatility === 0) return 0;
    
    return (meanReturn - dailyRiskFreeRate) / volatility * Math.sqrt(252);
  }

  private calculateSortinoRatio(dailyReturns: number[]): number {
    if (dailyReturns.length === 0) return 0;
    
    const meanReturn = dailyReturns.reduce((sum, r) => sum + r, 0) / dailyReturns.length;
    const dailyRiskFreeRate = this.RISK_FREE_RATE / 252;
    const downsideDeviation = this.calculateDownsideDeviation(dailyReturns);
    
    if (downsideDeviation === 0) return 0;
    
    return (meanReturn - dailyRiskFreeRate) / downsideDeviation * Math.sqrt(252);
  }

  private calculateVolatility(returns: number[]): number {
    if (returns.length === 0) return 0;
    
    const mean = returns.reduce((sum, r) => sum + r, 0) / returns.length;
    const variance = returns.reduce((sum, r) => sum + Math.pow(r - mean, 2), 0) / returns.length;
    
    return Math.sqrt(variance);
  }

  private calculateDownsideDeviation(returns: number[]): number {
    if (returns.length === 0) return 0;
    
    const negativeReturns = returns.filter(r => r < 0);
    if (negativeReturns.length === 0) return 0;
    
    const meanNegativeReturn = negativeReturns.reduce((sum, r) => sum + r, 0) / negativeReturns.length;
    const downsideVariance = negativeReturns.reduce((sum, r) => sum + Math.pow(r - meanNegativeReturn, 2), 0) / negativeReturns.length;
    
    return Math.sqrt(downsideVariance);
  }

  private calculateMaxDrawdown(portfolioValues: number[]): number {
    let maxDrawdown = 0;
    let peak = portfolioValues[0];
    
    for (const value of portfolioValues) {
      if (value > peak) {
        peak = value;
      }
      
      const drawdown = (peak - value) / peak;
      if (drawdown > maxDrawdown) {
        maxDrawdown = drawdown;
      }
    }
    
    return maxDrawdown;
  }

  private calculateVaR(returns: number[], confidenceLevel: number): number {
    if (returns.length === 0) return 0;
    
    const sortedReturns = returns.slice().sort((a, b) => a - b);
    const index = Math.floor((1 - confidenceLevel) * sortedReturns.length);
    
    return -sortedReturns[index] || 0;
  }

  private calculateExpectedShortfall(returns: number[], confidenceLevel: number): number {
    if (returns.length === 0) return 0;
    
    const sortedReturns = returns.slice().sort((a, b) => a - b);
    const cutoffIndex = Math.floor((1 - confidenceLevel) * sortedReturns.length);
    
    if (cutoffIndex === 0) return 0;
    
    const tailReturns = sortedReturns.slice(0, cutoffIndex);
    const meanTailReturn = tailReturns.reduce((sum, r) => sum + r, 0) / tailReturns.length;
    
    return -meanTailReturn;
  }

  private calculateBeta(portfolioReturns: number[], benchmarkReturns: number[]): number {
    if (portfolioReturns.length !== benchmarkReturns.length) return 0;
    
    const portfolioMean = portfolioReturns.reduce((sum, r) => sum + r, 0) / portfolioReturns.length;
    const benchmarkMean = benchmarkReturns.reduce((sum, r) => sum + r, 0) / benchmarkReturns.length;
    
    let covariance = 0;
    let benchmarkVariance = 0;
    
    for (let i = 0; i < portfolioReturns.length; i++) {
      const portfolioDeviation = portfolioReturns[i] - portfolioMean;
      const benchmarkDeviation = benchmarkReturns[i] - benchmarkMean;
      
      covariance += portfolioDeviation * benchmarkDeviation;
      benchmarkVariance += benchmarkDeviation * benchmarkDeviation;
    }
    
    if (benchmarkVariance === 0) return 0;
    
    return covariance / benchmarkVariance;
  }

  private calculateAlpha(portfolioReturns: number[], benchmarkReturns: number[]): number {
    const portfolioMean = portfolioReturns.reduce((sum, r) => sum + r, 0) / portfolioReturns.length;
    const benchmarkMean = benchmarkReturns.reduce((sum, r) => sum + r, 0) / benchmarkReturns.length;
    const beta = this.calculateBeta(portfolioReturns, benchmarkReturns);
    const dailyRiskFreeRate = this.RISK_FREE_RATE / 252;
    
    // Alpha = Portfolio Return - (Risk-free Rate + Beta * (Benchmark Return - Risk-free Rate))
    return portfolioMean - (dailyRiskFreeRate + beta * (benchmarkMean - dailyRiskFreeRate));
  }

  private calculateTrackingError(portfolioReturns: number[], benchmarkReturns: number[]): number {
    if (portfolioReturns.length !== benchmarkReturns.length) return 0;
    
    const activeReturns = portfolioReturns.map((r, i) => r - benchmarkReturns[i]);
    return this.calculateVolatility(activeReturns) * Math.sqrt(252);
  }

  private calculateInformationRatio(portfolioReturns: number[], benchmarkReturns: number[]): number {
    if (portfolioReturns.length !== benchmarkReturns.length) return 0;
    
    const activeReturns = portfolioReturns.map((r, i) => r - benchmarkReturns[i]);
    const meanActiveReturn = activeReturns.reduce((sum, r) => sum + r, 0) / activeReturns.length;
    const trackingError = this.calculateTrackingError(portfolioReturns, benchmarkReturns);
    
    if (trackingError === 0) return 0;
    
    return (meanActiveReturn * 252) / trackingError;
  }

  private calculateCalmarRatio(dailyReturns: number[], portfolioValues: number[]): number {
    const annualReturn = dailyReturns.reduce((sum, r) => sum + r, 0) * 252;
    const maxDrawdown = this.calculateMaxDrawdown(portfolioValues);
    
    if (maxDrawdown === 0) return 0;
    
    return annualReturn / maxDrawdown;
  }

  private calculateCorrelation(portfolioReturns: number[], benchmarkReturns: number[]): number {
    if (portfolioReturns.length !== benchmarkReturns.length) return 0;
    
    const portfolioMean = portfolioReturns.reduce((sum, r) => sum + r, 0) / portfolioReturns.length;
    const benchmarkMean = benchmarkReturns.reduce((sum, r) => sum + r, 0) / benchmarkReturns.length;
    
    let covariance = 0;
    let portfolioVariance = 0;
    let benchmarkVariance = 0;
    
    for (let i = 0; i < portfolioReturns.length; i++) {
      const portfolioDeviation = portfolioReturns[i] - portfolioMean;
      const benchmarkDeviation = benchmarkReturns[i] - benchmarkMean;
      
      covariance += portfolioDeviation * benchmarkDeviation;
      portfolioVariance += portfolioDeviation * portfolioDeviation;
      benchmarkVariance += benchmarkDeviation * benchmarkDeviation;
    }
    
    const denominator = Math.sqrt(portfolioVariance * benchmarkVariance);
    if (denominator === 0) return 0;
    
    return covariance / denominator;
  }

  private calculateConcentrationRisk(portfolioValues: number[]): number {
    // Simple concentration risk metric based on portfolio value volatility
    if (portfolioValues.length < 2) return 0;
    
    const returns = this.calculateDailyReturns(portfolioValues);
    const volatility = this.calculateVolatility(returns);
    
    // Normalize concentration risk (higher volatility = higher concentration risk)
    return Math.min(volatility * 10, 1); // Cap at 1
  }

  async getRiskSummary(days: number = 30): Promise<{
    current_metrics: RiskMetrics;
    risk_grade: string;
    risk_score: number;
    alerts: string[];
  }> {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const currentMetrics = await this.calculateRiskMetrics(startDate, endDate);
    
    const riskScore = this.calculateRiskScore(currentMetrics);
    const riskGrade = this.getRiskGrade(riskScore);
    const alerts = this.generateRiskAlerts(currentMetrics);

    return {
      current_metrics: currentMetrics,
      risk_grade: riskGrade,
      risk_score: riskScore,
      alerts: alerts
    };
  }

  private calculateRiskScore(metrics: RiskMetrics): number {
    // Weighted risk score (0-100, lower is better)
    const sharpeWeight = 0.3;
    const maxDrawdownWeight = 0.3;
    const varWeight = 0.2;
    const volatilityWeight = 0.2;
    
    const sharpeScore = Math.max(0, Math.min(100, (2 - metrics.sharpe_ratio) * 50));
    const drawdownScore = metrics.max_drawdown * 100;
    const varScore = metrics.var_95 * 100;
    const volatilityScore = Math.min(100, Math.abs(metrics.alpha) * 100);
    
    return (
      sharpeScore * sharpeWeight +
      drawdownScore * maxDrawdownWeight +
      varScore * varWeight +
      volatilityScore * volatilityWeight
    );
  }

  private getRiskGrade(score: number): string {
    if (score <= 20) return 'A';
    if (score <= 40) return 'B';
    if (score <= 60) return 'C';
    if (score <= 80) return 'D';
    return 'F';
  }

  private generateRiskAlerts(metrics: RiskMetrics): string[] {
    const alerts: string[] = [];
    
    if (metrics.max_drawdown > 0.20) {
      alerts.push(`High drawdown risk: ${(metrics.max_drawdown * 100).toFixed(1)}% max drawdown`);
    }
    
    if (metrics.sharpe_ratio < 0.5) {
      alerts.push(`Low risk-adjusted returns: Sharpe ratio ${metrics.sharpe_ratio.toFixed(2)}`);
    }
    
    if (metrics.var_99 > 0.10) {
      alerts.push(`High tail risk: 99% VaR at ${(metrics.var_99 * 100).toFixed(1)}%`);
    }
    
    if (Math.abs(metrics.beta) > 2.0) {
      alerts.push(`High beta exposure: ${metrics.beta.toFixed(2)} vs baseline`);
    }
    
    return alerts;
  }
}

export default RiskMetricsCalculator;