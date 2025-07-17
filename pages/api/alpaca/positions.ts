import { NextApiRequest, NextApiResponse } from 'next';
import { getAlpacaClient } from './client';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const alpaca = getAlpacaClient();
    const positions = await alpaca.getPositions();
    res.status(200).json(positions);
  } catch (error) {
    console.error('Alpaca API error:', error);
    res.status(500).json({ error: 'Failed to fetch positions' });
  }
}
