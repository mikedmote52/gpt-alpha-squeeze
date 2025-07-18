import type { NextApiRequest, NextApiResponse } from 'next';
import { learningSystem } from '../../../lib/learning';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Only GET allowed' });
  }

  try {
    const status = await learningSystem.getLearningStatus();
    res.status(200).json({
      success: true,
      data: status,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Learning status error:', error);
    res.status(500).json({ 
      error: 'Failed to get learning status',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}