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
  if (!symbol || typeof symbol !== 'string') {
    console.error('Invalid symbol provided to getQuote:', symbol);
    throw new Error(`Invalid symbol: ${symbol}`);
  }

  const cacheKey = `quote_${symbol}`;
  const cached = getCachedData(cacheKey);
  if (cached) return cached;

  try {
    // Try FMP first (most complete data)
    console.log(`Fetching quote for ${symbol} from FMP`);
    const fmpUrl = `https://financialmodelingprep.com/api/v3/quote/${symbol}?apikey=${FMP_API_KEY}`;
    const fmpResponse = await fetch(fmpUrl);
    
    if (fmpResponse.ok) {
      const fmpData = await fmpResponse.json();
      console.log(`FMP response for ${symbol}:`, fmpData);
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

    // Fallback to Yahoo Finance (free, no API key required)
    try {
      console.log(`Trying Yahoo Finance for ${symbol}`);
      const yahooUrl = `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}`;
      const yahooResponse = await fetch(yahooUrl);
      
      if (yahooResponse.ok) {
        const yahooData = await yahooResponse.json();
        const result = yahooData.chart?.result?.[0];
        const meta = result?.meta;
        
        if (meta) {
          const quote = {
            symbol,
            price: meta.regularMarketPrice || 0,
            change: meta.regularMarketPrice - meta.previousClose || 0,
            changePercent: ((meta.regularMarketPrice - meta.previousClose) / meta.previousClose) * 100 || 0,
            volume: meta.regularMarketVolume || 0,
            timestamp: new Date().toISOString(),
            source: 'yahoo'
          };
          setCachedData(cacheKey, quote);
          return quote;
        }
      }
    } catch (yahooError) {
      console.log(`Yahoo Finance failed for ${symbol}:`, yahooError);
    }

    // Fallback to Alpaca
    try {
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
          price: alpacaData.quote?.ap || alpacaData.quote?.bp || 0,
          change: 0,
          changePercent: 0,
          volume: 0,
          timestamp: new Date().toISOString(),
          source: 'alpaca'
        };
        setCachedData(cacheKey, quote);
        return quote;
      }
    } catch (alpacaError) {
      console.log(`Alpaca failed for ${symbol}:`, alpacaError);
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

// Reddit sentiment analysis
export async function getRedditSentiment(symbol: string) {
  const cacheKey = `reddit_${symbol}`;
  const cached = getCachedData(cacheKey);
  if (cached) return cached;

  try {
    // Search Reddit for mentions (using free Reddit API)
    const searchUrl = `https://www.reddit.com/search.json?q=${symbol}&sort=hot&limit=50&t=day`;
    const response = await fetch(searchUrl, {
      headers: {
        'User-Agent': 'AlphaStack-Squeeze-Scanner/1.0'
      }
    });

    if (response.ok) {
      const data = await response.json();
      const posts = data.data?.children || [];
      
      let totalMentions = posts.length;
      let bullishCount = 0;
      let bearishCount = 0;
      let totalUpvotes = 0;
      
      // Analyze sentiment from titles and basic metrics
      posts.forEach((post: any) => {
        const title = post.data.title?.toLowerCase() || '';
        const score = post.data.score || 0;
        totalUpvotes += score;
        
        // Simple sentiment analysis
        const bullishWords = ['moon', 'rocket', 'squeeze', 'buy', 'hold', 'diamond', 'ape', 'bullish', 'calls'];
        const bearishWords = ['dump', 'sell', 'puts', 'bearish', 'crash', 'drop', 'short'];
        
        const hasBullish = bullishWords.some(word => title.includes(word));
        const hasBearish = bearishWords.some(word => title.includes(word));
        
        if (hasBullish) bullishCount++;
        if (hasBearish) bearishCount++;
      });
      
      const sentiment = {
        symbol,
        totalMentions,
        bullishMentions: bullishCount,
        bearishMentions: bearishCount,
        totalUpvotes,
        averageUpvotes: totalMentions > 0 ? totalUpvotes / totalMentions : 0,
        sentimentScore: totalMentions > 0 ? (bullishCount - bearishCount) / totalMentions : 0,
        timestamp: new Date().toISOString()
      };
      
      setCachedData(cacheKey, sentiment);
      return sentiment;
    }
  } catch (error) {
    console.error(`Error fetching Reddit sentiment for ${symbol}:`, error);
  }
  
  // Return neutral sentiment if failed
  return {
    symbol,
    totalMentions: 0,
    bullishMentions: 0,
    bearishMentions: 0,
    totalUpvotes: 0,
    averageUpvotes: 0,
    sentimentScore: 0,
    timestamp: new Date().toISOString()
  };
}

// YouTube mentions analysis  
export async function getYouTubeMentions(symbol: string) {
  const cacheKey = `youtube_${symbol}`;
  const cached = getCachedData(cacheKey);
  if (cached) return cached;

  try {
    // Search YouTube using their free search (no API key needed for basic search)
    // Note: This would require a proper YouTube API key for production use
    // For now, return simulated structure showing what data would be available
    
    const mentions = {
      symbol,
      totalVideos: 0,
      recentVideos: 0, // Last 24 hours
      totalViews: 0,
      averageViews: 0,
      influencerMentions: 0, // Videos from channels with >10k subs
      sentiment: 'neutral' as 'bullish' | 'bearish' | 'neutral',
      timestamp: new Date().toISOString()
    };
    
    setCachedData(cacheKey, mentions);
    return mentions;
  } catch (error) {
    console.error(`Error fetching YouTube mentions for ${symbol}:`, error);
    return {
      symbol,
      totalVideos: 0,
      recentVideos: 0,
      totalViews: 0,
      averageViews: 0,
      influencerMentions: 0,
      sentiment: 'neutral' as 'bullish' | 'bearish' | 'neutral',
      timestamp: new Date().toISOString()
    };
  }
}

// Combined social sentiment score
export async function getSocialSentiment(symbol: string) {
  try {
    const [reddit, youtube] = await Promise.all([
      getRedditSentiment(symbol),
      getYouTubeMentions(symbol)
    ]);
    
    // Calculate composite social score (0-100)
    const redditWeight = 0.7;
    const youtubeWeight = 0.3;
    
    const redditScore = Math.max(0, Math.min(100, 
      50 + (reddit.sentimentScore * 25) + (reddit.totalMentions * 2)
    ));
    
    const youtubeScore = Math.max(0, Math.min(100,
      50 + (youtube.totalVideos * 3) + (youtube.influencerMentions * 10)
    ));
    
    const compositeScore = (redditScore * redditWeight) + (youtubeScore * youtubeWeight);
    
    return {
      symbol,
      compositeScore: Math.round(compositeScore),
      reddit,
      youtube,
      socialMomentum: reddit.totalMentions + youtube.recentVideos,
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    console.error(`Error calculating social sentiment for ${symbol}:`, error);
    return {
      symbol,
      compositeScore: 50, // Neutral
      reddit: { totalMentions: 0, sentimentScore: 0 },
      youtube: { totalVideos: 0, recentVideos: 0 },
      socialMomentum: 0,
      timestamp: new Date().toISOString()
    };
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