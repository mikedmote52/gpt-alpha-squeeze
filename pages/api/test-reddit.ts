import type { NextApiRequest, NextApiResponse } from 'next';
import { getRedditSentiment } from '../../lib/marketData';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    // Test Reddit connection with a popular symbol
    const testSentiment = await getRedditSentiment('GME');
    
    res.status(200).json({ 
      success: true, 
      mentions: testSentiment.totalMentions,
      timestamp: testSentiment.timestamp
    });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Reddit connection failed' });
  }
}