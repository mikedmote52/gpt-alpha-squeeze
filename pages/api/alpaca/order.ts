import type { NextApiRequest, NextApiResponse } from 'next';
import alpaca from './client';
import TradeLogger from '../../../lib/performance/tradeLogger';
import { learningSystem } from '../../../lib/learning';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Only POST allowed' });
  }
  const { symbol, qty, side, type, time_in_force, strategy_signal, strategy_reason, confidence_score, session_id } = req.body;
  try {
    const order = await alpaca.createOrder({ symbol, qty, side, type, time_in_force });
    
    // Log trade execution for performance tracking
    if (order.status === 'filled') {
      const tradeLogger = new TradeLogger();
      await tradeLogger.logOrderExecution(
        { strategy_signal, strategy_reason, confidence_score },
        order
      );
      
      // Track recommendation in learning system
      await learningSystem.saveRecommendation({
        session_id: session_id || 'trading_session',
        recommendation_type: side as 'buy' | 'sell',
        symbol: symbol,
        recommendation_text: `${side.toUpperCase()} ${qty} shares of ${symbol}`,
        confidence_score: confidence_score || 0.75,
        reasoning: strategy_reason || 'Automated squeeze trade execution',
        market_conditions: {
          order_type: type,
          time_in_force: time_in_force,
          fill_price: order.filled_avg_price,
          fill_time: order.filled_at,
          order_id: order.id
        }
      });
    }
    
    res.status(200).json(order);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to create order' });
  }
}
