// @ts-nocheck
import type { NextApiRequest, NextApiResponse } from 'next';
import OpenAI from 'openai';
import { getQuote, getShortStats } from '../../lib/marketData';
import { screenSqueezers } from '../../lib/screener';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });
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
    const chatRes = await openai.chat.completions.create({ model:'gpt-4', messages });
    res.status(200).json({ candidates, aiReply: chatRes.choices[0].message });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error:(err as Error).message });
  }
}
