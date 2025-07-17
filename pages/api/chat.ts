import { NextApiRequest, NextApiResponse } from 'next';
import OpenAI from 'openai';
import { getQuote, getShortStats } from '../../lib/marketData';
import { screenSqueezers, getDefaultWatchlist } from '../../lib/screener';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

interface ChatRequest {
  messages: ChatMessage[];
  watchlist?: string[];
}

interface ChatResponse {
  message: string;
  candidates: any[];
}

function extractTickersFromMessage(message: string): string[] {
  const tickerRegex = /\b[A-Z]{1,5}\b/g;
  const matches = message.match(tickerRegex) || [];
  return [...new Set(matches)].filter(ticker => ticker.length >= 2);
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ChatResponse | { error: string }>
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { messages, watchlist }: ChatRequest = req.body;

    if (!messages || messages.length === 0) {
      return res.status(400).json({ error: 'Messages are required' });
    }

    // Extract tickers from the user's message or use provided watchlist
    const lastUserMessage = messages.filter(m => m.role === 'user').pop();
    const tickersFromMessage = lastUserMessage ? extractTickersFromMessage(lastUserMessage.content) : [];
    const finalWatchlist = watchlist && watchlist.length > 0 ? watchlist : 
                          tickersFromMessage.length > 0 ? tickersFromMessage : 
                          getDefaultWatchlist().slice(0, 10); // Limit to 10 for API efficiency

    // Gather market data for the watchlist
    const marketDataPromises = finalWatchlist.map(async (symbol) => {
      try {
        const [quote, shortStats] = await Promise.all([
          getQuote(symbol),
          getShortStats(symbol),
        ]);
        return { symbol, quote, shortStats };
      } catch (error) {
        console.error(`Error fetching data for ${symbol}:`, error);
        return null;
      }
    });

    const marketDataResults = await Promise.all(marketDataPromises);
    const validMarketData = marketDataResults.filter(Boolean);

    // Run screener analysis
    const candidates = await screenSqueezers(finalWatchlist);

    // Build context for GPT-4
    const marketContext = validMarketData.map(data => {
      if (!data) return '';
      return `${data.symbol}: $${data.quote.price.toFixed(2)} (${data.quote.changePercent.toFixed(2)}%), Volume: ${data.quote.volume.toLocaleString()}, Short Interest: ${(data.shortStats.shortInterest * 100).toFixed(1)}%, Days to Cover: ${data.shortStats.daysTocover.toFixed(1)}`;
    }).join('\n');

    const topCandidates = candidates.slice(0, 5).map(c => 
      `${c.symbol} (Score: ${c.score}): ${c.reason}`
    ).join('\n');

    const systemPrompt = `You are Squeeze Alpha, an AI expert in short squeeze analysis and trading strategies. You have access to real-time market data and short interest statistics.

Current Market Data:
${marketContext}

Top Squeeze Candidates:
${topCandidates}

Guidelines:
- Provide actionable insights about short squeeze opportunities
- Explain the key factors that make a stock a squeeze candidate
- Discuss risks and potential rewards
- Be specific about price levels, volume patterns, and short metrics
- Never provide financial advice, but offer educational analysis
- Keep responses concise but informative

Analyze the data and respond to the user's question with expert insights about squeeze potential and market dynamics.`;

    // Call OpenAI GPT-4
    const completion = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        { role: 'system', content: systemPrompt },
        ...messages,
      ],
      max_tokens: 1000,
      temperature: 0.7,
    });

    const aiResponse = completion.choices[0]?.message?.content || 'I apologize, but I could not generate a response at this time.';

    const response: ChatResponse = {
      message: aiResponse,
      candidates: candidates.slice(0, 10),
    };

    res.status(200).json(response);
  } catch (error) {
    console.error('Chat API error:', error);
    res.status(500).json({ error: 'Failed to process chat request' });
  }
}
