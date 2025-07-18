// @ts-nocheck
import type { NextApiRequest, NextApiResponse } from 'next';
import alpaca from './client';
import { getShortStats } from '../../../lib/marketData';
import { screenSqueezers } from '../../../lib/screener';

const DEFAULT_PARAMS = {
  minShortInt: 30,
  minDaysToCover: 7,
  minBorrowRate: 15,
  minScore: 80,
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const positions = await alpaca.getPositions();
    const account  = await alpaca.getAccount();
    const cash     = parseFloat(account.cash);

    const rawData = await Promise.all(
      positions.map(async pos => ({
        symbol: pos.symbol,
        quote: { lastPrice: parseFloat(pos.avg_entry_price), volume: 0 },
        shortStats: await getShortStats(pos.symbol),
      }))
    );

    const suggestions = screenSqueezers(rawData, DEFAULT_PARAMS);
    res.status(200).json({ positions, suggestions });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Portfolio optimization failed' });
  }
}