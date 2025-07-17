import { NextApiRequest, NextApiResponse } from 'next';
import { getAlpacaClient } from './client';
import { screenSqueezers, getDefaultWatchlist } from '../../../lib/screener';

interface OptimizationResult {
  currentPositions: any[];
  availableCash: number;
  suggestions: Array<{
    action: 'buy' | 'sell' | 'hold';
    symbol: string;
    quantity: number;
    reason: string;
    priority: number;
  }>;
  squeezeOpportunities: any[];
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<OptimizationResult | { error: string }>
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const alpaca = getAlpacaClient();

    // Get current positions and account info
    const [positions, account] = await Promise.all([
      alpaca.getPositions(),
      alpaca.getAccount(),
    ]);

    const availableCash = parseFloat(account.cash);
    
    // Screen for squeeze opportunities
    const watchlist = req.body.watchlist || getDefaultWatchlist();
    const squeezeOpportunities = await screenSqueezers(watchlist);

    // Generate optimization suggestions
    const suggestions: OptimizationResult['suggestions'] = [];

    // Add sell suggestions for positions that no longer meet criteria
    for (const position of positions) {
      const positionValue = parseFloat(position.market_value);
      const unrealizedPL = parseFloat(position.unrealized_pl);
      const unrealizedPLPercent = parseFloat(position.unrealized_plpc);

      // Suggest selling if position has significant losses or doesn't appear in top squeeze candidates
      const isInTopCandidates = squeezeOpportunities
        .slice(0, 10)
        .some(candidate => candidate.symbol === position.symbol);

      if (unrealizedPLPercent < -0.15) { // More than 15% loss
        suggestions.push({
          action: 'sell',
          symbol: position.symbol,
          quantity: parseInt(position.qty),
          reason: `Cut losses: down ${(unrealizedPLPercent * 100).toFixed(1)}%`,
          priority: 1,
        });
      } else if (!isInTopCandidates && unrealizedPLPercent < 0.05) {
        suggestions.push({
          action: 'sell',
          symbol: position.symbol,
          quantity: parseInt(position.qty),
          reason: 'No longer a squeeze candidate, minimal gains',
          priority: 2,
        });
      }
    }

    // Add buy suggestions for top squeeze opportunities
    const currentSymbols = new Set(positions.map(p => p.symbol));
    const topOpportunities = squeezeOpportunities
      .slice(0, 5)
      .filter(opp => !currentSymbols.has(opp.symbol));

    for (const opportunity of topOpportunities) {
      const maxInvestment = Math.min(availableCash * 0.1, 1000); // Max 10% of cash or $1000
      const quantity = Math.floor(maxInvestment / opportunity.price);

      if (quantity > 0 && opportunity.score >= 50) {
        suggestions.push({
          action: 'buy',
          symbol: opportunity.symbol,
          quantity,
          reason: `High squeeze potential: ${opportunity.reason}`,
          priority: opportunity.score >= 70 ? 1 : 2,
        });
      }
    }

    // Sort suggestions by priority and potential impact
    suggestions.sort((a, b) => a.priority - b.priority);

    const result: OptimizationResult = {
      currentPositions: positions,
      availableCash,
      suggestions,
      squeezeOpportunities: squeezeOpportunities.slice(0, 10),
    };

    res.status(200).json(result);
  } catch (error) {
    console.error('Portfolio optimization error:', error);
    res.status(500).json({ error: 'Failed to optimize portfolio' });
  }
}