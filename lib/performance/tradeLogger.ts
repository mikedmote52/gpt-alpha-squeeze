import PerformanceDatabase from './database';

class TradeLogger {
  private db: PerformanceDatabase;
  
  constructor() {
    this.db = new PerformanceDatabase();
  }

  async logOrderExecution(orderData: any, alpacaOrder: any) {
    try {
      const tradeData = {
        order_id: alpacaOrder.id,
        symbol: alpacaOrder.symbol,
        side: alpacaOrder.side as 'buy' | 'sell',
        quantity: parseFloat(alpacaOrder.qty),
        price: parseFloat(alpacaOrder.filled_avg_price || alpacaOrder.limit_price || 0),
        total_value: parseFloat(alpacaOrder.filled_qty) * parseFloat(alpacaOrder.filled_avg_price || alpacaOrder.limit_price || 0),
        execution_time: new Date(alpacaOrder.filled_at || alpacaOrder.created_at),
        strategy_signal: orderData.strategy_signal,
        confidence_score: orderData.confidence_score
      };

      await this.db.logTradeExecution(tradeData);
      
      // Handle position tracking
      if (alpacaOrder.side === 'buy') {
        await this.db.openPosition({
          symbol: alpacaOrder.symbol,
          entry_date: new Date(alpacaOrder.filled_at || alpacaOrder.created_at),
          entry_price: parseFloat(alpacaOrder.filled_avg_price || alpacaOrder.limit_price || 0),
          quantity: parseFloat(alpacaOrder.qty),
          strategy_reason: orderData.strategy_reason
        });
      } else {
        await this.db.closePosition(
          alpacaOrder.symbol,
          parseFloat(alpacaOrder.filled_avg_price || alpacaOrder.limit_price || 0),
          new Date(alpacaOrder.filled_at || alpacaOrder.created_at)
        );
      }

      console.log(`Trade logged: ${alpacaOrder.side} ${alpacaOrder.qty} ${alpacaOrder.symbol} at ${alpacaOrder.filled_avg_price || alpacaOrder.limit_price}`);
    } catch (error) {
      console.error('Error logging trade:', error);
    }
  }

  async logBulkTrades(trades: any[]) {
    for (const trade of trades) {
      await this.logOrderExecution(trade.orderData, trade.alpacaOrder);
    }
  }

  async getTradePerformance(symbol?: string, days: number = 30) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    
    const trades = await this.db.getTradeHistory(symbol, 1000);
    const recentTrades = trades.filter(trade => 
      new Date(trade.execution_time) >= startDate
    );

    const buyTrades = recentTrades.filter(t => t.side === 'buy');
    const sellTrades = recentTrades.filter(t => t.side === 'sell');
    
    const totalBuyValue = buyTrades.reduce((sum, t) => sum + t.total_value, 0);
    const totalSellValue = sellTrades.reduce((sum, t) => sum + t.total_value, 0);
    
    const tradeCount = recentTrades.length;
    const winRate = this.calculateWinRate(recentTrades);
    const avgTradeSize = totalBuyValue / buyTrades.length || 0;
    
    return {
      symbol: symbol || 'ALL',
      period_days: days,
      trade_count: tradeCount,
      total_buy_value: totalBuyValue,
      total_sell_value: totalSellValue,
      net_flow: totalSellValue - totalBuyValue,
      win_rate: winRate,
      avg_trade_size: avgTradeSize,
      trades: recentTrades
    };
  }

  private calculateWinRate(trades: any[]): number {
    if (trades.length === 0) return 0;
    
    // Group trades by symbol to calculate realized P&L
    const symbolTrades = trades.reduce((acc, trade) => {
      if (!acc[trade.symbol]) acc[trade.symbol] = [];
      acc[trade.symbol].push(trade);
      return acc;
    }, {} as { [symbol: string]: any[] });

    let totalCompletedTrades = 0;
    let winningTrades = 0;

    for (const symbol in symbolTrades) {
      const symbolTradeList = symbolTrades[symbol].sort((a, b) => 
        new Date(a.execution_time).getTime() - new Date(b.execution_time).getTime()
      );

      let position = 0;
      let avgCost = 0;
      
      for (const trade of symbolTradeList) {
        if (trade.side === 'buy') {
          const newPosition = position + trade.quantity;
          avgCost = (avgCost * position + trade.price * trade.quantity) / newPosition;
          position = newPosition;
        } else {
          if (position > 0) {
            const sellProfit = (trade.price - avgCost) * trade.quantity;
            if (sellProfit > 0) winningTrades++;
            totalCompletedTrades++;
            position = Math.max(0, position - trade.quantity);
          }
        }
      }
    }

    return totalCompletedTrades > 0 ? winningTrades / totalCompletedTrades : 0;
  }
}

export default TradeLogger;