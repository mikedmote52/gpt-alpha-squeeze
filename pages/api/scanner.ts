// Real-time Squeeze Scanner API
// Provides systematic scanning of stock universes for squeeze opportunities

import { NextApiRequest, NextApiResponse } from 'next';
import { enhancedScreenSqueezers } from '../../lib/enhancedScreener';
import { 
  getStockUniverse, 
  getSqueezeUniverses, 
  getComprehensiveUniverse,
  buildDynamicUniverse,
  getAvailableUniverses,
  STOCK_UNIVERSES,
  filterUniverse
} from '../../lib/stockUniverse';

interface ScannerRequest {
  universe?: keyof typeof STOCK_UNIVERSES | 'SQUEEZE_FOCUS' | 'COMPREHENSIVE' | 'CUSTOM';
  customSymbols?: string[];
  limit?: number;
  minScore?: number;
  maxResults?: number;
  includeUniverses?: (keyof typeof STOCK_UNIVERSES)[];
  excludeUniverses?: (keyof typeof STOCK_UNIVERSES)[];
  filters?: {
    minPrice?: number;
    maxPrice?: number;
    minVolume?: number;
    minShortInterest?: number;
    maxMarketCap?: number;
    minDaysToCover?: number;
    minBorrowRate?: number;
    excludePennyStocks?: boolean;
    excludeETFs?: boolean;
    sectors?: string[];
  };
}

interface ScannerResponse {
  success: boolean;
  data?: {
    scan_id: string;
    timestamp: string;
    universe_used: string;
    total_symbols_scanned: number;
    opportunities_found: number;
    top_opportunities: any[];
    scan_stats: {
      avg_score: number;
      highest_score: number;
      symbols_above_threshold: number;
      scan_duration_ms: number;
    };
    universe_info: {
      name: string;
      description: string;
      total_symbols: number;
    };
  };
  error?: string;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ScannerResponse>
) {
  // Only allow GET requests
  if (req.method !== 'GET') {
    return res.status(405).json({
      success: false,
      error: 'Method not allowed. Use GET.'
    });
  }

  const startTime = Date.now();
  
  try {
    // Parse query parameters
    const {
      universe = 'SQUEEZE_FOCUS',
      customSymbols = [],
      limit = 50,
      minScore = 60,
      maxResults = 20,
      includeUniverses = [],
      excludeUniverses = [],
      filters = {}
    } = req.query as any;

    // Generate unique scan ID
    const scanId = `scan_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Get the stock universe to scan
    let symbolsToScan: string[];
    let universeInfo: { name: string; description: string; total_symbols: number };

    if (universe === 'SQUEEZE_FOCUS') {
      symbolsToScan = getSqueezeUniverses();
      universeInfo = {
        name: 'Squeeze Focus',
        description: 'Combined high-squeeze potential stocks from multiple sources',
        total_symbols: symbolsToScan.length
      };
    } else if (universe === 'COMPREHENSIVE') {
      symbolsToScan = getComprehensiveUniverse();
      universeInfo = {
        name: 'Comprehensive',
        description: 'All major stock universes combined',
        total_symbols: symbolsToScan.length
      };
    } else if (universe === 'CUSTOM') {
      symbolsToScan = buildDynamicUniverse({
        includeUniverses: includeUniverses,
        excludeUniverses: excludeUniverses,
        customSymbols: Array.isArray(customSymbols) ? customSymbols : [customSymbols].filter(Boolean),
        filterOptions: filters
      });
      universeInfo = {
        name: 'Custom',
        description: 'Custom-built universe based on user preferences',
        total_symbols: symbolsToScan.length
      };
    } else {
      // Use specific universe
      const universeData = getStockUniverse(universe);
      symbolsToScan = universeData.symbols;
      universeInfo = {
        name: universeData.name,
        description: universeData.description,
        total_symbols: universeData.totalSymbols
      };
    }

    // Apply additional filters
    if (Object.keys(filters).length > 0) {
      symbolsToScan = filterUniverse(symbolsToScan, filters);
    }

    // Limit symbols to scan if specified
    if (limit && limit > 0) {
      symbolsToScan = symbolsToScan.slice(0, parseInt(limit.toString()));
    }

    console.log(`Starting scan ${scanId} with ${symbolsToScan.length} symbols`);
    console.log(`Universe: ${universeInfo.name}, Min Score: ${minScore}`);

    // Perform the enhanced screening with realistic thresholds
    const screeningOptions = {
      minPrice: filters.minPrice || 1,
      maxPrice: filters.maxPrice || 500,
      minVolume: filters.minVolume || 50000,
      minShortInterest: filters.minShortInterest || 0.05,
      minDaysToCover: filters.minDaysToCover || 0.5,
      minBorrowRate: filters.minBorrowRate || 0,
      minScore: parseInt(minScore.toString()) || 40
    };

    const opportunities = await enhancedScreenSqueezers(symbolsToScan, screeningOptions);

    // Calculate scan statistics
    const scanStats = {
      avg_score: opportunities.length > 0 
        ? Math.round(opportunities.reduce((sum, opp) => sum + opp.enhanced_score, 0) / opportunities.length)
        : 0,
      highest_score: opportunities.length > 0 
        ? Math.max(...opportunities.map(opp => opp.enhanced_score))
        : 0,
      symbols_above_threshold: opportunities.length,
      scan_duration_ms: Date.now() - startTime
    };

    // Limit results if specified
    const topOpportunities = opportunities.slice(0, parseInt(maxResults.toString()) || 20);

    console.log(`Scan ${scanId} completed: ${opportunities.length} opportunities found in ${scanStats.scan_duration_ms}ms`);

    // Return results
    res.status(200).json({
      success: true,
      data: {
        scan_id: scanId,
        timestamp: new Date().toISOString(),
        universe_used: universe.toString(),
        total_symbols_scanned: symbolsToScan.length,
        opportunities_found: opportunities.length,
        top_opportunities: topOpportunities,
        scan_stats: scanStats,
        universe_info: universeInfo
      }
    });

  } catch (error) {
    console.error('Scanner API Error:', error);
    
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error'
    });
  }
}

// Helper function to get scan status (for future use)
export function getScanStatus(scanId: string) {
  // This could be extended to track scan progress for long-running scans
  return {
    scan_id: scanId,
    status: 'completed',
    timestamp: new Date().toISOString()
  };
}

// Helper function to get available scanner options
export function getScannerOptions() {
  return {
    available_universes: [
      'SP500',
      'NASDAQ100', 
      'RUSSELL2000',
      'HIGH_SQUEEZE',
      'MEME',
      'BIOTECH',
      'CLEAN_ENERGY',
      'CUSTOM_SQUEEZE',
      'SQUEEZE_FOCUS',
      'COMPREHENSIVE',
      'CUSTOM'
    ],
    default_filters: {
      minPrice: 1,
      maxPrice: 500,
      minVolume: 50000,
      minShortInterest: 0.05,
      minDaysToCover: 0.5,
      minBorrowRate: 0,
      minScore: 40,
      excludePennyStocks: true,
      excludeETFs: true
    },
    scan_limits: {
      max_symbols: 1000,
      max_results: 50,
      default_limit: 50,
      default_max_results: 20
    }
  };
}