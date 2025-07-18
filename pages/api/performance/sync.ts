import type { NextApiRequest, NextApiResponse } from 'next';
import alpaca from '../alpaca/client';
import PerformanceDatabase from '../../../lib/performance/database';
import TradeLogger from '../../../lib/performance/tradeLogger';
import ReturnCalculator from '../../../lib/performance/returnCalculator';
import RiskMetricsCalculator from '../../../lib/performance/riskMetrics';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Only POST allowed' });
  }

  try {
    const db = new PerformanceDatabase();
    const returnCalculator = new ReturnCalculator();
    const riskCalculator = new RiskMetricsCalculator();
    const tradeLogger = new TradeLogger();

    // Get current account info
    const account = await alpaca.getAccount();
    const currentValue = parseFloat(account.portfolio_value);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Record daily performance
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    const yesterdayMetrics = await db.getPerformanceMetrics(yesterday, yesterday);
    let dailyReturn = 0;
    
    if (yesterdayMetrics.length > 0) {
      const previousValue = yesterdayMetrics[0].portfolio_value;
      dailyReturn = (currentValue - previousValue) / previousValue;
    }

    // Calculate cumulative return (from first recorded day)
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 365); // Look back 1 year max
    const allMetrics = await db.getPerformanceMetrics(startDate, today);
    
    let cumulativeReturn = 0;
    if (allMetrics.length > 0) {
      const initialValue = allMetrics[allMetrics.length - 1].portfolio_value; // Oldest record
      cumulativeReturn = (currentValue - initialValue) / initialValue;
    }

    // Calculate benchmark return for the same period
    const monthlyBaselineReturn = 0.638; // 63.8% monthly
    const daysElapsed = allMetrics.length;
    const benchmarkReturn = monthlyBaselineReturn * (daysElapsed / 30.44);
    const excessReturn = cumulativeReturn - benchmarkReturn;

    // Calculate basic risk metrics
    const last30Days = new Date();
    last30Days.setDate(last30Days.getDate() - 30);
    const recent30DayMetrics = await db.getPerformanceMetrics(last30Days, today);
    
    let sharpeRatio = 0;
    let maxDrawdown = 0;
    let volatility = 0;
    
    if (recent30DayMetrics.length > 1) {
      const values = recent30DayMetrics.map(m => m.portfolio_value);
      const returns = [];
      
      for (let i = 1; i < values.length; i++) {
        returns.push((values[i] - values[i-1]) / values[i-1]);
      }
      
      // Calculate volatility
      const meanReturn = returns.reduce((sum, r) => sum + r, 0) / returns.length;
      const variance = returns.reduce((sum, r) => sum + Math.pow(r - meanReturn, 2), 0) / returns.length;
      volatility = Math.sqrt(variance * 252); // Annualized
      
      // Calculate Sharpe ratio
      const riskFreeRate = 0.05; // 5% annual
      const dailyRiskFreeRate = riskFreeRate / 252;
      if (volatility > 0) {
        sharpeRatio = (meanReturn - dailyRiskFreeRate) / (volatility / Math.sqrt(252));
      }
      
      // Calculate max drawdown
      let peak = values[0];
      for (const value of values) {
        if (value > peak) peak = value;
        const drawdown = (peak - value) / peak;
        if (drawdown > maxDrawdown) maxDrawdown = drawdown;
      }
    }

    // Record performance metrics
    await db.recordDailyPerformance({
      date: today,
      portfolio_value: currentValue,
      daily_return: dailyReturn,
      cumulative_return: cumulativeReturn,
      benchmark_return: benchmarkReturn,
      excess_return: excessReturn,
      sharpe_ratio: sharpeRatio,
      max_drawdown: maxDrawdown,
      volatility: volatility
    });

    // Sync recent trades (last 24 hours)
    const oneDayAgo = new Date();
    oneDayAgo.setDate(oneDayAgo.getDate() - 1);
    
    const orders = await alpaca.getOrders({
      status: 'filled',
      after: oneDayAgo.toISOString(),
      direction: 'desc'
    });

    let newTradesLogged = 0;
    for (const order of orders) {
      try {
        await tradeLogger.logOrderExecution(
          {
            strategy_signal: 'system_sync',
            strategy_reason: 'Historical sync',
            confidence_score: null
          },
          order
        );
        newTradesLogged++;
      } catch (error) {
        // Order might already be logged, skip
        console.log(`Order ${order.id} already logged or error: ${error}`);
      }
    }

    // Update risk metrics
    if (recent30DayMetrics.length > 10) {
      try {
        await riskCalculator.calculateRiskMetrics(last30Days, today);
      } catch (error) {
        console.warn('Risk metrics calculation failed:', error);
      }
    }

    // Check for alerts
    const alerts = [];
    
    // Performance alerts
    if (dailyReturn < -0.05) {
      await db.createAlert({
        alert_type: 'daily_loss',
        severity: 'high',
        message: `Large daily loss: ${(dailyReturn * 100).toFixed(2)}%`,
        metric_value: dailyReturn,
        threshold_value: -0.05
      });
      alerts.push('Large daily loss detected');
    }
    
    if (maxDrawdown > 0.20) {
      await db.createAlert({
        alert_type: 'max_drawdown',
        severity: 'critical',
        message: `Maximum drawdown exceeded: ${(maxDrawdown * 100).toFixed(2)}%`,
        metric_value: maxDrawdown,
        threshold_value: 0.20
      });
      alerts.push('Maximum drawdown threshold breached');
    }
    
    if (excessReturn < -0.10) {
      await db.createAlert({
        alert_type: 'underperformance',
        severity: 'medium',
        message: `Underperforming baseline by ${(Math.abs(excessReturn) * 100).toFixed(2)}%`,
        metric_value: excessReturn,
        threshold_value: -0.10
      });
      alerts.push('Underperforming baseline significantly');
    }

    res.status(200).json({
      success: true,
      portfolio_value: currentValue,
      daily_return: dailyReturn,
      cumulative_return: cumulativeReturn,
      excess_return: excessReturn,
      sharpe_ratio: sharpeRatio,
      max_drawdown: maxDrawdown,
      new_trades_logged: newTradesLogged,
      alerts: alerts,
      timestamp: today.toISOString()
    });

  } catch (error) {
    console.error('Performance sync error:', error);
    res.status(500).json({ error: 'Failed to sync performance data' });
  }
}