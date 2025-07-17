import { getQuote, getShortStats } from './marketData';

interface SqueezeCandidate {
  symbol: string;
  score: number;
  price: number;
  volume: number;
  shortInterest: number;
  shortRatio: number;
  daysTocover: number;
  changePercent: number;
  reason: string;
}

interface ScreenerOptions {
  minPrice?: number;
  maxPrice?: number;
  minVolume?: number;
  minShortInterest?: number;
  maxMarketCap?: number;
}

export async function screenSqueezers(
  symbols: string[],
  options: ScreenerOptions = {}
): Promise<SqueezeCandidate[]> {
  const {
    minPrice = 1,
    maxPrice = 500,
    minVolume = 100000,
    minShortInterest = 0.15,
  } = options;

  const candidates: SqueezeCandidate[] = [];

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

      // Calculate squeeze score (0-100)
      let score = 0;
      let reasons: string[] = [];

      // Short interest scoring (0-30 points)
      if (shortStats.shortInterest > 0.30) {
        score += 30;
        reasons.push('very high short interest');
      } else if (shortStats.shortInterest > 0.20) {
        score += 20;
        reasons.push('high short interest');
      } else if (shortStats.shortInterest > 0.15) {
        score += 10;
        reasons.push('elevated short interest');
      }

      // Days to cover scoring (0-25 points)
      if (shortStats.daysTocover > 4) {
        score += 25;
        reasons.push('high days to cover');
      } else if (shortStats.daysTocover > 2) {
        score += 15;
        reasons.push('moderate days to cover');
      } else if (shortStats.daysTocover > 1) {
        score += 5;
      }

      // Volume surge scoring (0-20 points)
      const avgVolume = quote.volume; // In real implementation, compare to historical average
      if (quote.volume > avgVolume * 3) {
        score += 20;
        reasons.push('volume surge');
      } else if (quote.volume > avgVolume * 2) {
        score += 10;
        reasons.push('elevated volume');
      }

      // Price momentum scoring (0-15 points)
      if (quote.changePercent > 10) {
        score += 15;
        reasons.push('strong upward momentum');
      } else if (quote.changePercent > 5) {
        score += 10;
        reasons.push('positive momentum');
      } else if (quote.changePercent > 2) {
        score += 5;
        reasons.push('slight positive movement');
      }

      // Short ratio scoring (0-10 points)
      if (shortStats.shortRatio > 5) {
        score += 10;
        reasons.push('high short ratio');
      } else if (shortStats.shortRatio > 3) {
        score += 5;
        reasons.push('elevated short ratio');
      }

      // Only include stocks with meaningful squeeze potential
      if (score >= 25) {
        candidates.push({
          symbol,
          score,
          price: quote.price,
          volume: quote.volume,
          shortInterest: shortStats.shortInterest,
          shortRatio: shortStats.shortRatio,
          daysTocover: shortStats.daysTocover,
          changePercent: quote.changePercent,
          reason: reasons.join(', '),
        });
      }
    } catch (error) {
      console.error(`Error screening ${symbol}:`, error);
    }
  }

  // Sort by score descending
  return candidates.sort((a, b) => b.score - a.score);
}

export function getDefaultWatchlist(): string[] {
  return [
    'AAPL', 'TSLA', 'AMC', 'GME', 'PLTR', 'BB', 'NOK', 'SNDL', 'EXPR',
    'KOSS', 'NAKD', 'RKT', 'UWMC', 'MVIS', 'OCGN', 'CLOV', 'WISH',
    'SOFI', 'HOOD', 'LIXT', 'MULN', 'BBBY', 'NEGG', 'SPRT', 'IRNT'
  ];
}