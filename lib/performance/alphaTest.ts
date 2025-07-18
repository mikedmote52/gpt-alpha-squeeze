import PerformanceDatabase from './database';

interface AlphaTestResult {
  test_type: string;
  period_start: Date;
  period_end: Date;
  sample_size: number;
  t_statistic: number;
  p_value: number;
  confidence_level: number;
  is_significant: boolean;
  alpha_estimate: number;
  standard_error: number;
  degrees_of_freedom: number;
  critical_value: number;
  effect_size: number;
  power: number;
}

interface HypothesisTest {
  null_hypothesis: string;
  alternative_hypothesis: string;
  significance_level: number;
  result: 'reject' | 'fail_to_reject';
  interpretation: string;
}

class AlphaTestingEngine {
  private db: PerformanceDatabase;
  private readonly BASELINE_MONTHLY_RETURN = 0.638; // 63.8% monthly baseline
  private readonly SIGNIFICANCE_LEVELS = [0.01, 0.05, 0.10]; // 1%, 5%, 10%
  
  constructor() {
    this.db = new PerformanceDatabase();
  }

  async testAlphaGeneration(
    startDate: Date,
    endDate: Date,
    significanceLevel: number = 0.05
  ): Promise<AlphaTestResult & HypothesisTest> {
    const metrics = await this.db.getPerformanceMetrics(startDate, endDate);
    
    if (metrics.length < 30) {
      throw new Error('Insufficient data for statistical testing (minimum 30 observations required)');
    }

    const portfolioReturns = this.calculateReturns(metrics);
    const benchmarkReturns = this.generateBenchmarkReturns(portfolioReturns.length);
    const excessReturns = portfolioReturns.map((r, i) => r - benchmarkReturns[i]);
    
    // One-sample t-test: H0: excess return = 0, H1: excess return > 0
    const testResult = this.oneSampleTTest(excessReturns, 0, significanceLevel);
    
    // Store results in database
    await this.db.recordAlphaTest({
      test_period_start: startDate,
      test_period_end: endDate,
      test_type: 'one_sample_t_test',
      t_statistic: testResult.t_statistic,
      p_value: testResult.p_value,
      confidence_level: (1 - significanceLevel) * 100,
      is_significant: testResult.is_significant,
      alpha_estimate: testResult.alpha_estimate,
      standard_error: testResult.standard_error
    });

    const hypothesisTest: HypothesisTest = {
      null_hypothesis: 'Portfolio excess returns equal zero (no alpha generation)',
      alternative_hypothesis: 'Portfolio excess returns are significantly positive (alpha generation)',
      significance_level: significanceLevel,
      result: testResult.is_significant ? 'reject' : 'fail_to_reject',
      interpretation: this.interpretResults(testResult, significanceLevel)
    };

    return { ...testResult, ...hypothesisTest };
  }

  private calculateReturns(metrics: any[]): number[] {
    const returns: number[] = [];
    
    for (let i = 1; i < metrics.length; i++) {
      const currentValue = metrics[i].portfolio_value;
      const previousValue = metrics[i - 1].portfolio_value;
      const dailyReturn = (currentValue - previousValue) / previousValue;
      returns.push(dailyReturn);
    }
    
    return returns;
  }

  private generateBenchmarkReturns(length: number): number[] {
    const dailyBaselineReturn = Math.pow(1 + this.BASELINE_MONTHLY_RETURN, 1/30.44) - 1;
    
    // Generate consistent benchmark returns with some volatility
    const volatility = 0.15; // 15% annual volatility
    const dailyVolatility = volatility / Math.sqrt(252);
    
    return Array.from({ length }, (_, i) => {
      // Use deterministic noise for reproducible results
      const seed = i * 9301 + 49297;
      const noise = (seed % 233280) / 233280 - 0.5;
      return dailyBaselineReturn + noise * dailyVolatility;
    });
  }

  private oneSampleTTest(
    sample: number[],
    hypothesizedMean: number,
    significanceLevel: number
  ): AlphaTestResult {
    const n = sample.length;
    const sampleMean = sample.reduce((sum, x) => sum + x, 0) / n;
    const sampleVariance = sample.reduce((sum, x) => sum + Math.pow(x - sampleMean, 2), 0) / (n - 1);
    const standardError = Math.sqrt(sampleVariance / n);
    
    const tStatistic = (sampleMean - hypothesizedMean) / standardError;
    const degreesOfFreedom = n - 1;
    
    // Calculate p-value (one-tailed test)
    const pValue = this.calculatePValue(tStatistic, degreesOfFreedom, 'greater');
    
    // Critical value for one-tailed test
    const criticalValue = this.getCriticalValue(degreesOfFreedom, significanceLevel, 'greater');
    
    const isSignificant = pValue < significanceLevel;
    const effectSize = this.calculateCohenD(sample, hypothesizedMean);
    const power = this.calculatePower(effectSize, n, significanceLevel);
    
    return {
      test_type: 'one_sample_t_test',
      period_start: new Date(),
      period_end: new Date(),
      sample_size: n,
      t_statistic: tStatistic,
      p_value: pValue,
      confidence_level: (1 - significanceLevel) * 100,
      is_significant: isSignificant,
      alpha_estimate: sampleMean,
      standard_error: standardError,
      degrees_of_freedom: degreesOfFreedom,
      critical_value: criticalValue,
      effect_size: effectSize,
      power: power
    };
  }

  private calculatePValue(tStatistic: number, df: number, alternative: 'greater' | 'less' | 'two-sided'): number {
    // Approximate p-value calculation using Student's t-distribution
    // This is a simplified implementation - in production, use a proper statistical library
    
    const absTStat = Math.abs(tStatistic);
    
    // Approximate p-value using normal distribution for large df
    if (df > 30) {
      const zScore = tStatistic;
      const pValue = 1 - this.normalCDF(zScore);
      
      switch (alternative) {
        case 'greater':
          return pValue;
        case 'less':
          return 1 - pValue;
        case 'two-sided':
          return 2 * Math.min(pValue, 1 - pValue);
        default:
          return pValue;
      }
    }
    
    // For smaller df, use approximation
    const probability = this.tDistributionCDF(tStatistic, df);
    
    switch (alternative) {
      case 'greater':
        return 1 - probability;
      case 'less':
        return probability;
      case 'two-sided':
        return 2 * Math.min(probability, 1 - probability);
      default:
        return 1 - probability;
    }
  }

  private normalCDF(z: number): number {
    // Approximate normal CDF using error function approximation
    return 0.5 * (1 + this.erf(z / Math.sqrt(2)));
  }

  private erf(x: number): number {
    // Approximate error function
    const a1 = 0.254829592;
    const a2 = -0.284496736;
    const a3 = 1.421413741;
    const a4 = -1.453152027;
    const a5 = 1.061405429;
    const p = 0.3275911;
    
    const sign = x >= 0 ? 1 : -1;
    x = Math.abs(x);
    
    const t = 1 / (1 + p * x);
    const y = 1 - (((((a5 * t + a4) * t) + a3) * t + a2) * t + a1) * t * Math.exp(-x * x);
    
    return sign * y;
  }

  private tDistributionCDF(t: number, df: number): number {
    // Simplified t-distribution CDF approximation
    // In production, use a proper statistical library
    
    const x = t / Math.sqrt(df);
    const beta = this.betaFunction(0.5, df / 2);
    
    if (t >= 0) {
      return 0.5 + (x * Math.sqrt(df)) / (2 * beta) * Math.pow(1 + t * t / df, -(df + 1) / 2);
    } else {
      return 0.5 - (Math.abs(x) * Math.sqrt(df)) / (2 * beta) * Math.pow(1 + t * t / df, -(df + 1) / 2);
    }
  }

  private betaFunction(a: number, b: number): number {
    // Approximate beta function using gamma function properties
    return Math.exp(this.logGamma(a) + this.logGamma(b) - this.logGamma(a + b));
  }

  private logGamma(z: number): number {
    // Stirling's approximation for log gamma function
    return (z - 0.5) * Math.log(z) - z + 0.5 * Math.log(2 * Math.PI) + 1 / (12 * z);
  }

  private getCriticalValue(df: number, alpha: number, alternative: 'greater' | 'less' | 'two-sided'): number {
    // Critical values for common significance levels (approximation)
    const criticalValues: { [key: string]: { [key: number]: number } } = {
      'greater': {
        0.01: df > 30 ? 2.33 : 2.75,
        0.05: df > 30 ? 1.645 : 1.96,
        0.10: df > 30 ? 1.28 : 1.645
      },
      'two-sided': {
        0.01: df > 30 ? 2.58 : 2.96,
        0.05: df > 30 ? 1.96 : 2.26,
        0.10: df > 30 ? 1.645 : 1.86
      }
    };
    
    return criticalValues[alternative][alpha] || 1.96;
  }

  private calculateCohenD(sample: number[], hypothesizedMean: number): number {
    const sampleMean = sample.reduce((sum, x) => sum + x, 0) / sample.length;
    const sampleStd = Math.sqrt(sample.reduce((sum, x) => sum + Math.pow(x - sampleMean, 2), 0) / (sample.length - 1));
    
    return (sampleMean - hypothesizedMean) / sampleStd;
  }

  private calculatePower(effectSize: number, sampleSize: number, alpha: number): number {
    // Approximate power calculation for one-sample t-test
    const delta = effectSize * Math.sqrt(sampleSize);
    const criticalValue = this.getCriticalValue(sampleSize - 1, alpha, 'greater');
    
    // Power = P(reject H0 | H1 is true)
    const power = 1 - this.normalCDF(criticalValue - delta);
    
    return Math.max(0, Math.min(1, power));
  }

  private interpretResults(result: AlphaTestResult, significanceLevel: number): string {
    if (result.is_significant) {
      return `Statistical evidence of alpha generation found (p = ${result.p_value.toFixed(4)} < ${significanceLevel}). ` +
             `Estimated daily alpha: ${(result.alpha_estimate * 100).toFixed(4)}% with effect size ${result.effect_size.toFixed(2)}. ` +
             `Test power: ${(result.power * 100).toFixed(1)}%.`;
    } else {
      return `No statistically significant alpha generation detected (p = ${result.p_value.toFixed(4)} >= ${significanceLevel}). ` +
             `Estimated daily alpha: ${(result.alpha_estimate * 100).toFixed(4)}% with effect size ${result.effect_size.toFixed(2)}. ` +
             `Test power: ${(result.power * 100).toFixed(1)}%. Consider longer observation period.`;
    }
  }

  async runComprehensiveAlphaTest(days: number = 60): Promise<{
    main_test: AlphaTestResult & HypothesisTest;
    robustness_tests: Array<AlphaTestResult & HypothesisTest>;
    meta_analysis: {
      consistent_alpha: boolean;
      average_p_value: number;
      significant_tests: number;
      total_tests: number;
      recommendation: string;
    };
  }> {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // Main test
    const mainTest = await this.testAlphaGeneration(startDate, endDate, 0.05);

    // Robustness tests with different significance levels and time periods
    const robustnessTests: Array<AlphaTestResult & HypothesisTest> = [];
    
    // Different significance levels
    for (const alpha of [0.01, 0.10]) {
      const test = await this.testAlphaGeneration(startDate, endDate, alpha);
      robustnessTests.push(test);
    }
    
    // Different time periods
    for (const periodDays of [30, 90]) {
      const periodStart = new Date();
      periodStart.setDate(periodStart.getDate() - periodDays);
      const test = await this.testAlphaGeneration(periodStart, endDate, 0.05);
      robustnessTests.push(test);
    }

    // Meta-analysis
    const allTests = [mainTest, ...robustnessTests];
    const significantTests = allTests.filter(t => t.is_significant).length;
    const averagePValue = allTests.reduce((sum, t) => sum + t.p_value, 0) / allTests.length;
    const consistentAlpha = significantTests / allTests.length > 0.5;

    const metaAnalysis = {
      consistent_alpha: consistentAlpha,
      average_p_value: averagePValue,
      significant_tests: significantTests,
      total_tests: allTests.length,
      recommendation: this.generateRecommendation(consistentAlpha, averagePValue, significantTests, allTests.length)
    };

    return {
      main_test: mainTest,
      robustness_tests: robustnessTests,
      meta_analysis: metaAnalysis
    };
  }

  private generateRecommendation(
    consistentAlpha: boolean,
    averagePValue: number,
    significantTests: number,
    totalTests: number
  ): string {
    if (consistentAlpha && averagePValue < 0.05) {
      return 'STRONG EVIDENCE: The system demonstrates statistically significant alpha generation ' +
             'across multiple time periods and significance levels. Continue current strategy.';
    } else if (significantTests > 0 && averagePValue < 0.10) {
      return 'MODERATE EVIDENCE: Some statistical evidence of alpha generation. ' +
             'Consider extending observation period for more robust conclusions.';
    } else {
      return 'INSUFFICIENT EVIDENCE: No consistent statistical evidence of alpha generation. ' +
             'Review strategy parameters or extend observation period before concluding.';
    }
  }
}

export default AlphaTestingEngine;