import type { NextApiRequest, NextApiResponse } from 'next';
import { getQuote, getShortStats } from '../../../lib/marketData';

interface StockThesis {
  symbol: string;
  currentThesis: 'BULLISH' | 'BEARISH' | 'NEUTRAL';
  thesisText: string;
  entryReason: string;
  exitStrategy: string;
  keyMetrics: {
    entryPrice?: number;
    currentPrice: number;
    targetPrice: number;
    stopLoss: number;
    squeezeScore: number;
    shortInterest: number;
    daysHeld?: number;
  };
  lastUpdated: string;
  performanceVsThesis: 'ON_TRACK' | 'UNDERPERFORMING' | 'OUTPERFORMING';
  aiGenerated: boolean;
}

// In-memory storage for now (would use database in production)
const stockTheses: Map<string, StockThesis> = new Map();

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    // Get all stock theses with current market data
    try {
      const theses: StockThesis[] = [];
      
      for (const [symbol, thesis] of stockTheses.entries()) {
        try {
          // Update with current market data
          const quote = await getQuote(symbol);
          const shortStats = await getShortStats(symbol);
          
          const updatedThesis = {
            ...thesis,
            keyMetrics: {
              ...thesis.keyMetrics,
              currentPrice: quote.price,
              shortInterest: shortStats.shortInt * 100,
            },
            lastUpdated: new Date().toISOString()
          };
          
          // Update performance vs thesis
          if (thesis.keyMetrics.entryPrice) {
            const currentReturn = (quote.price - thesis.keyMetrics.entryPrice) / thesis.keyMetrics.entryPrice;
            if (currentReturn > 0.15) {
              updatedThesis.performanceVsThesis = 'OUTPERFORMING';
            } else if (currentReturn < -0.10) {
              updatedThesis.performanceVsThesis = 'UNDERPERFORMING';
            } else {
              updatedThesis.performanceVsThesis = 'ON_TRACK';
            }
          }
          
          theses.push(updatedThesis);
          stockTheses.set(symbol, updatedThesis); // Update in storage
        } catch (error) {
          console.error(`Error updating thesis for ${symbol}:`, error);
          theses.push(thesis); // Include original if update fails
        }
      }
      
      res.status(200).json({ success: true, theses });
    } catch (error) {
      console.error('Error fetching stock theses:', error);
      res.status(500).json({ success: false, error: 'Failed to fetch theses' });
    }
  } 
  else if (req.method === 'POST') {
    // Create new stock thesis
    try {
      const { symbol, ...thesisData } = req.body;
      
      if (!symbol) {
        return res.status(400).json({ success: false, error: 'Symbol is required' });
      }
      
      // Get current market data
      const quote = await getQuote(symbol);
      const shortStats = await getShortStats(symbol);
      
      const newThesis: StockThesis = {
        symbol: symbol.toUpperCase(),
        currentThesis: thesisData.currentThesis || 'NEUTRAL',
        thesisText: thesisData.thesisText || `Position in ${symbol} established based on AI analysis`,
        entryReason: thesisData.entryReason || 'AI-identified squeeze opportunity',
        exitStrategy: thesisData.exitStrategy || 'Monitor squeeze metrics and market conditions',
        keyMetrics: {
          entryPrice: thesisData.entryPrice || quote.price,
          currentPrice: quote.price,
          targetPrice: thesisData.targetPrice || quote.price * 1.25,
          stopLoss: thesisData.stopLoss || quote.price * 0.90,
          squeezeScore: thesisData.squeezeScore || 0,
          shortInterest: shortStats.shortInt * 100,
          daysHeld: 0
        },
        lastUpdated: new Date().toISOString(),
        performanceVsThesis: 'ON_TRACK',
        aiGenerated: thesisData.aiGenerated || true
      };
      
      stockTheses.set(symbol.toUpperCase(), newThesis);
      
      res.status(201).json({ success: true, thesis: newThesis });
    } catch (error) {
      console.error('Error creating stock thesis:', error);
      res.status(500).json({ success: false, error: 'Failed to create thesis' });
    }
  }
  else if (req.method === 'PUT') {
    // Update existing stock thesis
    try {
      const { symbol, updates } = req.body;
      
      if (!symbol || !stockTheses.has(symbol.toUpperCase())) {
        return res.status(404).json({ success: false, error: 'Thesis not found' });
      }
      
      const existingThesis = stockTheses.get(symbol.toUpperCase())!;
      const updatedThesis = {
        ...existingThesis,
        ...updates,
        lastUpdated: new Date().toISOString()
      };
      
      stockTheses.set(symbol.toUpperCase(), updatedThesis);
      
      res.status(200).json({ success: true, thesis: updatedThesis });
    } catch (error) {
      console.error('Error updating stock thesis:', error);
      res.status(500).json({ success: false, error: 'Failed to update thesis' });
    }
  }
  else {
    res.status(405).json({ success: false, error: 'Method not allowed' });
  }
}