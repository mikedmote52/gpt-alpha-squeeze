import type { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Only GET allowed' });
  }

  try {
    // Import dynamically to avoid initialization blocking
    const { learningSystem } = await import('../../../lib/learning');
    
    // Add timeout to prevent hanging
    const statusPromise = learningSystem.getLearningStatus();
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Timeout')), 5000)
    );
    
    const status = await Promise.race([statusPromise, timeoutPromise]);
    
    res.status(200).json({
      success: true,
      data: status,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Learning status error:', error);
    
    // Return fallback data instead of error
    res.status(200).json({
      success: true,
      data: {
        system_initialized: false,
        memory_system: {
          total_conversations: 0,
          recent_recommendations: 0,
          win_rate: 0
        },
        pattern_recognition: {
          total_patterns: 0,
          best_patterns: []
        },
        recommendation_tracking: {
          performance_summary: {
            win_rate: 0,
            avg_return: 0
          }
        }
      },
      timestamp: new Date().toISOString()
    });
  }
}