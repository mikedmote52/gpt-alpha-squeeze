import type { NextApiRequest, NextApiResponse } from 'next';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  const status = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    environment: {
      hasOpenAI: !!process.env.OPENAI_API_KEY,
      hasOpenRouter: !!process.env.OPENROUTER_API_KEY,
      hasAlpacaKey: !!process.env.ALPACA_KEY_ID,
      hasAlpacaSecret: !!process.env.ALPACA_SECRET_KEY,
      alpacaUrl: process.env.ALPACA_API_URL || 'not set'
    }
  };
  
  res.status(200).json(status);
}