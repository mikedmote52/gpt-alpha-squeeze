import type { NextApiRequest, NextApiResponse } from 'next';
import OpenAI from 'openai';

// Portfolio-specific chat with graceful degradation
const openaiKey = process.env.OPENAI_API_KEY;
const openrouterKey = process.env.OPENROUTER_API_KEY;

const openai = openaiKey ? new OpenAI({ apiKey: openaiKey }) : null;
const openrouter = openrouterKey ? new OpenAI({ 
  apiKey: openrouterKey,
  baseURL: "https://openrouter.ai/api/v1"
}) : null;

const PORTFOLIO_SYSTEM_PROMPT = `You are AlphaStack Squeeze Commander — providing portfolio analysis and management using ONLY real-time data.

CRITICAL REQUIREMENTS:
- Base ALL recommendations on actual portfolio data provided in context
- NEVER use hypothetical examples, fake tickers, or mock data
- When portfolio data is available, provide specific recommendations using that data
- When portfolio data is unavailable, clearly state this limitation and avoid making recommendations

Focus on:
- Portfolio analysis using real current positions and P&L data
- Position management based on actual holdings
- Entry/exit strategies based on real market conditions
- Risk management using actual portfolio metrics

Only provide actionable recommendations when real data is available.`;

async function getPortfolioData() {
  try {
    const holdingsResponse = await fetch(`${process.env.ALPACA_API_URL || 'https://paper-api.alpaca.markets'}/v2/positions`, {
      headers: {
        'APCA-API-KEY-ID': process.env.ALPACA_KEY_ID || '',
        'APCA-API-SECRET-KEY': process.env.ALPACA_SECRET_KEY || ''
      }
    });
    
    if (holdingsResponse.ok) {
      const positions = await holdingsResponse.json();
      return { success: true, positions };
    }
    
    return { success: false, error: 'Unable to fetch portfolio data' };
  } catch (error) {
    console.error('Portfolio fetch error:', error);
    return { success: false, error: 'Portfolio service unavailable' };
  }
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    if (req.method !== 'POST') {
      return res.status(405).json({ error: 'Only POST allowed' });
    }

    const userMessages = (req.body.messages || []) as { role: string; content: string }[];
    
    if (!userMessages.length) {
      throw new Error('No messages provided');
    }

    // Try to get portfolio data (with graceful degradation)
    const portfolioData = await getPortfolioData();
    
    let contextAddition = '';
    if (portfolioData.success && portfolioData.positions.length > 0) {
      const totalValue = portfolioData.positions.reduce((sum: number, pos: any) => sum + parseFloat(pos.market_value || 0), 0);
      const totalGainLoss = portfolioData.positions.reduce((sum: number, pos: any) => sum + parseFloat(pos.unrealized_pl || 0), 0);
      
      const portfolioSummary = portfolioData.positions.map((pos: any) => 
        `${pos.symbol}: ${pos.qty} shares @ $${parseFloat(pos.avg_entry_price || 0).toFixed(2)} | P&L: $${parseFloat(pos.unrealized_pl || 0).toFixed(2)}`
      ).join('\n');
      
      contextAddition = `\n\nCURRENT PORTFOLIO:
Total Value: $${totalValue.toFixed(2)}
Total P&L: $${totalGainLoss.toFixed(2)}
Positions: ${portfolioData.positions.length}

HOLDINGS:
${portfolioSummary}

Provide specific analysis and recommendations based on this portfolio data.`;
    } else {
      contextAddition = '\n\nPORTFOLIO STATUS: Unable to access current portfolio data. Provide general guidance and suggest checking portfolio connectivity.';
    }

    const messages = [
      { role: 'system' as const, content: PORTFOLIO_SYSTEM_PROMPT + contextAddition },
      ...userMessages.map(msg => ({ role: msg.role as 'user' | 'assistant', content: msg.content }))
    ];
    
    if (!openai && !openrouter) {
      throw new Error('No AI API configured');
    }
    
    let chatRes;
    let apiUsed = 'none';
    
    if (openai) {
      try {
        chatRes = await openai.chat.completions.create({ 
          model: 'gpt-4-turbo-preview', 
          messages,
          temperature: 0.7,
          max_tokens: 1000
        });
        apiUsed = 'openai';
      } catch (openaiError: any) {
        console.error('OpenAI error:', openaiError.message);
        if (!openrouter) throw new Error(`OpenAI failed: ${openaiError.message}`);
      }
    }
    
    if (!chatRes && openrouter) {
      try {
        chatRes = await openrouter.chat.completions.create({ 
          model: 'openai/gpt-4-turbo-preview', 
          messages,
          temperature: 0.7,
          max_tokens: 1000
        }, {
          headers: {
            "HTTP-Referer": "https://gpt-alpha-squeeze-2.onrender.com",
            "X-Title": "AlphaStack Squeeze Commander"
          }
        });
        apiUsed = 'openrouter';
      } catch (openrouterError: any) {
        throw new Error(`All APIs failed: ${openrouterError.message}`);
      }
    }
    
    res.status(200).json({
      aiReply: chatRes!.choices[0].message,
      message: chatRes!.choices[0].message.content,
      type: 'portfolio_chat',
      portfolioAccess: portfolioData.success,
      apiUsed
    });
    
  } catch (err) {
    console.error('Portfolio Chat Error:', err);
    res.status(500).json({ 
      error: (err as Error).message,
      aiReply: { content: 'Portfolio analysis temporarily unavailable. Please try basic chat mode.' },
      type: 'error'
    });
  }
}