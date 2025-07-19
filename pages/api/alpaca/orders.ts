import type { NextApiRequest, NextApiResponse } from 'next';
import alpaca from './client';

interface AlpacaOrder {
  id: string;
  symbol: string;
  side: 'buy' | 'sell';
  order_type: string;
  qty: string;
  filled_qty: string;
  filled_avg_price: string;
  status: string;
  created_at: string;
  updated_at: string;
  submitted_at: string;
  filled_at?: string;
  time_in_force: string;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Only GET allowed' });
  }

  try {
    // Get orders from Alpaca
    const orders = await alpaca.getOrders({
      status: 'all', // Get all orders (pending, filled, canceled, etc.)
      limit: 50,
      nested: true,
      until: null,
      after: null,
      direction: 'desc',
      symbols: null
    });

    // Format orders for the UI
    const formattedOrders = orders.map((order: AlpacaOrder) => ({
      id: order.id,
      symbol: order.symbol,
      side: order.side,
      orderType: order.order_type,
      qty: parseFloat(order.qty),
      filledQty: parseFloat(order.filled_qty || '0'),
      avgFillPrice: order.filled_avg_price ? parseFloat(order.filled_avg_price) : null,
      status: order.status,
      createdAt: order.created_at,
      updatedAt: order.updated_at,
      submittedAt: order.submitted_at,
      filledAt: order.filled_at,
      timeInForce: order.time_in_force,
      // Calculate completion percentage
      fillPercentage: order.qty ? (parseFloat(order.filled_qty || '0') / parseFloat(order.qty)) * 100 : 0
    }));

    // Sort by most recent first
    formattedOrders.sort((a: any, b: any) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());

    res.status(200).json({
      success: true,
      orders: formattedOrders,
      total: formattedOrders.length
    });

  } catch (error) {
    console.error('Failed to fetch orders:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to fetch orders',
      orders: [],
      total: 0
    });
  }
}