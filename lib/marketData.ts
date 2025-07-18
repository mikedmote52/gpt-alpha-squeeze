import axios from 'axios';

interface QuoteData {
  symbol: string;
  price: number;
  change: number;
  changePercent: number;
  volume: number;
  marketCap?: number;
}

interface ShortStats {
  symbol: string;
  shortInterest: number;
  shortRatio: number;
  daysTocover: number;
  lastUpdate: string;
}

export async function getQuote(symbol: string): Promise<QuoteData> {
  try {
    const response = await axios.get(`https://data.alpaca.markets/v2/stocks/${symbol}/quotes/latest`, {
      headers: {
        'APCA-API-KEY-ID': process.env.ALPACA_API_KEY,
        'APCA-API-SECRET-KEY': process.env.ALPACA_SECRET_KEY,
      }
    });

    const quote = response.data.quote;
    const barResponse = await axios.get(`https://data.alpaca.markets/v2/stocks/${symbol}/bars/latest`, {
      headers: {
        'APCA-API-KEY-ID': process.env.ALPACA_API_KEY,
        'APCA-API-SECRET-KEY': process.env.ALPACA_SECRET_KEY,
      }
    });

    const bar = barResponse.data.bar;
    
    return {
      symbol,
      price: (quote.bid_price + quote.ask_price) / 2,
      change: bar.close - bar.open,
      changePercent: ((bar.close - bar.open) / bar.open) * 100,
      volume: bar.volume,
    };
  } catch (error) {
    console.error(`Error fetching quote for ${symbol}:`, error);
    throw new Error(`Failed to fetch quote for ${symbol}`);
  }
}

export async function getShortStats(symbol: string): Promise<ShortStats> {
  try {
    // Using a mock implementation as real short interest data requires premium APIs
    // In production, you would integrate with services like S3 Partners, Ortex, or IEX Cloud
    const mockShortData = {
      AAPL: { shortInterest: 0.12, shortRatio: 2.1, daysTocover: 1.8 },
      TSLA: { shortInterest: 0.18, shortRatio: 3.2, daysTocover: 2.1 },
      AMC: { shortInterest: 0.21, shortRatio: 4.5, daysTocover: 3.2 },
      GME: { shortInterest: 0.19, shortRatio: 4.1, daysTocover: 2.9 },
      LIXT: { shortInterest: 0.25, shortRatio: 5.2, daysTocover: 4.1 },
    };

    const mockData = mockShortData[symbol as keyof typeof mockShortData] || {
      shortInterest: Math.random() * 0.3,
      shortRatio: Math.random() * 6,
      daysTocover: Math.random() * 5,
    };

    return {
      symbol,
      shortInterest: mockData.shortInterest,
      shortRatio: mockData.shortRatio,
      daysTocover: mockData.daysTocover,
      lastUpdate: new Date().toISOString(),
    };
  } catch (error) {
    console.error(`Error fetching short stats for ${symbol}:`, error);
    throw new Error(`Failed to fetch short stats for ${symbol}`);
  }
}