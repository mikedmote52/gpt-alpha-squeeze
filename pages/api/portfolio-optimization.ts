// Portfolio Optimization API - One-Click Auto-Execute All Recommendations
import type { NextApiRequest, NextApiResponse } from 'next';
import alpaca from './alpaca/client';
import { learningSystem } from '../../lib/learning';
import { enhancedScreenSqueezers } from '../../lib/enhancedScreener';

interface OptimizationResult {
  success: boolean;
  message: string;
  executedTrades: Array<{
    symbol: string;
    action: 'BUY' | 'SELL';
    quantity: number;
    price: number;
    orderId: string;
    status: 'executed' | 'failed';
    error?: string;
  }>;
  totalTrades: number;
  successfulTrades: number;
  failedTrades: number;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse<OptimizationResult>) {
  if (req.method !== 'POST') {
    return res.status(405).json({ 
      success: false, 
      message: 'Method not allowed',
      executedTrades: [],
      totalTrades: 0,
      successfulTrades: 0,
      failedTrades: 0
    });
  }

  try {
    // Get current account and positions
    const account = await alpaca.getAccount();
    const positions = await alpaca.getPositions();
    const buyingPower = parseFloat(account.buying_power);
    const portfolioValue = parseFloat(account.portfolio_value);
    
    console.log('Portfolio Optimization Started:', {
      portfolioValue,
      buyingPower,
      currentPositions: positions.length
    });

    const executedTrades: OptimizationResult['executedTrades'] = [];
    let remainingBuyingPower = buyingPower;

    // Step 1: Analyze current positions for SELL recommendations
    for (const position of positions) {
      const unrealizedPLPercent = parseFloat(position.unrealized_plpc);
      const currentPositionValue = parseFloat(position.market_value);
      const currentPrice = parseFloat(position.current_price);
      const totalShares = parseInt(position.qty);
      
      let shouldSell = false;
      let sellQuantity = 0;
      let sellReason = '';
      
      // AI-driven sell logic
      if (unrealizedPLPercent > 0.25) {
        // Big winner - take 60% profits
        shouldSell = true;
        sellQuantity = Math.floor(totalShares * 0.6);
        sellReason = `Taking 60% profits on ${position.symbol} (up ${(unrealizedPLPercent * 100).toFixed(1)}%)`;
      } else if (unrealizedPLPercent < -0.12) {
        // Big loser - cut losses completely
        shouldSell = true;
        sellQuantity = totalShares;
        sellReason = `Cutting losses on ${position.symbol} (down ${(Math.abs(unrealizedPLPercent) * 100).toFixed(1)}%)`;
      } else if (unrealizedPLPercent < -0.08) {
        // Moderate loser - reduce position by 50%
        shouldSell = true;
        sellQuantity = Math.floor(totalShares * 0.5);
        sellReason = `Reducing ${position.symbol} position by 50% (down ${(Math.abs(unrealizedPLPercent) * 100).toFixed(1)}%)`;
      } else if (currentPositionValue > portfolioValue * 0.15) {
        // Overweight position - rebalance
        shouldSell = true;
        sellQuantity = Math.floor(totalShares * 0.3);
        sellReason = `Rebalancing ${position.symbol} (${((currentPositionValue/portfolioValue)*100).toFixed(1)}% of portfolio)`;
      }
      
      if (shouldSell && sellQuantity > 0) {
        try {
          const sellOrder = await alpaca.createOrder({
            symbol: position.symbol,
            qty: sellQuantity,
            side: 'sell',
            type: 'market',
            time_in_force: 'day'
          });
          
          const sellValue = sellQuantity * currentPrice;
          remainingBuyingPower += sellValue;
          
          executedTrades.push({
            symbol: position.symbol,
            action: 'SELL',
            quantity: sellQuantity,
            price: currentPrice,
            orderId: sellOrder.id,
            status: 'executed'
          });
          
          console.log(`SELL executed: ${sellQuantity} shares of ${position.symbol} - ${sellReason}`);
          
          // Save to learning system - temporarily disabled
          // TODO: await learningSystem.saveTradeExecution({
          //   symbol: position.symbol,
          //   action: 'SELL',
          //   quantity: sellQuantity,
          //   price: currentPrice,
          //   reasoning: sellReason,
          //   timestamp: new Date(),
          //   orderId: sellOrder.id,
          //   executionType: 'portfolio_optimization'
          // });
          
        } catch (error) {
          console.error(`Failed to sell ${position.symbol}:`, error);
          executedTrades.push({
            symbol: position.symbol,
            action: 'SELL',
            quantity: sellQuantity,
            price: currentPrice,
            orderId: '',
            status: 'failed',
            error: error instanceof Error ? error.message : 'Unknown error'
          });
        }
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
    
    // Step 3: Execute BUY orders for new opportunities
    for (const opp of newOpportunities) {
      // Calculate position size based on updated buying power
      const positionSize = Math.min(
        Math.floor(remainingBuyingPower * 0.15), // 15% of available buying power
        5000 // Max $5k per position
      );
      
      if (positionSize < opp.price * 10) {
        // Skip if we can't afford at least 10 shares
        continue;
      }
      
      const quantity = Math.floor(positionSize / opp.price);
      
      try {
        const buyOrder = await alpaca.createOrder({
          symbol: opp.symbol,
          qty: quantity,
          side: 'buy',
          type: 'market',
          time_in_force: 'day'
        });
        
        // Create automatic stop-loss order
        const stopLossPrice = opp.price * 0.92; // 8% stop loss
        const stopLossOrder = await alpaca.createOrder({
          symbol: opp.symbol,
          qty: quantity,
          side: 'sell',
          type: 'stop',
          time_in_force: 'gtc',
          stop_price: stopLossPrice
        });
        
        const buyValue = quantity * opp.price;
        remainingBuyingPower -= buyValue;
        
        executedTrades.push({
          symbol: opp.symbol,
          action: 'BUY',
          quantity: quantity,
          price: opp.price,
          orderId: buyOrder.id,
          status: 'executed'
        });
        
        console.log(`BUY executed: ${quantity} shares of ${opp.symbol} at $${opp.price.toFixed(2)} (Score: ${opp.enhanced_score})`);
        
        // TODO: Save to learning system
        // await learningSystem.saveTradeExecution({
        //   symbol: opp.symbol,
        //   action: 'BUY',
        //   quantity: quantity,
        //   price: opp.price,
        //   reasoning: `Portfolio optimization - New position with ${opp.enhanced_score} squeeze score`,
        //   timestamp: new Date(),
        //   orderId: buyOrder.id,
        //   executionType: 'portfolio_optimization',
        //   stopLossOrderId: stopLossOrder.id
        // });
        
      } catch (error) {
        console.error(`Failed to buy ${opp.symbol}:`, error);
        executedTrades.push({
          symbol: opp.symbol,
          action: 'BUY',
          quantity: quantity,
          price: opp.price,
          orderId: '',
          status: 'failed',
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }
    
    // Step 4: Add to existing winning positions
    for (const position of positions) {
      const unrealizedPLPercent = parseFloat(position.unrealized_plpc);
      const currentPrice = parseFloat(position.current_price);
      const totalShares = parseInt(position.qty);
      
      // Add to strong performers that aren't overweight
      if (unrealizedPLPercent > 0.10 && 
          parseFloat(position.market_value) < portfolioValue * 0.12 &&
          remainingBuyingPower > currentPrice * 25) {
        
        const addShares = Math.min(
          Math.floor(totalShares * 0.25), // 25% of current position
          Math.floor(2000 / currentPrice), // Max $2k add
          Math.floor(remainingBuyingPower * 0.1 / currentPrice) // 10% of remaining buying power
        );
        
        if (addShares > 0) {
          try {
            const addOrder = await alpaca.createOrder({
              symbol: position.symbol,
              qty: addShares,
              side: 'buy',
              type: 'market',
              time_in_force: 'day'
            });
            
            const addValue = addShares * currentPrice;
            remainingBuyingPower -= addValue;
            
            executedTrades.push({
              symbol: position.symbol,
              action: 'BUY',
              quantity: addShares,
              price: currentPrice,
              orderId: addOrder.id,
              status: 'executed'
            });
            
            console.log(`ADD executed: ${addShares} shares to ${position.symbol} position (up ${(unrealizedPLPercent * 100).toFixed(1)}%)`);
            
            // TODO: Save to learning system
            // await learningSystem.saveTradeExecution({
            //   symbol: position.symbol,
            //   action: 'BUY',
            //   quantity: addShares,
            //   price: currentPrice,
            //   reasoning: `Portfolio optimization - Adding to winner (up ${(unrealizedPLPercent * 100).toFixed(1)}%)`,
            //   timestamp: new Date(),
            //   orderId: addOrder.id,
            //   executionType: 'portfolio_optimization'
            // });
            
          } catch (error) {
            console.error(`Failed to add to ${position.symbol}:`, error);
            executedTrades.push({
              symbol: position.symbol,
              action: 'BUY',
              quantity: addShares,
              price: currentPrice,
              orderId: '',
              status: 'failed',
              error: error instanceof Error ? error.message : 'Unknown error'
            });
          }
        }
      }
    }
    
    const successfulTrades = executedTrades.filter(t => t.status === 'executed').length;
    const failedTrades = executedTrades.filter(t => t.status === 'failed').length;
    
    console.log('Portfolio Optimization Complete:', {
      totalTrades: executedTrades.length,
      successfulTrades,
      failedTrades,
      remainingBuyingPower
    });
    
    res.status(200).json({
      success: true,
      message: `Portfolio optimization complete! Executed ${successfulTrades} trades successfully${failedTrades > 0 ? ` (${failedTrades} failed)` : ''}.`,
      executedTrades,
      totalTrades: executedTrades.length,
      successfulTrades,
      failedTrades
    });
    
  } catch (error) {
    console.error('Portfolio optimization error:', error);
    res.status(500).json({
      success: false,
      message: 'Portfolio optimization failed',
      executedTrades: [],
      totalTrades: 0,
      successfulTrades: 0,
      failedTrades: 0
    });
  }
}