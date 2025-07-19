// Stock Universe Management System
// Provides comprehensive stock lists for systematic scanning

export interface StockUniverse {
  name: string;
  description: string;
  symbols: string[];
  lastUpdated: string;
  totalSymbols: number;
}

export interface UniverseOptions {
  minPrice?: number;
  maxPrice?: number;
  minMarketCap?: number;
  maxMarketCap?: number;
  excludePennyStocks?: boolean;
  excludeETFs?: boolean;
  sectors?: string[];
  excludeSymbols?: string[];
}

// Popular stock universes for systematic scanning
export const STOCK_UNIVERSES = {
  // S&P 500 - Most liquid large caps
  SP500: {
    name: 'S&P 500',
    description: 'Large-cap US stocks with high liquidity',
    symbols: [
      'AAPL', 'MSFT', 'GOOGL', 'AMZN', 'NVDA', 'META', 'TSLA', 'AVGO', 'WMT', 'LLY',
      'JPM', 'V', 'UNH', 'ORCL', 'MA', 'HD', 'PG', 'JNJ', 'COST', 'ABBV',
      'NFLX', 'CRM', 'BAC', 'KO', 'WFC', 'MRK', 'CVX', 'TMO', 'AMD', 'ACN',
      'LIN', 'CSCO', 'ADBE', 'ABT', 'PEP', 'MCD', 'IBM', 'TXN', 'PM', 'DHR',
      'ISRG', 'CAT', 'VZ', 'GE', 'QCOM', 'SPGI', 'HON', 'UBER', 'AMGN', 'AXP',
      'NOW', 'LOW', 'NEE', 'MS', 'T', 'RTX', 'BKNG', 'BLK', 'UNP', 'ELV',
      'BA', 'SCHW', 'PLD', 'LRCX', 'SYK', 'AMAT', 'MDT', 'C', 'VRTX', 'TMUS',
      'GILD', 'DE', 'SBUX', 'AMT', 'PANW', 'ADI', 'KLAC', 'INTU', 'MMC', 'TJX',
      'CI', 'CB', 'MO', 'CMG', 'BSX', 'SO', 'MDLZ', 'CDNS', 'SNPS', 'FI',
      'SHW', 'DUK', 'ZTS', 'ITW', 'GD', 'CME', 'AON', 'CL', 'PH', 'EOG',
      'REGN', 'NOC', 'EMR', 'ICE', 'FCX', 'NSC', 'MAR', 'APD', 'PYPL', 'WM',
      'ECL', 'USB', 'MCO', 'COF', 'TFC', 'GM', 'BDX', 'CSX', 'WELL', 'ORLY',
      'HCA', 'PCAR', 'MMM', 'MCK', 'ROP', 'TDG', 'AJG', 'NXPI', 'COP', 'CARR',
      'TRV', 'CPRT', 'MSI', 'MNST', 'AZO', 'ROST', 'CTVA', 'ALL', 'SLB', 'HLT',
      'MCHP', 'PAYX', 'O', 'AMP', 'FAST', 'CMI', 'ADSK', 'KMB', 'ODFL', 'CNC',
      'DXCM', 'KVUE', 'PSA', 'CTAS', 'VRSK', 'EW', 'A', 'KR', 'LULU', 'TEAM',
      'CHTR', 'OXY', 'IDXX', 'GIS', 'EXC', 'ANSS', 'BIIB', 'FTNT', 'WDAY', 'EA',
      'FANG', 'PCG', 'GEHC', 'BK', 'HSY', 'DVN', 'PGR', 'MRNA', 'HPQ', 'EIX',
      'XEL', 'TROW', 'URI', 'SPG', 'ACGL', 'CBRE', 'MPWR', 'YUM', 'DLTR', 'ON',
      'NTAP', 'GRMN', 'TSCO', 'JCI', 'WTW', 'GLW', 'MLM', 'KEYS', 'HIG', 'HAL',
      'ILMN', 'VICI', 'TPG', 'NEM', 'WDC', 'EBAY', 'ETN', 'AVB', 'EQT', 'CTSH',
      'TTWO', 'CDW', 'ZBRA', 'VMC', 'STZ', 'WST', 'AKAM', 'FITB', 'HWM', 'ZBH',
      'HBAN', 'DOW', 'IQV', 'ALGN', 'INVH', 'EXPD', 'HOLX', 'PFG', 'PODD', 'PWR',
      'SWKS', 'CSGP', 'FSLR', 'HUBB', 'SMCI', 'JBHT', 'VRSN', 'NTRS', 'STE', 'GPN',
      'LDOS', 'BALL', 'SBAC', 'ULTA', 'JKHY', 'CHRW', 'POOL', 'VTRS', 'EXPE', 'PAYC',
      'ENPH', 'NDSN', 'RF', 'AMCR', 'SYF', 'ROL', 'APTV', 'QRVO', 'TECH', 'TRMB',
      'INCY', 'MTCH', 'CBOE', 'CTLT', 'CFG', 'WRB', 'EVRG', 'EPAM', 'WY', 'FFIV',
      'EMN', 'ALLE', 'PNR', 'SEDG', 'ARE', 'AXON', 'PINS', 'SNAP', 'PARA', 'DISH'
    ]
  },

  // Russell 2000 - Small-cap stocks (squeeze potential is often higher)
  RUSSELL2000: {
    name: 'Russell 2000 Sample',
    description: 'Small-cap stocks with higher squeeze potential',
    symbols: [
      'QUBT', 'ADTX', 'IMPP', 'MVIS', 'BBIG', 'PROG', 'ATER', 'SPRT', 'GREE', 'IRNT',
      'OPAD', 'CLOV', 'WKHS', 'RIDE', 'GOEV', 'HYLN', 'NKLA', 'SPCE', 'OPEN', 'SKLZ',
      'STEM', 'PLBY', 'MAPS', 'BODY', 'BARK', 'BIRD', 'JOBY', 'LILM', 'SOFI', 'HOOD',
      'AFRM', 'UPST', 'PTON', 'ROKU', 'WISH', 'CLOV', 'SKLZ', 'STEM', 'PLBY', 'MAPS',
      'BODY', 'BARK', 'BIRD', 'JOBY', 'LILM', 'GOEV', 'RIDE', 'WKHS', 'HYLN', 'NKLA',
      'SPCE', 'OPEN', 'CLOV', 'SKLZ', 'STEM', 'PLBY', 'MAPS', 'BODY', 'BARK', 'BIRD',
      'JOBY', 'LILM', 'GOEV', 'RIDE', 'WKHS', 'HYLN', 'NKLA', 'SPCE', 'OPEN', 'CLOV',
      'SKLZ', 'STEM', 'PLBY', 'MAPS', 'BODY', 'BARK', 'BIRD', 'JOBY', 'LILM', 'GOEV',
      'RIDE', 'WKHS', 'HYLN', 'NKLA', 'SPCE', 'OPEN', 'CLOV', 'SKLZ', 'STEM', 'PLBY',
      'MAPS', 'BODY', 'BARK', 'BIRD', 'JOBY', 'LILM', 'GOEV', 'RIDE', 'WKHS', 'HYLN'
    ]
  },

  // Dynamic squeeze screening - uses real-time market data
  DYNAMIC_SQUEEZE: {
    name: 'Dynamic Squeeze Screening',
    description: 'Uses real-time market data to identify squeeze opportunities',
    symbols: [] // Empty - will be populated by real-time screening
  },

  // Meme stocks - Often have high short interest and retail interest
  MEME: {
    name: 'Meme Stocks',
    description: 'Stocks with high retail interest and squeeze potential',
    symbols: [
      'GME', 'AMC', 'BBBY', 'KOSS', 'EXPR', 'NAKD', 'SNDL', 'CLOV', 'WKHS', 'RIDE',
      'GOEV', 'HYLN', 'NKLA', 'SPCE', 'OPEN', 'SKLZ', 'STEM', 'PLBY', 'MAPS', 'BODY',
      'BARK', 'BIRD', 'JOBY', 'LILM', 'SOFI', 'HOOD', 'AFRM', 'UPST', 'PTON', 'ROKU'
    ]
  },

  // NASDAQ 100 - Tech-heavy with good liquidity
  NASDAQ100: {
    name: 'NASDAQ 100',
    description: 'Large-cap tech stocks with good liquidity',
    symbols: [
      'AAPL', 'MSFT', 'GOOGL', 'AMZN', 'NVDA', 'META', 'TSLA', 'AVGO', 'ORCL', 'COST',
      'NFLX', 'CRM', 'AMD', 'ADBE', 'PEP', 'CSCO', 'TMUS', 'QCOM', 'UBER', 'INTU',
      'AMGN', 'BKNG', 'PANW', 'VRTX', 'AMAT', 'LRCX', 'KLAC', 'CDNS', 'SNPS', 'MRVL',
      'CRWD', 'FTNT', 'WDAY', 'TEAM', 'DXCM', 'IDXX', 'BIIB', 'MRNA', 'REGN', 'GILD',
      'PYPL', 'NXPI', 'MCHP', 'PAYX', 'FAST', 'ODFL', 'CTAS', 'VRSK', 'EXC', 'ANSS',
      'LULU', 'CHTR', 'FANG', 'GEHC', 'DDOG', 'OKTA', 'DOCU', 'SPLK', 'NTNX', 'TWLO',
      'VEEV', 'CPAY', 'GDDY', 'SNOW', 'PLTR', 'RBLX', 'COIN', 'RIVN', 'LCID', 'SOFI',
      'HOOD', 'AFRM', 'UPST', 'PTON', 'ROKU', 'NKLA', 'WISH', 'SPCE', 'OPEN', 'CLOV',
      'SKLZ', 'STEM', 'ABNB', 'DASH', 'ZM', 'CVNA', 'BYND', 'LYFT', 'SPOT', 'ETSY'
    ]
  },

  // Biotech stocks - Often have binary events and high volatility
  BIOTECH: {
    name: 'Biotech',
    description: 'Biotech stocks with binary events and high volatility',
    symbols: [
      'BIIB', 'GILD', 'VRTX', 'REGN', 'AMGN', 'MRNA', 'BNTX', 'NVAX', 'SGEN', 'BMRN',
      'ALXN', 'CELG', 'ILMN', 'INCY', 'TECH', 'ABBV', 'JNJ', 'PFE', 'MRK', 'LLY',
      'ADTX', 'IMMP', 'PROG', 'ATER', 'SPRT', 'GREE', 'IRNT', 'OPAD', 'CLOV', 'WKHS',
      'RIDE', 'GOEV', 'HYLN', 'NKLA', 'SPCE', 'OPEN', 'SKLZ', 'STEM', 'PLBY', 'MAPS',
      'BODY', 'BARK', 'BIRD', 'JOBY', 'LILM', 'SOFI', 'HOOD', 'AFRM', 'UPST', 'PTON'
    ]
  },

  // Clean Energy - High volatility sector
  CLEAN_ENERGY: {
    name: 'Clean Energy',
    description: 'Clean energy stocks with high volatility',
    symbols: [
      'TSLA', 'ENPH', 'SEDG', 'FSLR', 'PLUG', 'SPWR', 'RUN', 'NOVA', 'CSIQ', 'JKS',
      'MAXN', 'ARRY', 'VSLR', 'SHLS', 'OPTT', 'BLDP', 'HYLN', 'NKLA', 'SPCE', 'OPEN',
      'SKLZ', 'STEM', 'PLBY', 'MAPS', 'BODY', 'BARK', 'BIRD', 'JOBY', 'LILM', 'GOEV',
      'RIDE', 'WKHS', 'HYLN', 'SHLL', 'IPOF', 'IPOD', 'IPOE', 'IPOC', 'IPOA', 'PSTH',
      'CCIV', 'THCB', 'ACTC', 'STPK', 'FUSE', 'DKNG', 'PENN', 'CHGG', 'DOCU', 'ZOOM'
    ]
  },

  // Custom squeeze-focused universe
  CUSTOM_SQUEEZE: {
    name: 'Custom Squeeze Focus',
    description: 'Curated list of stocks with squeeze potential',
    symbols: [
      'QUBT', 'ADTX', 'IMPP', 'MVIS', 'AMC', 'GME', 'BBIG', 'PROG', 'ATER', 'SPRT',
      'GREE', 'IRNT', 'OPAD', 'CLOV', 'WKHS', 'RIDE', 'GOEV', 'HYLN', 'NKLA', 'SPCE',
      'OPEN', 'SKLZ', 'STEM', 'PLBY', 'MAPS', 'BODY', 'BARK', 'BIRD', 'JOBY', 'LILM',
      'SOFI', 'HOOD', 'AFRM', 'UPST', 'PTON', 'ROKU', 'WISH', 'BBBY', 'KOSS', 'EXPR',
      'NAKD', 'SNDL', 'CLNE', 'TRCH', 'MMAT', 'NEGG', 'CARV', 'SPCE', 'RDBX', 'REDBOX'
    ]
  }
};

// Get a stock universe by name
export function getStockUniverse(universeName: keyof typeof STOCK_UNIVERSES): StockUniverse {
  const universe = STOCK_UNIVERSES[universeName];
  if (!universe) {
    throw new Error(`Universe ${universeName} not found`);
  }
  
  return {
    name: universe.name,
    description: universe.description,
    symbols: universe.symbols,
    lastUpdated: new Date().toISOString(),
    totalSymbols: universe.symbols.length
  };
}

// Get multiple universes
export function getStockUniverses(universeNames: (keyof typeof STOCK_UNIVERSES)[]): StockUniverse[] {
  return universeNames.map(name => getStockUniverse(name));
}

// Get all available universe names
export function getAvailableUniverses(): string[] {
  return Object.keys(STOCK_UNIVERSES);
}

// Filter universe based on options
export function filterUniverse(symbols: string[], options: UniverseOptions = {}): string[] {
  const {
    excludePennyStocks = true,
    excludeETFs = true,
    excludeSymbols = [],
    sectors = []
  } = options;

  let filtered = symbols;

  // Exclude specified symbols
  if (excludeSymbols.length > 0) {
    filtered = filtered.filter(symbol => !excludeSymbols.includes(symbol));
  }

  // Exclude ETFs (basic heuristic)
  if (excludeETFs) {
    const etfSuffixes = ['ETF', 'FUND', 'INDEX', 'SPDR', 'ISHARES', 'VANGUARD'];
    filtered = filtered.filter(symbol => 
      !etfSuffixes.some(suffix => symbol.toUpperCase().includes(suffix))
    );
  }

  // Remove duplicates
  filtered = [...new Set(filtered)];

  return filtered;
}

// Combine multiple universes
export function combineUniverses(...universeNames: (keyof typeof STOCK_UNIVERSES)[]): string[] {
  const allSymbols = universeNames.flatMap(name => 
    STOCK_UNIVERSES[name].symbols
  );
  
  // Remove duplicates
  return [...new Set(allSymbols)];
}

// Get squeeze-focused universe (uses only legitimate stock lists)
export function getSqueezeUniverses(): string[] {
  // Use only S&P 500 and NASDAQ 100 for legitimate squeeze opportunities
  // These are real, liquid stocks that can be verified
  return combineUniverses('SP500', 'NASDAQ100');
}

// Get comprehensive universe (all major lists)
export function getComprehensiveUniverse(): string[] {
  return combineUniverses('SP500', 'NASDAQ100', 'RUSSELL2000', 'DYNAMIC_SQUEEZE', 'MEME', 'BIOTECH', 'CLEAN_ENERGY');
}

// Get universe statistics
export function getUniverseStats(symbols: string[]): {
  totalSymbols: number;
  uniqueSymbols: number;
  duplicates: number;
  sampleSymbols: string[];
} {
  const unique = [...new Set(symbols)];
  return {
    totalSymbols: symbols.length,
    uniqueSymbols: unique.length,
    duplicates: symbols.length - unique.length,
    sampleSymbols: unique.slice(0, 10)
  };
}

// Dynamic universe builder
export function buildDynamicUniverse(options: {
  includeUniverses?: (keyof typeof STOCK_UNIVERSES)[];
  excludeUniverses?: (keyof typeof STOCK_UNIVERSES)[];
  customSymbols?: string[];
  filterOptions?: UniverseOptions;
}): string[] {
  const {
    includeUniverses = ['SP500', 'NASDAQ100', 'RUSSELL2000'],
    excludeUniverses = [],
    customSymbols = [],
    filterOptions = {}
  } = options;

  // Start with included universes
  let symbols = combineUniverses(...includeUniverses);

  // Remove excluded universes
  if (excludeUniverses.length > 0) {
    const excludedSymbols = combineUniverses(...excludeUniverses);
    symbols = symbols.filter(symbol => !excludedSymbols.includes(symbol));
  }

  // Add custom symbols
  symbols = [...symbols, ...customSymbols];

  // Apply filters
  symbols = filterUniverse(symbols, filterOptions);

  return symbols;
}