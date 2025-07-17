import { NextApiRequest, NextApiResponse } from 'next';
import { getAlpacaClient } from './client';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { symbol, qty, side, type = 'market', time_in_force = 'day' } = req.body;

  if (!symbol || !qty || !side) {
    return res.status(400).json({ error: 'Missing required fields: symbol, qty, side' });
  }

  try {
    const alpaca = getAlpacaClient();
    const order = await alpaca.createOrder({
      symbol,
      qty,
      side,
      type,
      time_in_force,
    });

    res.status(200).json(order);
  } catch (error) {
    console.error('Alpaca order error:', error);
    res.status(500).json({ error: 'Failed to create order' });
  }
}
