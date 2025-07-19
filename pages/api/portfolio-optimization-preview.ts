// Portfolio Optimization Preview API - Shows what trades would be made without executing
import type { NextApiRequest, NextApiResponse } from 'next';
import alpaca from './alpaca/client';
import { enhancedScreenSqueezers } from '../../lib/enhancedScreener';

interface PreviewTrade {
  symbol: string;
  action: 'BUY' | 'SELL';
  quantity: number;
  currentPrice: number;
  dollarAmount: number;
  reasoning: string;
  type: 'profit_taking' | 'loss_cutting' | 'rebalancing' | 'new_opportunity' | 'add_to_winner';
}

interface OptimizationPreview {
  success: boolean;
  trades: PreviewTrade[];
  summary: {
    totalSells: number;
    totalBuys: number;
    sellValue: number;
    buyValue: number;
    netCashFlow: number;
    affectedPositions: number;
  };
}

export default async function handler(req: NextApiRequest, res: NextApiResponse<OptimizationPreview>) {
  if (req.method !== 'GET') {
    return res.status(405).json({ 
      success: false, 
      trades: [],
      summary: {
        totalSells: 0,
        totalBuys: 0,
        sellValue: 0,
        buyValue: 0,
        netCashFlow: 0,
        affectedPositions: 0
      }
    });
  }

  try {
    // Get current account and positions
    const account = await alpaca.getAccount();
    const positions = await alpaca.getPositions();
    const buyingPower = parseFloat(account.buying_power);
    const portfolioValue = parseFloat(account.portfolio_value);
    
    const plannedTrades: PreviewTrade[] = [];
    let projectedBuyingPower = buyingPower;

    // Step 1: Analyze current positions for SELL opportunities
    for (const position of positions) {
      const unrealizedPLPercent = parseFloat(position.unrealized_plpc);
      const currentPositionValue = parseFloat(position.market_value);
      const currentPrice = parseFloat(position.current_price);
      const totalShares = parseInt(position.qty);
      
      let shouldSell = false;
      let sellQuantity = 0;
      let sellReason = '';
      let sellType: PreviewTrade['type'] = 'rebalancing';
      
      // AI-driven sell logic
      if (unrealizedPLPercent > 0.25) {
        // Big winner - take 60% profits
        shouldSell = true;
        sellQuantity = Math.floor(totalShares * 0.6);
        sellReason = `Taking 60% profits (up ${(unrealizedPLPercent * 100).toFixed(1)}%)`;
        sellType = 'profit_taking';
      } else if (unrealizedPLPercent < -0.12) {
        // Big loser - cut losses completely
        shouldSell = true;
        sellQuantity = totalShares;
        sellReason = `Cutting losses (down ${(Math.abs(unrealizedPLPercent) * 100).toFixed(1)}%)`;
        sellType = 'loss_cutting';
      } else if (unrealizedPLPercent < -0.08) {
        // Moderate loser - reduce position by 50%
        shouldSell = true;
        sellQuantity = Math.floor(totalShares * 0.5);
        sellReason = `Reducing position by 50% (down ${(Math.abs(unrealizedPLPercent) * 100).toFixed(1)}%)`;
        sellType = 'loss_cutting';
      } else if (currentPositionValue > portfolioValue * 0.15) {
        // Overweight position - rebalance
        shouldSell = true;
        sellQuantity = Math.floor(totalShares * 0.3);
        sellReason = `Rebalancing overweight position (${((currentPositionValue/portfolioValue)*100).toFixed(1)}% of portfolio)`;
        sellType = 'rebalancing';
      }
      
      if (shouldSell && sellQuantity > 0) {
        const sellValue = sellQuantity * currentPrice;
        projectedBuyingPower += sellValue;
        
        plannedTrades.push({
          symbol: position.symbol,
          action: 'SELL',
          quantity: sellQuantity,
          currentPrice: currentPrice,
          dollarAmount: sellValue,
          reasoning: sellReason,
          type: sellType
        });
      }
    }
    
    // Step 2: Find new BUY opportunities using dynamic screening - NO HARDCODED SYMBOLS
    // Get all currently held symbols to exclude from new recommendations
    const currentSymbols = positions.map((p: any) => p.symbol);
    
    // Use dynamic universe building to find real opportunities
    const { getSqueezeUniverses } = await import('../../lib/stockUniverse');
    let potentialSymbols = getSqueezeUniverses();
    
    // Filter out currently held positions
    potentialSymbols = potentialSymbols.filter(symbol => !currentSymbols.includes(symbol));
    
    // Screen for real opportunities with current market data
    const scannerResults = await enhancedScreenSqueezers(
      potentialSymbols, 
      { minScore: 75 }
    );
    
    // Get top 3 opportunities that we don't already own
    const newOpportunities = scannerResults
      .filter(opp => !currentSymbols.includes(opp.symbol))
      .slice(0, 3);
    
    // Step 3: Plan BUY orders for new opportunities
    for (const opp of newOpportunities) {
      // Calculate position size based on projected buying power
      const positionSize = Math.min(
        Math.floor(projectedBuyingPower * 0.15), // 15% of available buying power
        5000 // Max $5k per position
      );
      
      if (positionSize < opp.price * 10) {
        // Skip if we can't afford at least 10 shares
        continue;
      }
      
      const quantity = Math.floor(positionSize / opp.price);
      const buyValue = quantity * opp.price;
      
      if (buyValue <= projectedBuyingPower * 0.5) { // Don't use more than 50% of buying power
        projectedBuyingPower -= buyValue;
        
        plannedTrades.push({
          symbol: opp.symbol,
          action: 'BUY',
          quantity: quantity,
          currentPrice: opp.price,
          dollarAmount: buyValue,
          reasoning: `New position - Squeeze score: ${opp.enhanced_score}, SI: ${opp.shortInterest.toFixed(1)}%`,
          type: 'new_opportunity'
        });
      }
    }
    
    // Step 4: Plan adds to existing winning positions
    for (const position of positions) {
      const unrealizedPLPercent = parseFloat(position.unrealized_plpc);
      const currentPrice = parseFloat(position.current_price);
      const totalShares = parseInt(position.qty);
      
      // Add to strong performers that aren't overweight
      if (unrealizedPLPercent > 0.10 && 
          parseFloat(position.market_value) < portfolioValue * 0.12 &&
          projectedBuyingPower > currentPrice * 25) {
        
        const addShares = Math.min(
          Math.floor(totalShares * 0.25), // 25% of current position
          Math.floor(2000 / currentPrice), // Max $2k add
          Math.floor(projectedBuyingPower * 0.1 / currentPrice) // 10% of remaining buying power
        );
        
        if (addShares > 0) {
          const addValue = addShares * currentPrice;
          projectedBuyingPower -= addValue;
          
          plannedTrades.push({
            symbol: position.symbol,
            action: 'BUY',
            quantity: addShares,
            currentPrice: currentPrice,
            dollarAmount: addValue,
            reasoning: `Adding to winner (up ${(unrealizedPLPercent * 100).toFixed(1)}%)`,
            type: 'add_to_winner'
          });
        }
      }
    }
    
    // Calculate summary
    const sells = plannedTrades.filter(t => t.action === 'SELL');
    const buys = plannedTrades.filter(t => t.action === 'BUY');
    const sellValue = sells.reduce((sum, t) => sum + t.dollarAmount, 0);
    const buyValue = buys.reduce((sum, t) => sum + t.dollarAmount, 0);
    
    const summary = {
      totalSells: sells.length,
      totalBuys: buys.length,
      sellValue: sellValue,
      buyValue: buyValue,
      netCashFlow: sellValue - buyValue,
      affectedPositions: new Set(plannedTrades.map(t => t.symbol)).size
    };
    
    res.status(200).json({
      success: true,
      trades: plannedTrades,
      summary
    });
    
  } catch (error) {
    console.error('Portfolio optimization preview error:', error);
    res.status(500).json({
      success: false,
      trades: [],
      summary: {
        totalSells: 0,
        totalBuys: 0,
        sellValue: 0,
        buyValue: 0,
        netCashFlow: 0,
        affectedPositions: 0
      }
    });
  }
}