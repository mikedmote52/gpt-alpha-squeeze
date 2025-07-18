// Real market data implementation using multiple APIs

// API configurations
const ALPHAVANTAGE_API_KEY = process.env.ALPHAVANTAGE_API_KEY || 'IN84O862OXIYYX8B';
const FMP_API_KEY = process.env.FMP_API_KEY || 'CA25ofSLfa1mBftG4L4oFQvKUwtlhRfU';
const FINNHUB_API_KEY = process.env.FINNHUB_API_KEY || 'd1m8l0hr01qvvurkq6h0d1m8l0hr01qvvurkq6hg';
const ALPACA_API_KEY = process.env.ALPACA_KEY_ID || 'PKX1WGCFOD3XXA9LBAR8';
const ALPACA_SECRET = process.env.ALPACA_SECRET_KEY || 'vCQUe2hVPNLLvkw4DxviLEngZtk5zvCs7jsWT3nR';

// Cache for API responses to avoid rate limiting
const cache = new Map();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

function getCachedData(key: string) {
  const cached = cache.get(key);
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    return cached.data;
  }
  return null;
}

function setCachedData(key: string, data: any) {
  cache.set(key, { data, timestamp: Date.now() });
}

export async function getQuote(symbol: string) {
  const cacheKey = `quote_${symbol}`;
  const cached = getCachedData(cacheKey);
  if (cached) return cached;

  try {
    // Try Alpaca first (most reliable for basic quotes)
    const alpacaUrl = `https://data.alpaca.markets/v2/stocks/${symbol}/quotes/latest`;
    const alpacaResponse = await fetch(alpacaUrl, {
      headers: {
        'APCA-API-KEY-ID': ALPACA_API_KEY,
        'APCA-API-SECRET-KEY': ALPACA_SECRET
      }
    });

    if (alpacaResponse.ok) {
      const alpacaData = await alpacaResponse.json();
      const quote = {
        symbol,
        price: alpacaData.quote?.ap || 0,
        change: 0,
        changePercent: 0,
        volume: 0,
        timestamp: new Date().toISOString()
      };
      setCachedData(cacheKey, quote);
      return quote;
    }

    // Fallback to FMP
    const fmpUrl = `https://financialmodelingprep.com/api/v3/quote/${symbol}?apikey=${FMP_API_KEY}`;
    const fmpResponse = await fetch(fmpUrl);
    
    if (fmpResponse.ok) {
      const fmpData = await fmpResponse.json();
      const data = fmpData[0];
      
      if (data) {
        const quote = {
          symbol,
          price: data.price || 0,
          change: data.change || 0,
          changePercent: data.changesPercentage || 0,
          volume: data.volume || 0,
          timestamp: new Date().toISOString()
        };
        setCachedData(cacheKey, quote);
        return quote;
      }
    }

    // Fallback to Alpha Vantage
    const avUrl = `https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${symbol}&apikey=${ALPHAVANTAGE_API_KEY}`;
    const avResponse = await fetch(avUrl);
    
    if (avResponse.ok) {
      const avData = await avResponse.json();
      const quote_data = avData['Global Quote'];
      
      if (quote_data) {
        const quote = {
          symbol,
          price: parseFloat(quote_data['05. price']) || 0,
          change: parseFloat(quote_data['09. change']) || 0,
          changePercent: parseFloat(quote_data['10. change percent']?.replace('%', '')) || 0,
          volume: parseInt(quote_data['06. volume']) || 0,
          timestamp: new Date().toISOString()
        };
        setCachedData(cacheKey, quote);
        return quote;
      }
    }

    throw new Error(`No quote data available for ${symbol}`);
  } catch (error) {
    console.error(`Error fetching quote for ${symbol}:`, error);
    throw error;
  }
}

export async function getShortStats(symbol: string) {
  const cacheKey = `short_${symbol}`;
  const cached = getCachedData(cacheKey);
  if (cached) return cached;

  try {
    // Try FMP for short interest data
    const fmpUrl = `https://financialmodelingprep.com/api/v4/short-interest?symbol=${symbol}&apikey=${FMP_API_KEY}`;
    const fmpResponse = await fetch(fmpUrl);
    
    if (fmpResponse.ok) {
      const fmpData = await fmpResponse.json();
      const latestData = fmpData[0]; // Most recent data
      
      if (latestData) {
        // Get additional data for calculations
        const [quote, statsData] = await Promise.all([
          getQuote(symbol),
          getCompanyStats(symbol)
        ]);

        const shortStats = {
          symbol,
          shortInt: ((latestData.shortInterest || 0) / (statsData.sharesOutstanding || 1)) * 100,
          shortRatio: latestData.shortInterest / (latestData.averageDailyVolume || 1),
          daysToCover: latestData.shortInterest / (latestData.averageDailyVolume || 1),
          borrowRate: await getBorrowRate(symbol),
          sharesShort: latestData.shortInterest || 0,
          timestamp: new Date().toISOString()
        };
        
        setCachedData(cacheKey, shortStats);
        return shortStats;
      }
    }

    // Fallback to Finnhub for basic short data
    const finnhubUrl = `https://finnhub.io/api/v1/stock/metric?symbol=${symbol}&metric=all&token=${FINNHUB_API_KEY}`;
    const finnhubResponse = await fetch(finnhubUrl);
    
    if (finnhubResponse.ok) {
      const finnhubData = await finnhubResponse.json();
      const metrics = finnhubData.metric;
      
      if (metrics) {
        const shortStats = {
          symbol,
          shortInt: metrics.shortInterestSharePercent || 0,
          shortRatio: metrics.shortRatio || 0,
          daysToCover: metrics.daysToCoverShort || 0,
          borrowRate: await getBorrowRate(symbol),
          sharesShort: metrics.shortInterestShare || 0,
          timestamp: new Date().toISOString()
        };
        
        setCachedData(cacheKey, shortStats);
        return shortStats;
      }
    }

    // If no real data available, return minimal structure with zeros
    console.warn(`No short interest data available for ${symbol}`);
    const shortStats = {
      symbol,
      shortInt: 0,
      shortRatio: 0,
      daysToCover: 0,
      borrowRate: 0,
      sharesShort: 0,
      timestamp: new Date().toISOString()
    };
    
    setCachedData(cacheKey, shortStats);
    return shortStats;
    
  } catch (error) {
    console.error(`Error fetching short stats for ${symbol}:`, error);
    throw error;
  }
}

async function getCompanyStats(symbol: string) {
  try {
    // Get company key statistics from FMP
    const fmpUrl = `https://financialmodelingprep.com/api/v3/key-metrics/${symbol}?apikey=${FMP_API_KEY}`;
    const response = await fetch(fmpUrl);
    
    if (response.ok) {
      const data = await response.json();
      const latest = data[0];
      
      return {
        sharesOutstanding: latest?.sharesOutstanding || 0,
        marketCap: latest?.marketCap || 0,
        floatShares: latest?.sharesOutstanding || 0, // Approximation
        averageVolume: latest?.averageVolume || 0
      };
    }

    // Fallback to basic data
    return {
      sharesOutstanding: 1000000000, // Default fallback
      marketCap: 0,
      floatShares: 1000000000,
      averageVolume: 1000000
    };
    
  } catch (error) {
    console.error(`Error fetching company stats for ${symbol}:`, error);
    return {
      sharesOutstanding: 1000000000,
      marketCap: 0,
      floatShares: 1000000000,
      averageVolume: 1000000
    };
  }
}

async function getBorrowRate(symbol: string) {
  try {
    // This is challenging to get for free - most borrow rate APIs are expensive
    // We'll return 0 for now and add a note that this data is unavailable
    return 0;
  } catch (error) {
    console.error(`Error fetching borrow rate for ${symbol}:`, error);
    return 0;
  }
}

export async function getMarketData(symbols: string[]) {
  const results = await Promise.allSettled(
    symbols.map(async (symbol) => {
      const [quote, shortStats] = await Promise.all([
        getQuote(symbol),
        getShortStats(symbol)
      ]);
      
      return {
        symbol,
        quote,
        shortStats
      };
    })
  );

  return results
    .filter(result => result.status === 'fulfilled')
    .map(result => (result as PromiseFulfilledResult<any>).value);
}

// Export for backward compatibility
export { getQuote as getStockQuote, getShortStats as getShortInterest };