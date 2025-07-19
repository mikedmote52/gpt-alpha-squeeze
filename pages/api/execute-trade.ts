// Trade Execution API
// Executes AI recommendations as actual trades through Alpaca

import type { NextApiRequest, NextApiResponse } from 'next';
import alpaca from './alpaca/client';
import { learningSystem } from '../../lib/learning';

interface ExecuteTradeRequest {
  symbol: string;
  action: 'BUY' | 'SELL';
  quantity?: number;
  dollarAmount?: number;
  orderType?: 'market' | 'limit' | 'stop' | 'stop_limit';
  limitPrice?: number;
  stopPrice?: number;
  timeInForce?: 'day' | 'gtc' | 'opg' | 'cls' | 'ioc' | 'fok';
  
  // Risk management
  stopLoss?: number;
  takeProfit?: number;
  
  // AI context
  recommendationId?: string;
  confidence?: number;
  expectedReturn?: number;
  reasoning?: string;
}

interface ExecuteTradeResponse {
  success: boolean;
  orderId?: string;
  message: string;
  orderDetails?: {
    symbol: string;
    action: string;
    quantity: number;
    orderType: string;
    estimatedCost: number;
    stopLoss?: number;
    takeProfit?: number;
  };
  error?: string;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ExecuteTradeResponse>
) {
  if (req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      message: 'Method not allowed. Use POST.'
    });
  }

  try {
    const {
      symbol,
      action,
      quantity,
      dollarAmount,
      orderType = 'market',
      limitPrice,
      stopPrice,
      timeInForce = 'day',
      stopLoss,
      takeProfit,
      recommendationId,
      confidence,
      expectedReturn,
      reasoning
    }: ExecuteTradeRequest = req.body;

    // Validation
    if (!symbol || !action) {
      return res.status(400).json({
        success: false,
        message: 'Symbol and action are required'
      });
    }

    if (!quantity && !dollarAmount) {
      return res.status(400).json({
        success: false,
        message: 'Either quantity or dollarAmount must be specified'
      });
    }

    // Get current market price for calculations
    const quote = await alpaca.getLatestQuote(symbol);
    const currentPrice = Number(quote.BidPrice || quote.AskPrice);

    // Calculate quantity if dollar amount provided
    let finalQuantity = quantity;
    if (dollarAmount && !quantity) {
      finalQuantity = Math.floor(dollarAmount / currentPrice);
    }

    if (!finalQuantity || finalQuantity <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Invalid quantity calculated'
      });
    }

    // Validate account has sufficient buying power
    const account = await alpaca.getAccount();
    const buyingPower = parseFloat(account.buying_power);
    const estimatedCost = finalQuantity * currentPrice;

    if (action === 'BUY' && estimatedCost > buyingPower) {
      return res.status(400).json({
        success: false,
        message: `Insufficient buying power. Required: $${estimatedCost.toFixed(2)}, Available: $${buyingPower.toFixed(2)}`
      });
    }

    // Check if we have the position for SELL orders
    if (action === 'SELL') {
      const positions = await alpaca.getPositions();
      const position = positions.find((p: any) => p.symbol === symbol);
      
      if (!position) {
        return res.status(400).json({
          success: false,
          message: `No position found for ${symbol}`
        });
      }

      const availableShares = parseInt(position.qty);
      if (finalQuantity > availableShares) {
        return res.status(400).json({
          success: false,
          message: `Insufficient shares. Requested: ${finalQuantity}, Available: ${availableShares}`
        });
      }
    }

    // Build order request
    const orderRequest: any = {
      symbol,
      qty: finalQuantity,
      side: action.toLowerCase(),
      type: orderType,
      time_in_force: timeInForce
    };

    if (orderType === 'limit' && limitPrice) {
      orderRequest.limit_price = limitPrice;
    }

    if (orderType === 'stop' && stopPrice) {
      orderRequest.stop_price = stopPrice;
    }

    if (orderType === 'stop_limit' && stopPrice && limitPrice) {
      orderRequest.stop_price = stopPrice;
      orderRequest.limit_price = limitPrice;
    }

    console.log('Placing order:', orderRequest);

    // Execute the primary order
    const order = await alpaca.createOrder(orderRequest);

    // Save execution to learning system for performance tracking
    if (recommendationId) {
      await learningSystem.saveConversationWithInsights(
        `Executed ${action} order for ${finalQuantity} shares of ${symbol} at ~$${currentPrice.toFixed(2)}. Order ID: ${order.id}. Expected return: ${expectedReturn ? (expectedReturn * 100).toFixed(1) : 'N/A'}%. Confidence: ${confidence || 'N/A'}%`,
        'system',
        'trade-execution',
        {
          trade_execution: {
            order_id: order.id,
            symbol,
            action,
            quantity: finalQuantity,
            entry_price: currentPrice,
            recommendation_id: recommendationId,
            confidence,
            expected_return: expectedReturn,
            reasoning,
            stop_loss: stopLoss,
            take_profit: takeProfit,
            timestamp: new Date().toISOString(),
            // Track for performance analysis
            market_conditions: {
              entry_date: new Date().toISOString(),
              entry_price: currentPrice,
              stop_loss_price: stopLoss,
              take_profit_price: takeProfit,
              expected_return_pct: expectedReturn
            }
          }
        }
      );
    }

    // Create stop-loss order automatically for BUY orders
    let stopLossOrderId = null;
    if (action === 'BUY') {
      const autoStopLoss = stopLoss || currentPrice * 0.92; // 8% stop-loss if not specified
      try {
        const stopLossOrder = await alpaca.createOrder({
          symbol,
          qty: finalQuantity,
          side: 'sell',
          type: 'stop',
          time_in_force: 'gtc',
          stop_price: autoStopLoss
        });
        stopLossOrderId = stopLossOrder.id;
        console.log(`Created automatic stop-loss order at $${autoStopLoss.toFixed(2)}`);
      } catch (error) {
        console.error('Failed to create stop-loss order:', error);
      }
    }

    // Create take-profit order if specified
    let takeProfitOrderId = null;
    if (takeProfit && action === 'BUY') {
      try {
        const takeProfitOrder = await alpaca.createOrder({
          symbol,
          qty: finalQuantity,
          side: 'sell',
          type: 'limit',
          time_in_force: 'gtc',
          limit_price: takeProfit
        });
        takeProfitOrderId = takeProfitOrder.id;
      } catch (error) {
        console.error('Failed to create take-profit order:', error);
      }
    }

    const actualStopLoss = stopLoss || (action === 'BUY' ? currentPrice * 0.92 : undefined);
    
    res.status(200).json({
      success: true,
      orderId: order.id,
      message: `${action} order placed successfully for ${finalQuantity} shares of ${symbol}${stopLossOrderId ? ` with stop-loss at $${actualStopLoss?.toFixed(2)}` : ''}`,
      orderDetails: {
        symbol,
        action,
        quantity: finalQuantity,
        orderType,
        estimatedCost,
        stopLoss: stopLossOrderId ? actualStopLoss : undefined,
        takeProfit: takeProfitOrderId ? takeProfit : undefined
      }
    });

  } catch (error) {
    console.error('Trade execution error:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    
    res.status(500).json({
      success: false,
      message: 'Failed to execute trade',
      error: errorMessage
    });
  }
}