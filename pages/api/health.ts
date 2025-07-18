import type { NextApiRequest, NextApiResponse } from 'next';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  const status = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    environment: {
      ai: {
        hasOpenAI: !!process.env.OPENAI_API_KEY,
        hasOpenRouter: !!process.env.OPENROUTER_API_KEY,
      },
      trading: {
        hasAlpacaKey: !!process.env.ALPACA_KEY_ID,
        hasAlpacaSecret: !!process.env.ALPACA_SECRET_KEY,
        alpacaUrl: process.env.ALPACA_API_URL || 'not set'
      },
      marketData: {
        hasAlphaVantage: !!process.env.ALPHAVANTAGE_API_KEY,
        hasFMP: !!process.env.FMP_API_KEY,
        hasFinnhub: !!process.env.FINNHUB_API_KEY,
        hasBenzinga: !!process.env.BENZINGA_API_KEY,
        hasNewsAPI: !!process.env.NEWS_API_KEY
      },
      notifications: {
        hasSlack: !!process.env.SLACK_WEBHOOK_URL
      }
    }
  };
  
  res.status(200).json(status);
}