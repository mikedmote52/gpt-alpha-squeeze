import type { NextApiRequest, NextApiResponse } from 'next';
import alpaca from './client';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const account = await alpaca.getAccount();
    res.status(200).json(account);
  } catch (error) {
    console.error('Error fetching account:', error);
    res.status(500).json({ 
      error: 'Failed to fetch account data',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}