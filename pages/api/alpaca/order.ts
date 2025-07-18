import type { NextApiRequest, NextApiResponse } from 'next';
import alpaca from './client';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Only POST allowed' });
  }
  const { symbol, qty, side, type, time_in_force } = req.body;
  try {
    const order = await alpaca.createOrder({ symbol, qty, side, type, time_in_force });
    res.status(200).json(order);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to create order' });
  }
}
