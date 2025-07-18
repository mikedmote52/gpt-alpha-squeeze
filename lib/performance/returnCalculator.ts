import PerformanceDatabase from './database';

interface ReturnPeriod {
  start_date: Date;
  end_date: Date;
  period_type: 'daily' | 'weekly' | 'monthly';
  portfolio_return: number;
  benchmark_return: number;
  excess_return: number;
  annualized_return: number;
  volatility: number;
  trading_days: number;
}

class ReturnCalculator {
  private db: PerformanceDatabase;
  private readonly BASELINE_MONTHLY_RETURN = 0.638; // 63.8% monthly baseline
  private readonly RISK_FREE_RATE = 0.05; // 5% annual risk-free rate
  
  constructor() {
    this.db = new PerformanceDatabase();
  }

  async calculateDailyReturns(portfolioValues: { date: Date; value: number }[]): Promise<number[]> {
    const returns: number[] = [];
    
    for (let i = 1; i < portfolioValues.length; i++) {
      const currentValue = portfolioValues[i].value;
      const previousValue = portfolioValues[i - 1].value;
      const dailyReturn = (currentValue - previousValue) / previousValue;
      returns.push(dailyReturn);
    }
    
    return returns;
  }

  async calculatePeriodReturns(
    startDate: Date, 
    endDate: Date, 
    periodType: 'daily' | 'weekly' | 'monthly'
  ): Promise<ReturnPeriod> {
    const metrics = await this.db.getPerformanceMetrics(startDate, endDate);
    
    if (metrics.length === 0) {
      throw new Error('No performance data found for the specified period');
    }

    const portfolioValues = metrics.map(m => ({
      date: new Date(m.date),
      value: m.portfolio_value
    })).sort((a, b) => a.date.getTime() - b.date.getTime());

    const dailyReturns = await this.calculateDailyReturns(portfolioValues);
    const totalReturn = this.calculateTotalReturn(portfolioValues);
    const annualizedReturn = this.annualizeReturn(totalReturn, startDate, endDate);
    const volatility = this.calculateVolatility(dailyReturns);
    
    const benchmarkReturn = this.calculateBenchmarkReturn(periodType, startDate, endDate);
    const excessReturn = totalReturn - benchmarkReturn;
    
    const tradingDays = this.calculateTradingDays(startDate, endDate);

    return {
      start_date: startDate,
      end_date: endDate,
      period_type: periodType,
      portfolio_return: totalReturn,
      benchmark_return: benchmarkReturn,
      excess_return: excessReturn,
      annualized_return: annualizedReturn,
      volatility: volatility,
      trading_days: tradingDays
    };
  }

  private calculateTotalReturn(portfolioValues: { date: Date; value: number }[]): number {
    if (portfolioValues.length < 2) return 0;
    
    const initialValue = portfolioValues[0].value;
    const finalValue = portfolioValues[portfolioValues.length - 1].value;
    
    return (finalValue - initialValue) / initialValue;
  }

  private annualizeReturn(totalReturn: number, startDate: Date, endDate: Date): number {
    const daysDiff = (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24);
    const yearsElapsed = daysDiff / 365.25;
    
    if (yearsElapsed <= 0) return 0;
    
    return Math.pow(1 + totalReturn, 1 / yearsElapsed) - 1;
  }

  private calculateVolatility(dailyReturns: number[]): number {
    if (dailyReturns.length === 0) return 0;
    
    const mean = dailyReturns.reduce((sum, r) => sum + r, 0) / dailyReturns.length;
    const variance = dailyReturns.reduce((sum, r) => sum + Math.pow(r - mean, 2), 0) / dailyReturns.length;
    
    // Annualize volatility (assuming 252 trading days)
    return Math.sqrt(variance * 252);
  }

  private calculateBenchmarkReturn(
    periodType: 'daily' | 'weekly' | 'monthly',
    startDate: Date,
    endDate: Date
  ): number {
    const daysDiff = (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24);
    const monthsElapsed = daysDiff / 30.44; // Average days per month
    
    switch (periodType) {
      case 'daily':
        const dailyBaseline = Math.pow(1 + this.BASELINE_MONTHLY_RETURN, 1/30.44) - 1;
        return dailyBaseline * daysDiff;
      
      case 'weekly':
        const weeklyBaseline = Math.pow(1 + this.BASELINE_MONTHLY_RETURN, 7/30.44) - 1;
        return weeklyBaseline * (daysDiff / 7);
      
      case 'monthly':
        return this.BASELINE_MONTHLY_RETURN * monthsElapsed;
      
      default:
        return 0;
    }
  }

  private calculateTradingDays(startDate: Date, endDate: Date): number {
    let tradingDays = 0;
    const current = new Date(startDate);
    
    while (current <= endDate) {
      const dayOfWeek = current.getDay();
      if (dayOfWeek !== 0 && dayOfWeek !== 6) { // Not Sunday (0) or Saturday (6)
        tradingDays++;
      }
      current.setDate(current.getDate() + 1);
    }
    
    return tradingDays;
  }

  async calculateRollingReturns(
    windowDays: number,
    periodType: 'daily' | 'weekly' | 'monthly'
  ): Promise<ReturnPeriod[]> {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - windowDays * 3); // Get extra data for rolling window
    
    const metrics = await this.db.getPerformanceMetrics(startDate, endDate);
    
    if (metrics.length < windowDays) {
      throw new Error(`Insufficient data for ${windowDays}-day rolling window`);
    }

    const rollingReturns: ReturnPeriod[] = [];
    
    for (let i = windowDays; i < metrics.length; i++) {
      const windowStart = new Date(metrics[i - windowDays].date);
      const windowEnd = new Date(metrics[i].date);
      
      try {
        const periodReturn = await this.calculatePeriodReturns(windowStart, windowEnd, periodType);
        rollingReturns.push(periodReturn);
      } catch (error) {
        console.warn(`Error calculating rolling return for ${windowStart.toISOString()}: ${error}`);
      }
    }
    
    return rollingReturns;
  }

  async getPerformanceSummary(days: number = 30): Promise<{
    daily: ReturnPeriod;
    weekly: ReturnPeriod;
    monthly: ReturnPeriod;
    summary: {
      total_return: number;
      annualized_return: number;
      volatility: number;
      sharpe_ratio: number;
      max_drawdown: number;
      win_rate: number;
      best_day: number;
      worst_day: number;
    };
  }> {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const [daily, weekly, monthly] = await Promise.all([
      this.calculatePeriodReturns(startDate, endDate, 'daily'),
      this.calculatePeriodReturns(startDate, endDate, 'weekly'),
      this.calculatePeriodReturns(startDate, endDate, 'monthly')
    ]);

    const metrics = await this.db.getPerformanceMetrics(startDate, endDate);
    const portfolioValues = metrics.map(m => m.portfolio_value);
    const dailyReturns = await this.calculateDailyReturns(
      metrics.map(m => ({ date: new Date(m.date), value: m.portfolio_value }))
    );

    const maxDrawdown = this.calculateMaxDrawdown(portfolioValues);
    const sharpeRatio = this.calculateSharpeRatio(dailyReturns);
    const winRate = dailyReturns.filter(r => r > 0).length / dailyReturns.length;

    return {
      daily,
      weekly,
      monthly,
      summary: {
        total_return: daily.portfolio_return,
        annualized_return: daily.annualized_return,
        volatility: daily.volatility,
        sharpe_ratio: sharpeRatio,
        max_drawdown: maxDrawdown,
        win_rate: winRate,
        best_day: Math.max(...dailyReturns),
        worst_day: Math.min(...dailyReturns)
      }
    };
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

  private calculateSharpeRatio(dailyReturns: number[]): number {
    if (dailyReturns.length === 0) return 0;
    
    const meanDailyReturn = dailyReturns.reduce((sum, r) => sum + r, 0) / dailyReturns.length;
    const dailyRiskFreeRate = this.RISK_FREE_RATE / 252; // Convert annual to daily
    const volatility = this.calculateVolatility(dailyReturns);
    
    if (volatility === 0) return 0;
    
    const excessReturn = meanDailyReturn - dailyRiskFreeRate;
    return (excessReturn * Math.sqrt(252)) / volatility; // Annualized Sharpe ratio
  }
}

export default ReturnCalculator;