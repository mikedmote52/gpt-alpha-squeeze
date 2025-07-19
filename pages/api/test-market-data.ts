import type { NextApiRequest, NextApiResponse } from 'next';
import { getQuote } from '../../lib/marketData';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    // Test market data connection with a reliable symbol
    const testQuote = await getQuote('AAPL');
    
    if (testQuote && testQuote.price > 0) {
      res.status(200).json({ 
        success: true, 
        source: testQuote.source || 'fmp',
        price: testQuote.price,
        timestamp: testQuote.timestamp
      });
    } else {
      res.status(500).json({ success: false, error: 'No price data received' });
    }
  } catch (error) {
    res.status(500).json({ success: false, error: 'Market data connection failed' });
  }
}