import type { NextApiRequest, NextApiResponse } from 'next';
import alpaca from './client';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const positions = await alpaca.getPositions();
    res.status(200).json(positions);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch positions' });
  }
}
