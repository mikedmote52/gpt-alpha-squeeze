import PerformanceDatabase from './database';

interface AlertRule {
  id: string;
  name: string;
  metric: string;
  condition: 'greater_than' | 'less_than' | 'equals' | 'not_equals';
  threshold: number;
  severity: 'low' | 'medium' | 'high' | 'critical';
  enabled: boolean;
  consecutive_periods?: number;
  lookback_periods?: number;
}

interface AlertContext {
  current_value: number;
  previous_values: number[];
  portfolio_value: number;
  timestamp: Date;
  metadata?: { [key: string]: any };
}

class AlertSystem {
  private db: PerformanceDatabase;
  private rules: AlertRule[];
  
  constructor() {
    this.db = new PerformanceDatabase();
    this.rules = this.initializeDefaultRules();
  }

  private initializeDefaultRules(): AlertRule[] {
    return [
      {
        id: 'daily_loss_5pct',
        name: 'Daily Loss > 5%',
        metric: 'daily_return',
        condition: 'less_than',
        threshold: -0.05,
        severity: 'high',
        enabled: true
      },
      {
        id: 'daily_loss_10pct',
        name: 'Daily Loss > 10%',
        metric: 'daily_return',
        condition: 'less_than',
        threshold: -0.10,
        severity: 'critical',
        enabled: true
      },
      {
        id: 'max_drawdown_20pct',
        name: 'Max Drawdown > 20%',
        metric: 'max_drawdown',
        condition: 'greater_than',
        threshold: 0.20,
        severity: 'critical',
        enabled: true
      },
      {
        id: 'max_drawdown_15pct',
        name: 'Max Drawdown > 15%',
        metric: 'max_drawdown',
        condition: 'greater_than',
        threshold: 0.15,
        severity: 'high',
        enabled: true
      },
      {
        id: 'sharpe_ratio_low',
        name: 'Sharpe Ratio < 0.5',
        metric: 'sharpe_ratio',
        condition: 'less_than',
        threshold: 0.5,
        severity: 'medium',
        enabled: true,
        consecutive_periods: 5
      },
      {
        id: 'var_95_high',
        name: 'VaR 95% > 8%',
        metric: 'var_95',
        condition: 'greater_than',
        threshold: 0.08,
        severity: 'high',
        enabled: true
      },
      {
        id: 'excess_return_negative',
        name: 'Negative Excess Return',
        metric: 'excess_return',
        condition: 'less_than',
        threshold: -0.05,
        severity: 'medium',
        enabled: true,
        consecutive_periods: 3
      },
      {
        id: 'volatility_high',
        name: 'Volatility > 40%',
        metric: 'volatility',
        condition: 'greater_than',
        threshold: 0.40,
        severity: 'medium',
        enabled: true
      },
      {
        id: 'portfolio_value_drop',
        name: 'Portfolio Value Drop > 15%',
        metric: 'portfolio_value_change',
        condition: 'less_than',
        threshold: -0.15,
        severity: 'critical',
        enabled: true,
        lookback_periods: 7
      },
      {
        id: 'win_rate_low',
        name: 'Win Rate < 40%',
        metric: 'win_rate',
        condition: 'less_than',
        threshold: 0.40,
        severity: 'medium',
        enabled: true,
        consecutive_periods: 7
      }
    ];
  }

  async checkAlerts(context: AlertContext): Promise<void> {
    const enabledRules = this.rules.filter(rule => rule.enabled);
    
    for (const rule of enabledRules) {
      await this.evaluateRule(rule, context);
    }
  }

  private async evaluateRule(rule: AlertRule, context: AlertContext): Promise<void> {
    const currentValue = this.extractMetricValue(rule.metric, context);
    
    if (currentValue === null || currentValue === undefined) {
      console.warn(`Metric ${rule.metric} not available in context`);
      return;
    }

    // Check if condition is met
    const conditionMet = this.evaluateCondition(rule.condition, currentValue, rule.threshold);
    
    if (!conditionMet) {
      return;
    }

    // Check consecutive periods requirement
    if (rule.consecutive_periods) {
      const consecutiveMet = await this.checkConsecutivePeriods(rule, context);
      if (!consecutiveMet) {
        return;
      }
    }

    // Check lookback periods requirement
    if (rule.lookback_periods) {
      const lookbackMet = this.checkLookbackPeriods(rule, context);
      if (!lookbackMet) {
        return;
      }
    }

    // Create alert
    await this.createAlert(rule, currentValue, context);
  }

  private extractMetricValue(metric: string, context: AlertContext): number | null {
    switch (metric) {
      case 'daily_return':
        return context.metadata?.daily_return || null;
      case 'max_drawdown':
        return context.metadata?.max_drawdown || null;
      case 'sharpe_ratio':
        return context.metadata?.sharpe_ratio || null;
      case 'var_95':
        return context.metadata?.var_95 || null;
      case 'excess_return':
        return context.metadata?.excess_return || null;
      case 'volatility':
        return context.metadata?.volatility || null;
      case 'portfolio_value_change':
        if (context.previous_values.length === 0) return null;
        const previousValue = context.previous_values[0];
        return (context.portfolio_value - previousValue) / previousValue;
      case 'win_rate':
        return context.metadata?.win_rate || null;
      default:
        return null;
    }
  }

  private evaluateCondition(condition: string, value: number, threshold: number): boolean {
    switch (condition) {
      case 'greater_than':
        return value > threshold;
      case 'less_than':
        return value < threshold;
      case 'equals':
        return Math.abs(value - threshold) < 0.0001;
      case 'not_equals':
        return Math.abs(value - threshold) >= 0.0001;
      default:
        return false;
    }
  }

  private async checkConsecutivePeriods(rule: AlertRule, context: AlertContext): Promise<boolean> {
    if (!rule.consecutive_periods || rule.consecutive_periods <= 1) {
      return true;
    }

    // Get recent performance data
    const endDate = context.timestamp;
    const startDate = new Date(endDate);
    startDate.setDate(startDate.getDate() - rule.consecutive_periods);
    
    const metrics = await this.db.getPerformanceMetrics(startDate, endDate);
    
    if (metrics.length < rule.consecutive_periods) {
      return false;
    }

    // Check if condition was met for consecutive periods
    let consecutiveCount = 0;
    for (let i = 0; i < Math.min(rule.consecutive_periods, metrics.length); i++) {
      const metricValue = this.extractMetricFromDbRow(rule.metric, metrics[i]);
      if (metricValue !== null && this.evaluateCondition(rule.condition, metricValue, rule.threshold)) {
        consecutiveCount++;
      } else {
        break;
      }
    }

    return consecutiveCount >= rule.consecutive_periods;
  }

  private checkLookbackPeriods(rule: AlertRule, context: AlertContext): boolean {
    if (!rule.lookback_periods || context.previous_values.length < rule.lookback_periods) {
      return false;
    }

    // For lookback periods, we check if the condition is met across the lookback window
    const lookbackValues = context.previous_values.slice(0, rule.lookback_periods);
    
    if (rule.metric === 'portfolio_value_change') {
      const oldestValue = lookbackValues[lookbackValues.length - 1];
      const change = (context.portfolio_value - oldestValue) / oldestValue;
      return this.evaluateCondition(rule.condition, change, rule.threshold);
    }

    return true;
  }

  private extractMetricFromDbRow(metric: string, row: any): number | null {
    switch (metric) {
      case 'daily_return':
        return row.daily_return;
      case 'max_drawdown':
        return row.max_drawdown;
      case 'sharpe_ratio':
        return row.sharpe_ratio;
      case 'excess_return':
        return row.excess_return;
      case 'volatility':
        return row.volatility;
      default:
        return null;
    }
  }

  private async createAlert(rule: AlertRule, currentValue: number, context: AlertContext): Promise<void> {
    const message = this.generateAlertMessage(rule, currentValue, context);
    
    await this.db.createAlert({
      alert_type: rule.id,
      severity: rule.severity,
      message: message,
      metric_value: currentValue,
      threshold_value: rule.threshold
    });

    console.log(`ALERT [${rule.severity.toUpperCase()}]: ${message}`);
  }

  private generateAlertMessage(rule: AlertRule, currentValue: number, context: AlertContext): string {
    const percentage = (value: number) => `${(value * 100).toFixed(2)}%`;
    const currency = (value: number) => `$${value.toLocaleString()}`;
    
    let formattedValue: string;
    let formattedThreshold: string;
    
    // Format based on metric type
    if (rule.metric.includes('return') || rule.metric.includes('drawdown') || rule.metric.includes('var') || rule.metric.includes('volatility')) {
      formattedValue = percentage(currentValue);
      formattedThreshold = percentage(rule.threshold);
    } else if (rule.metric.includes('portfolio_value')) {
      formattedValue = currency(currentValue);
      formattedThreshold = currency(rule.threshold);
    } else {
      formattedValue = currentValue.toFixed(4);
      formattedThreshold = rule.threshold.toFixed(4);
    }

    const direction = rule.condition === 'greater_than' ? 'above' : 'below';
    
    return `${rule.name}: Current value ${formattedValue} is ${direction} threshold ${formattedThreshold}. Portfolio value: ${currency(context.portfolio_value)}`;
  }

  async evaluatePerformanceAlerts(
    portfolioValue: number,
    performanceMetrics: any,
    previousValues: number[] = []
  ): Promise<void> {
    const context: AlertContext = {
      current_value: portfolioValue,
      previous_values: previousValues,
      portfolio_value: portfolioValue,
      timestamp: new Date(),
      metadata: performanceMetrics
    };

    await this.checkAlerts(context);
  }

  async getActiveAlerts(): Promise<any[]> {
    return await this.db.getUnresolvedAlerts();
  }

  async resolveAlert(alertId: number): Promise<void> {
    // This would require adding an update method to the database
    console.log(`Resolving alert ${alertId}`);
  }

  addCustomRule(rule: AlertRule): void {
    this.rules.push(rule);
  }

  removeRule(ruleId: string): void {
    this.rules = this.rules.filter(rule => rule.id !== ruleId);
  }

  enableRule(ruleId: string): void {
    const rule = this.rules.find(r => r.id === ruleId);
    if (rule) {
      rule.enabled = true;
    }
  }

  disableRule(ruleId: string): void {
    const rule = this.rules.find(r => r.id === ruleId);
    if (rule) {
      rule.enabled = false;
    }
  }

  getRules(): AlertRule[] {
    return [...this.rules];
  }

  async getAlertsSummary(): Promise<{
    total_alerts: number;
    critical_alerts: number;
    high_alerts: number;
    medium_alerts: number;
    low_alerts: number;
    recent_alerts: any[];
  }> {
    const alerts = await this.getActiveAlerts();
    
    return {
      total_alerts: alerts.length,
      critical_alerts: alerts.filter(a => a.severity === 'critical').length,
      high_alerts: alerts.filter(a => a.severity === 'high').length,
      medium_alerts: alerts.filter(a => a.severity === 'medium').length,
      low_alerts: alerts.filter(a => a.severity === 'low').length,
      recent_alerts: alerts.slice(0, 10)
    };
  }
}

export default AlertSystem;