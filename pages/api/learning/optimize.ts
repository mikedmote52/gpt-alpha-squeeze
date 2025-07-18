import type { NextApiRequest, NextApiResponse } from 'next';
import { learningSystem } from '../../../lib/learning';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Only POST allowed' });
  }

  try {
    console.log('Starting manual optimization...');
    const optimizationResult = await learningSystem.forceOptimization();
    
    res.status(200).json({
      success: true,
      data: optimizationResult,
      message: 'Strategy optimization completed successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Optimization error:', error);
    res.status(500).json({ 
      error: 'Failed to run optimization',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}