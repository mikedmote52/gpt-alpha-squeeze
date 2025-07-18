// @ts-nocheck
import type { NextApiRequest, NextApiResponse } from 'next';
import OpenAI from 'openai';
import { getQuote, getShortStats } from '../../lib/marketData';
import { screenSqueezers } from '../../lib/screener';

// Initialize API clients with error checking
const openaiKey = process.env.OPENAI_API_KEY;
const openrouterKey = process.env.OPENROUTER_API_KEY;

if (!openaiKey && !openrouterKey) {
  console.error('No API keys found. Please set OPENAI_API_KEY or OPENROUTER_API_KEY');
}

const openai = openaiKey ? new OpenAI({ apiKey: openaiKey }) : null;
const openrouter = openrouterKey ? new OpenAI({ 
  apiKey: openrouterKey,
  baseURL: "https://openrouter.ai/api/v1"
}) : null;
const DEFAULT_PARAMS = { minShortInt:30, minDaysToCover:7, minBorrowRate:15, minScore:80 };

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const userMessages = (req.body.messages || []) as { role:string; content:string }[];
    const watchlist = (req.body.watchlist as string[] | undefined)
      ?? Array.from(new Set((userMessages.slice(-1)[0]?.content.match(/\b[A-Z]{2,5}\b/g)||[])));
    if (!watchlist.length) throw new Error('No tickers provided');

    const rawData = await Promise.all(
      watchlist.map(async sym => {
        const quote = await getQuote(sym);
        const shortStats = await getShortStats(sym);
        return { symbol: sym, quote, shortStats };
      })
    );
    const candidates = screenSqueezers(rawData, DEFAULT_PARAMS);

    const tableText = candidates.map(c =>
      `${c.symbol} — SI ${c.shortInt}% • DTC ${c.daysToCover}d • Borrow ${c.borrowRate}% • Score ${c.score}`
    ).join('\n');
    const systemPrompt = `
You are Squeeze Alpha, an elite short‐squeeze analyst.
Here's your current top squeeze snapshot:
${tableText}

When the user asks, you should:
 • Explain why each candidate scored where it did
 • Suggest fresh tickers to add
 • Give precise entry/exit levels and risk steps
`.trim();

    const messages = [{ role:'system', content:systemPrompt }, ...userMessages];
    
    if (!openai && !openrouter) {
      throw new Error('No AI API configured. Please set OPENAI_API_KEY or OPENROUTER_API_KEY in environment variables.');
    }
    
    let chatRes;
    let apiUsed = 'none';
    
    // Try OpenAI first if available
    if (openai) {
      try {
        console.log('Attempting OpenAI API...');
        chatRes = await openai.chat.completions.create({ 
          model: 'gpt-4-turbo-preview', 
          messages 
        });
        apiUsed = 'openai';
      } catch (openaiError: any) {
        console.error('OpenAI API error:', openaiError.message);
        if (!openrouter) {
          throw new Error(`OpenAI API failed: ${openaiError.message}`);
        }
      }
    }
    
    // Try OpenRouter as fallback or primary if OpenAI not available
    if (!chatRes && openrouter) {
      try {
        console.log('Attempting OpenRouter API...');
        chatRes = await openrouter.chat.completions.create({ 
          model: 'openai/gpt-4-turbo-preview', 
          messages,
          headers: {
            "HTTP-Referer": "https://gpt-alpha-squeeze-2.onrender.com",
            "X-Title": "Squeeze Alpha Trading System"
          }
        });
        apiUsed = 'openrouter';
      } catch (openrouterError: any) {
        throw new Error(`All APIs failed. OpenRouter error: ${openrouterError.message}`);
      }
    }
    
    console.log(`Successfully used ${apiUsed} API`);
    res.status(200).json({ candidates, aiReply: chatRes!.choices[0].message });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error:(err as Error).message });
  }
}
