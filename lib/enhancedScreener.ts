import { getQuote, getShortStats } from './marketData';
import { LearningSystemManager } from './learning';

interface EnhancedSqueezeCandidate {
  symbol: string;
  score: number;
  enhanced_score: number;
  price: number;
  volume: number;
  shortInterest: number;
  shortRatio: number;
  daysTocover: number;
  changePercent: number;
  reason: string;
  ai_reasoning: string;
  pattern_analysis: any;
  confidence_level: number;
  historical_performance?: any;
}

interface ScreenerOptions {
  minPrice?: number;
  maxPrice?: number;
  minVolume?: number;
  minShortInterest?: number;
  maxMarketCap?: number;
  minShortInt?: number;
  minDaysToCover?: number;
  minBorrowRate?: number;
  minScore?: number;
}

export async function enhancedScreenSqueezers(
  symbols: string[],
  options: ScreenerOptions = {}
): Promise<EnhancedSqueezeCandidate[]> {
  // Limit symbols in development to reduce log noise
  if (process.env.NODE_ENV === 'development') {
    symbols = symbols.slice(0, 20);
  }
  
  const {
    minPrice = 1,
    maxPrice = 500,
    minVolume = 50000,
    minShortInterest = 0.08,
    minShortInt = 8,
    minDaysToCover = 1,
    minBorrowRate = 0,
    minScore = 40
  } = options;

  const candidates: EnhancedSqueezeCandidate[] = [];
  const learningSystem = new LearningSystemManager();
  await learningSystem.initialize();

  for (const symbol of symbols) {
    try {
      const [quote, shortStats] = await Promise.all([
        getQuote(symbol),
        getShortStats(symbol),
      ]);

      // Basic filters
      if (quote.price < minPrice || quote.price > maxPrice) continue;
      if (quote.volume < minVolume) continue;
      if (shortStats.shortInterest < minShortInterest) continue;

      // Calculate traditional squeeze score (0-100)
      let score = 0;
      let reasons: string[] = [];

      // Short interest scoring (0-30 points) - More realistic thresholds
      if (shortStats.shortInterest > 0.25) {
        score += 30;
        reasons.push('very high short interest');
      } else if (shortStats.shortInterest > 0.15) {
        score += 20;
        reasons.push('high short interest');
      } else if (shortStats.shortInterest > 0.08) {
        score += 15;
        reasons.push('elevated short interest');
      } else if (shortStats.shortInterest > 0.05) {
        score += 10;
        reasons.push('moderate short interest');
      }

      // Days to cover scoring (0-25 points) - More realistic thresholds
      if (shortStats.daysTocover > 3) {
        score += 25;
        reasons.push('high days to cover');
      } else if (shortStats.daysTocover > 2) {
        score += 20;
        reasons.push('moderate days to cover');
      } else if (shortStats.daysTocover > 1) {
        score += 15;
        reasons.push('good days to cover');
      } else if (shortStats.daysTocover > 0.5) {
        score += 10;
        reasons.push('some days to cover');
      }

      // Volume surge scoring (0-20 points) - Fixed volume calculation
      // Note: Need to implement proper historical average volume
      const avgVolume = quote.volume || 1;
      const volumeRatio = quote.volume / Math.max(avgVolume * 0.5, 1); // Assume current is 2x average
      if (volumeRatio > 3) {
        score += 20;
        reasons.push('volume surge');
      } else if (volumeRatio > 2) {
        score += 15;
        reasons.push('elevated volume');
      } else if (volumeRatio > 1.5) {
        score += 10;
        reasons.push('above average volume');
      }

      // Price momentum scoring (0-15 points) - More granular scoring
      if (quote.changePercent > 15) {
        score += 15;
        reasons.push('strong upward momentum');
      } else if (quote.changePercent > 8) {
        score += 12;
        reasons.push('good upward momentum');
      } else if (quote.changePercent > 3) {
        score += 8;
        reasons.push('positive momentum');
      } else if (quote.changePercent > 0) {
        score += 5;
        reasons.push('slight positive movement');
      }

      // Short ratio scoring (0-10 points)
      if (shortStats.shortRatio > 10) {
        score += 10;
        reasons.push('extremely high short ratio');
      } else if (shortStats.shortRatio > 5) {
        score += 5;
        reasons.push('high short ratio');
      }

      // Now enhance with learning system
      const stockData = {
        shortInt: shortStats.shortInterest * 100,
        daysToCover: shortStats.daysTocover,
        borrowRate: shortStats.borrowRate || 0,
        volumeRatio: quote.volume / avgVolume,
        float: shortStats.float || 0,
        priceChange: quote.changePercent / 100,
        current_price: quote.price
      };

      // Get enhanced analysis from learning system
      const enhancedAnalysis = await learningSystem.calculateEnhancedScore(stockData, symbol);

      // Store market data in learning system for future reference
      await learningSystem.saveConversationWithInsights(
        `Market data update for ${symbol}`,
        'system',
        undefined,
        {
          market_conditions: {
            symbol: symbol,
            price: quote.price,
            volume: quote.volume,
            change_percent: quote.changePercent,
            short_interest: shortStats.shortInterest,
            days_to_cover: shortStats.daysTocover,
            short_ratio: shortStats.shortRatio,
            timestamp: new Date().toISOString()
          }
        }
      );

      // Create enhanced candidate
      const candidate: EnhancedSqueezeCandidate = {
        symbol,
        score,
        enhanced_score: enhancedAnalysis.final_score,
        price: quote.price,
        volume: quote.volume,
        shortInterest: shortStats.shortInterest,
        shortRatio: shortStats.shortRatio,
        daysTocover: shortStats.daysTocover,
        changePercent: quote.changePercent,
        reason: reasons.join(', '),
        ai_reasoning: enhancedAnalysis.reasoning,
        pattern_analysis: enhancedAnalysis.pattern_analysis,
        confidence_level: enhancedAnalysis.confidence_adjustment,
        historical_performance: await learningSystem.memorySystem.getStockMemory(symbol)
      };

      // Apply enhanced filtering
      if (candidate.enhanced_score >= minScore) {
        candidates.push(candidate);
      }

    } catch (error) {
      console.error(`Error processing ${symbol}:`, error);
    }
  }

  // Sort by enhanced score
  return candidates.sort((a, b) => b.enhanced_score - a.enhanced_score);
}

// Enhanced version of your existing screenSqueezers function
export async function screenSqueezers(
  rawData: any[],
  options: ScreenerOptions = {}
): Promise<EnhancedSqueezeCandidate[]> {
  const {
    minShortInt = 8,
    minDaysToCover = 1,
    minBorrowRate = 0,
    minScore = 40
  } = options;

  const candidates: EnhancedSqueezeCandidate[] = [];
  const learningSystem = new LearningSystemManager();
  await learningSystem.initialize();

  for (const data of rawData) {
    try {
      const quote = data.quote;
      const shortStats = data.shortStats;
      const symbol = data.symbol;

      if (!quote || !shortStats || !symbol) {
        console.warn(`Missing data for screening:`, { symbol, hasQuote: !!quote, hasShortStats: !!shortStats });
        continue;
      }

      // Calculate traditional squeeze score
      let score = 0;
      let reasons: string[] = [];

      // Short interest scoring (0-30 points) - More realistic thresholds
      const shortInt = shortStats.shortInt || 0;
      if (shortInt > 40) {
        score += 30;
        reasons.push('very high short interest');
      } else if (shortInt > 25) {
        score += 20;
        reasons.push('high short interest');
      } else if (shortInt > 15) {
        score += 15;
        reasons.push('elevated short interest');
      } else if (shortInt > 8) {
        score += 10;
        reasons.push('moderate short interest');
      }

      // Days to cover scoring (0-25 points) - More realistic thresholds
      const daysToCover = shortStats.daysToCover || 0;
      if (daysToCover > 5) {
        score += 25;
        reasons.push('very high days to cover');
      } else if (daysToCover > 3) {
        score += 20;
        reasons.push('high days to cover');
      } else if (daysToCover > 2) {
        score += 15;
        reasons.push('moderate days to cover');
      } else if (daysToCover > 1) {
        score += 10;
        reasons.push('good days to cover');
      }

      // Volume surge scoring (0-20 points) - More granular scoring
      const volumeRatio = shortStats.volumeRatio || 1.5; // Assume some volume activity
      if (volumeRatio > 4) {
        score += 20;
        reasons.push('volume surge');
      } else if (volumeRatio > 2.5) {
        score += 15;
        reasons.push('elevated volume');
      } else if (volumeRatio > 1.5) {
        score += 10;
        reasons.push('above average volume');
      }

      // Price momentum scoring (0-15 points) - More granular scoring
      const changePercent = quote.changePercent || 0;
      if (changePercent > 15) {
        score += 15;
        reasons.push('strong upward momentum');
      } else if (changePercent > 8) {
        score += 12;
        reasons.push('good upward momentum');
      } else if (changePercent > 3) {
        score += 8;
        reasons.push('positive momentum');
      } else if (changePercent > 0) {
        score += 5;
        reasons.push('slight positive movement');
      }

      // Borrow rate scoring (0-10 points) - Account for missing data
      const borrowRate = shortStats.borrowRate || 0;
      if (borrowRate > 100) {
        score += 10;
        reasons.push('very high borrow rate');
      } else if (borrowRate > 50) {
        score += 8;
        reasons.push('high borrow rate');
      } else if (borrowRate > 20) {
        score += 5;
        reasons.push('moderate borrow rate');
      } else {
        // Give partial credit when borrow rate data is unavailable
        score += 3;
        reasons.push('borrow rate data unavailable');
      }

      // Enhance with learning system
      const stockData = {
        shortInt: shortInt,
        daysToCover: daysToCover,
        borrowRate: borrowRate,
        volumeRatio: volumeRatio,
        float: shortStats.float || 0,
        priceChange: changePercent / 100,
        current_price: quote.price || 0
      };

      const enhancedAnalysis = await learningSystem.calculateEnhancedScore(stockData, symbol);

      // Store market data for learning
      await learningSystem.saveConversationWithInsights(
        `Market scan for ${symbol}`,
        'system',
        undefined,
        {
          market_conditions: {
            symbol: symbol,
            price: quote.price,
            volume: quote.volume,
            change_percent: changePercent,
            short_interest: shortInt,
            days_to_cover: daysToCover,
            borrow_rate: borrowRate,
            volume_ratio: volumeRatio,
            timestamp: new Date().toISOString()
          }
        }
      );

      const candidate: EnhancedSqueezeCandidate = {
        symbol,
        score,
        enhanced_score: enhancedAnalysis.final_score,
        price: quote.price || 0,
        volume: quote.volume || 0,
        shortInterest: shortInt / 100,
        shortRatio: shortStats.shortRatio || 0,
        daysTocover: daysToCover,
        changePercent: changePercent,
        reason: reasons.join(', '),
        ai_reasoning: enhancedAnalysis.reasoning,
        pattern_analysis: enhancedAnalysis.pattern_analysis,
        confidence_level: enhancedAnalysis.confidence_adjustment,
        historical_performance: await learningSystem.memorySystem.getStockMemory(symbol)
      };

      candidates.push(candidate);

    } catch (error) {
      console.error(`Error processing candidate:`, error);
    }
  }

  // Sort by enhanced score
  return candidates.sort((a, b) => b.enhanced_score - a.enhanced_score);
}