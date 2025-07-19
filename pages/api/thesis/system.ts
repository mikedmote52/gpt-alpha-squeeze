import type { NextApiRequest, NextApiResponse } from 'next';

interface SystemThesis {
  id: string;
  strategy: string;
  description: string;
  active: boolean;
  createdAt: string;
  performance: {
    totalTrades: number;
    successfulTrades: number;
    totalReturn: number;
    winRate: number;
  };
}

// In-memory storage for now (would use database in production)
const systemTheses: Map<string, SystemThesis> = new Map();

// Initialize with default system strategies
if (systemTheses.size === 0) {
  const defaultStrategies: SystemThesis[] = [
    {
      id: 'squeeze_focus',
      strategy: 'Short Squeeze Focus',
      description: 'Target stocks with high short interest (>20%), low days-to-cover (<3), and high borrow rates (>50%). Focus on low float stocks under $50 with unusual volume.',
      active: true,
      createdAt: new Date().toISOString(),
      performance: {
        totalTrades: 0,
        successfulTrades: 0,
        totalReturn: 0,
        winRate: 0
      }
    },
    {
      id: 'momentum_scalping',
      strategy: 'Momentum Scalping',
      description: 'Quick entries on stocks showing 5%+ intraday moves with volume 2x+ average. Target 10-20% gains with 5% stop losses. Hold time 1-3 days maximum.',
      active: true,
      createdAt: new Date().toISOString(),
      performance: {
        totalTrades: 0,
        successfulTrades: 0,
        totalReturn: 0,
        winRate: 0
      }
    },
    {
      id: 'risk_management',
      strategy: 'Risk Management Protocol',
      description: 'Never risk more than 15% of portfolio on single trade. Hard 10% stop losses on all positions. Max 40% sector concentration. Position sizing based on volatility.',
      active: true,
      createdAt: new Date().toISOString(),
      performance: {
        totalTrades: 0,
        successfulTrades: 0,
        totalReturn: 0,
        winRate: 0
      }
    }
  ];
  
  defaultStrategies.forEach(strategy => {
    systemTheses.set(strategy.id, strategy);
  });
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    // Get all system theses
    try {
      const theses = Array.from(systemTheses.values());
      res.status(200).json({ success: true, theses });
    } catch (error) {
      console.error('Error fetching system theses:', error);
      res.status(500).json({ success: false, error: 'Failed to fetch system strategies' });
    }
  }
  else if (req.method === 'POST') {
    // Create new system thesis
    try {
      const { strategy, description, active = true } = req.body;
      
      if (!strategy || !description) {
        return res.status(400).json({ 
          success: false, 
          error: 'Strategy name and description are required' 
        });
      }
      
      const id = strategy.toLowerCase().replace(/\s+/g, '_');
      
      if (systemTheses.has(id)) {
        return res.status(409).json({ 
          success: false, 
          error: 'Strategy with this name already exists' 
        });
      }
      
      const newThesis: SystemThesis = {
        id,
        strategy,
        description,
        active,
        createdAt: new Date().toISOString(),
        performance: {
          totalTrades: 0,
          successfulTrades: 0,
          totalReturn: 0,
          winRate: 0
        }
      };
      
      systemTheses.set(id, newThesis);
      
      res.status(201).json({ success: true, thesis: newThesis });
    } catch (error) {
      console.error('Error creating system thesis:', error);
      res.status(500).json({ success: false, error: 'Failed to create strategy' });
    }
  }
  else if (req.method === 'PUT') {
    // Update system thesis performance
    try {
      const { id, performance } = req.body;
      
      if (!id || !systemTheses.has(id)) {
        return res.status(404).json({ success: false, error: 'Strategy not found' });
      }
      
      const existingThesis = systemTheses.get(id)!;
      const updatedThesis = {
        ...existingThesis,
        performance: {
          ...existingThesis.performance,
          ...performance,
          winRate: performance.totalTrades > 0 ? 
            performance.successfulTrades / performance.totalTrades : 0
        }
      };
      
      systemTheses.set(id, updatedThesis);
      
      res.status(200).json({ success: true, thesis: updatedThesis });
    } catch (error) {
      console.error('Error updating system thesis:', error);
      res.status(500).json({ success: false, error: 'Failed to update strategy' });
    }
  }
  else {
    res.status(405).json({ success: false, error: 'Method not allowed' });
  }
}